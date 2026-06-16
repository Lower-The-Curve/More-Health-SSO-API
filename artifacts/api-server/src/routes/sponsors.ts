import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, userProfileTable, storefrontVisitTable } from "@workspace/db";
import { isNotNull, asc } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

/**
 * Bearer-token guard for the public sponsors directory endpoint.
 * Shopify (or any other external caller) must send
 *   Authorization: Bearer <SHOPIFY_FLOW_TOKEN>
 * The token is configured via the SHOPIFY_FLOW_TOKEN environment secret.
 */
function requireSponsorsToken(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.SHOPIFY_FLOW_TOKEN;
  if (!expected) {
    req.log.error("SHOPIFY_FLOW_TOKEN is not configured; refusing /sponsors request");
    res.status(503).json({ error: "Sponsors API is not configured" });
    return;
  }
  const header = req.header("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const headerToken = match?.[1]?.trim();
  // Fallback: accept `?token=...` query param when no Bearer header is sent.
  // Useful for quick smoke tests in a browser or tools that can't easily set
  // headers. The header still takes precedence when both are provided.
  const queryTokenRaw = req.query["token"];
  const queryToken = typeof queryTokenRaw === "string" ? queryTokenRaw.trim() : undefined;
  const provided = headerToken || queryToken;
  if (!provided || provided !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/**
 * GET /api/public/sponsors
 *
 * Returns the directory of users that can be selected as a sponsor on the
 * Shopify enrollment page. Each entry exposes the account number
 * (kwikApexId) plus a human-readable label so a Shopify dropdown can render
 * it. Users without an assigned kwikApexId are excluded.
 *
 * NOTE: not part of the OpenAPI spec on purpose — this endpoint is for
 * external (Shopify) consumption only and is intentionally decoupled from
 * the internal codegen pipeline.
 */
/**
 * Optional bypass: when SPONSORS_PUBLIC=1 we skip the bearer-token check on
 * GET /public/sponsors ONLY (POST /storefront-visit is still guarded). The
 * sponsor list contains only display name + kwikApexId — no contact info or
 * addresses — so opening it up for short-lived testing is low risk. Flip the
 * env var off (or unset it) to restore auth without redeploying.
 */
function sponsorsListAuth(req: Request, res: Response, next: NextFunction): void {
  if (process.env.SPONSORS_PUBLIC === "1") {
    req.log.warn("SPONSORS_PUBLIC=1 — serving /public/sponsors without auth");
    next();
    return;
  }
  requireSponsorsToken(req, res, next);
}

router.get("/public/sponsors", sponsorsListAuth, async (_req, res) => {
  const rows = await db
    .select({
      id: userProfileTable.kwikApexId,
      firstName: userProfileTable.firstName,
      lastName: userProfileTable.lastName,
    })
    .from(userProfileTable)
    .where(isNotNull(userProfileTable.kwikApexId))
    .orderBy(asc(userProfileTable.lastName), asc(userProfileTable.firstName));

  const sponsors = rows
    .filter((r): r is { id: string; firstName: string | null; lastName: string | null } =>
      typeof r.id === "string" && r.id.length > 0,
    )
    .map((r) => {
      const name = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
      return {
        id: r.id,
        name: name || r.id,
        firstName: r.firstName,
        lastName: r.lastName,
      };
    });

  res.json({ sponsors, count: sponsors.length });
});

/**
 * POST /api/public/storefront-visit
 *
 * Called by the Shopify storefront (or any landing page) every time a
 * shopper opens a personal-website URL that carries a `sponsor_ID`
 * query parameter. We record one row per visit; aggregation happens at
 * read time. Bearer-token guarded the same way as /public/sponsors.
 *
 * Body: { sponsorId: string, path?: string, referer?: string }
 */
const visitBodySchema = z.object({
  sponsorId: z.string().min(1).max(64),
  path: z.string().max(2048).optional().nullable(),
  referer: z.string().max(2048).optional().nullable(),
});

router.post("/public/storefront-visit", requireSponsorsToken, async (req, res) => {
  const parsed = visitBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const sponsorId = parsed.data.sponsorId.trim();
  if (!sponsorId) {
    res.status(400).json({ error: "sponsorId required" });
    return;
  }
  const ua = req.header("user-agent") ?? null;
  const ipHeader = req.header("x-forwarded-for");
  const ip = ipHeader ? ipHeader.split(",")[0]!.trim() : req.ip ?? null;

  await db.insert(storefrontVisitTable).values({
    sponsorId,
    path: parsed.data.path ?? null,
    referer: parsed.data.referer ?? null,
    userAgent: ua,
    ip,
  });

  res.status(204).end();
});

export default router;
