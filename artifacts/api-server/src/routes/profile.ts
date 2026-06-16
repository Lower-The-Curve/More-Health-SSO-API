import { Router, type IRouter } from "express";
import { db, userProfileTable, orderTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateProfile } from "../lib/getOrCreateProfile";

const router: IRouter = Router();

function toApi(p: Awaited<ReturnType<typeof getOrCreateProfile>>) {
  return {
    clerkUserId: p.clerkUserId,
    influencerId: p.influencerId,
    rank: p.rank,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    phoneVerified: p.phoneVerified,
    dateOfBirth: p.dateOfBirth,
    walletBalanceCents: p.walletBalance,
    isAdmin: p.isAdmin,
    // Sponsor ID exposed to the user themselves so the dashboard can render
    // share links with `?sponsor_id=<kwikApexId>`.
    kwikApexId: p.kwikApexId,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/profile", requireAuth, async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);
  res.json(toApi(profile));
});

router.patch("/profile", requireAuth, async (req, res) => {
  const current = await getOrCreateProfile(req.userId!);
  const { firstName, lastName, phone, dateOfBirth } = req.body ?? {};

  // Only invalidate phoneVerified when the phone number actually changes.
  // Otherwise saving unrelated fields (which still send the current phone)
  // would silently de-verify the user.
  let phoneChange: { phone?: string; phoneVerified?: boolean } = {};
  if (typeof phone === "string") {
    if (phone !== (current.phone ?? "")) {
      phoneChange = { phone, phoneVerified: false };
    } else {
      phoneChange = { phone };
    }
  }

  // Accept ISO date string ("1990-05-15"), or null to clear. Reject anything
  // else with a 400 so the client surfaces the error instead of silently
  // dropping the field.
  let dobPatch: { dateOfBirth?: string | null } = {};
  if (dateOfBirth === null) {
    dobPatch = { dateOfBirth: null };
  } else if (typeof dateOfBirth === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
    const d = m ? new Date(`${dateOfBirth}T00:00:00Z`) : null;
    if (
      !m ||
      !d ||
      Number.isNaN(d.getTime()) ||
      d.getUTCFullYear() !== Number(m[1]) ||
      d.getUTCMonth() + 1 !== Number(m[2]) ||
      d.getUTCDate() !== Number(m[3])
    ) {
      res.status(400).json({ error: "Invalid dateOfBirth; expected YYYY-MM-DD" });
      return;
    }
    dobPatch = { dateOfBirth };
  } else if (dateOfBirth !== undefined) {
    res.status(400).json({ error: "Invalid dateOfBirth" });
    return;
  }

  const [updated] = await db
    .update(userProfileTable)
    .set({
      ...(typeof firstName === "string" ? { firstName } : {}),
      ...(typeof lastName === "string" ? { lastName } : {}),
      ...phoneChange,
      ...dobPatch,
    })
    .where(eq(userProfileTable.clerkUserId, req.userId!))
    .returning();
  res.json(toApi(updated!));
});

/**
 * GET /placement
 *
 * Returns the user's MLM placement context: their own influencerId/kwikApexId,
 * joined date, current rank, and — if derivable — their sponsor (upline)
 * inferred from the referrer attached to their own orders by the Shopify
 * webhook ingest.
 */
router.get("/placement", requireAuth, async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);

  // Find a referrer from this user's own orders. Pick the earliest order
  // with a referrer set so re-attribution doesn't shift the displayed
  // sponsor over time.
  const [refRow] = await db
    .select({
      referrerClerkUserId: orderTable.referrerClerkUserId,
      sponsorId: orderTable.sponsorId,
    })
    .from(orderTable)
    .where(
      sql`${orderTable.clerkUserId} = ${profile.clerkUserId} AND ${orderTable.referrerClerkUserId} IS NOT NULL`,
    )
    .orderBy(sql`${orderTable.occurredAt} asc`)
    .limit(1);

  let sponsor: {
    clerkUserId: string;
    firstName: string | null;
    lastName: string | null;
    influencerId: string;
    rank: string;
    kwikApexId: string | null;
  } | null = null;
  if (refRow?.referrerClerkUserId) {
    const [s] = await db
      .select({
        clerkUserId: userProfileTable.clerkUserId,
        firstName: userProfileTable.firstName,
        lastName: userProfileTable.lastName,
        influencerId: userProfileTable.influencerId,
        rank: userProfileTable.rank,
        kwikApexId: userProfileTable.kwikApexId,
      })
      .from(userProfileTable)
      .where(eq(userProfileTable.clerkUserId, refRow.referrerClerkUserId))
      .limit(1);
    sponsor = s ?? null;
  }

  res.json({
    influencerId: profile.influencerId,
    kwikApexId: profile.kwikApexId,
    rank: profile.rank,
    joinedAt: profile.createdAt.toISOString(),
    sponsorId: refRow?.sponsorId ?? null,
    sponsor,
  });
});

export default router;
