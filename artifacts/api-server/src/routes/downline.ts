import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateProfile } from "../lib/getOrCreateProfile";
import { readShareLinks } from "./appSettings";

const router: IRouter = Router();

type DownlineRow = {
  clerk_user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  kwik_apex_id: string | null;
} & Record<string, unknown>;

/**
 * Append the given query params to a base URL. Returns null if base is empty.
 * Only non-empty values are written. Uses URL parsing so params land in the
 * query string even when the base already has a query or fragment.
 */
function withParams(
  base: string | null,
  params: Record<string, string | null>,
): string | null {
  if (!base) return null;
  const entries = Object.entries(params).filter(
    (e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0,
  );
  try {
    const u = new URL(base);
    for (const [k, v] of entries) u.searchParams.set(k, v);
    return u.toString();
  } catch {
    // Fallback for non-absolute strings: append before any fragment.
    const hashIdx = base.indexOf("#");
    const head = hashIdx === -1 ? base : base.slice(0, hashIdx);
    const tail = hashIdx === -1 ? "" : base.slice(hashIdx);
    let result = head;
    for (const [k, v] of entries) {
      const sep = result.includes("?") ? "&" : "?";
      result += `${sep}${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    }
    return `${result}${tail}`;
  }
}

/**
 * GET /api/downline/search?q=...
 *
 * Search the authenticated user's entire downline (the recursive tree of
 * members whose sponsor chain leads back to them) for a customer to place an
 * order or enrollment on behalf of. Each result includes pre-built shop and
 * enrollment URLs that carry the upline's sponsor_ID plus the selected
 * customer's email and member ID so the external page knows who the order is
 * for. The upline funds the order from their wallet on that external page.
 */
router.get("/downline/search", requireAuth, async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);
  const sponsorId = profile.kwikApexId;

  const rawQ = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  const q = rawQ.slice(0, 128);
  const like = `%${q}%`;

  const filter = q
    ? sql`AND (
        coalesce(first_name, '') ILIKE ${like}
        OR coalesce(last_name, '') ILIKE ${like}
        OR coalesce(email, '') ILIKE ${like}
        OR coalesce(kwik_apex_id, '') ILIKE ${like}
        OR (coalesce(first_name, '') || ' ' || coalesce(last_name, '')) ILIKE ${like}
      )`
    : sql``;

  const result = await db.execute<DownlineRow>(sql`
    WITH RECURSIVE downline AS (
      SELECT clerk_user_id
      FROM user_profiles
      WHERE sponsor_clerk_user_id = ${req.userId!}
      UNION
      SELECT up.clerk_user_id
      FROM user_profiles up
      JOIN downline d ON up.sponsor_clerk_user_id = d.clerk_user_id
    )
    SELECT clerk_user_id, first_name, last_name, email, kwik_apex_id
    FROM user_profiles
    WHERE clerk_user_id IN (SELECT clerk_user_id FROM downline)
      ${filter}
    ORDER BY last_name NULLS LAST, first_name NULLS LAST, clerk_user_id
    LIMIT 50
  `);

  const cfg = await readShareLinks();

  const members = result.rows.map((r) => {
    // An on-behalf link is only valid when it carries ALL required identifiers:
    // the upline's sponsor_ID plus the customer's email and member ID. If any is
    // missing we emit null so the client disables the action rather than opening
    // an incomplete link the external page can't attribute correctly.
    const hasAllIds = Boolean(sponsorId && r.email && r.kwik_apex_id);
    const params = hasAllIds
      ? {
          sponsor_ID: sponsorId,
          customer_email: r.email,
          customer_ID: r.kwik_apex_id,
          on_behalf: "1",
        }
      : null;
    return {
      clerkUserId: r.clerk_user_id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      kwikApexId: r.kwik_apex_id,
      shopOnBehalfUrl: params ? withParams(cfg.shopBaseUrl, params) : null,
      enrollOnBehalfUrl: params ? withParams(cfg.enrollBaseUrl, params) : null,
    };
  });

  res.json(members);
});

export default router;
