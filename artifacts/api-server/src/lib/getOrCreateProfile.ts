import {
  db,
  userProfileTable,
  orderTable,
  addressTable,
  type UserProfile,
} from "@workspace/db";
import { and, eq, isNull, sql, count } from "drizzle-orm";

/**
 * Minimal identity claims sourced from the OIDC provider at login time and
 * threaded into profile provisioning. Replaces the old Clerk SDK lookup — the
 * server no longer has an external user directory to query, so the caller
 * (the OIDC callback) supplies the freshly-authenticated identity.
 */
export interface OidcClaims {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

function makeInfluencerId(clerkUserId: string): string {
  const tail = clerkUserId.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  return `MH-${tail}`;
}

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function attachUnmappedOrders(
  clerkUserId: string,
  email: string | null,
): Promise<void> {
  if (!email) return;
  await db
    .update(orderTable)
    .set({ clerkUserId })
    .where(
      and(
        isNull(orderTable.clerkUserId),
        sql`lower(${orderTable.customerEmail}) = lower(${email})`,
      ),
    );
}

/**
 * If a pending placeholder profile exists for this buyer (email match,
 * accountStatus = 'pending'), graft its orders + sponsor onto the newly-
 * created real Clerk profile and delete the placeholder. This is the
 * counterpart to the webhook's pending-placeholder creation: when the
 * buyer eventually goes through /activate, their previously-synthesized
 * pending account merges into the real one transparently.
 *
 * Idempotent and self-skipping: no-op when no matching placeholder exists.
 */
async function mergePendingPlaceholder(
  realClerkUserId: string,
  email: string | null,
): Promise<void> {
  if (!email) return;
  await db.transaction(async (tx) => {
    const placeholders = await tx
      .select({
        clerkUserId: userProfileTable.clerkUserId,
        sponsorClerkUserId: userProfileTable.sponsorClerkUserId,
        sponsorIdRaw: userProfileTable.sponsorIdRaw,
        shopifyCustomerId: userProfileTable.shopifyCustomerId,
      })
      .from(userProfileTable)
      .where(
        and(
          eq(userProfileTable.accountStatus, "pending"),
          sql`lower(${userProfileTable.email}) = lower(${email})`,
        ),
      )
      .for("update");
    if (placeholders.length === 0) return;

    for (const p of placeholders) {
      if (p.clerkUserId === realClerkUserId) continue;
      // Move orders from placeholder → real user.
      await tx
        .update(orderTable)
        .set({ clerkUserId: realClerkUserId })
        .where(eq(orderTable.clerkUserId, p.clerkUserId));
      // Move referred-orders attribution too (rare: a pending placeholder
      // shouldn't be a referrer yet, but be safe).
      await tx
        .update(orderTable)
        .set({ referrerClerkUserId: realClerkUserId })
        .where(eq(orderTable.referrerClerkUserId, p.clerkUserId));
      // Lift sponsor info + shopify customer id onto the real profile,
      // preserving any values the real profile already had.
      await tx
        .update(userProfileTable)
        .set({
          sponsorClerkUserId: sql`COALESCE(${userProfileTable.sponsorClerkUserId}, ${p.sponsorClerkUserId})`,
          sponsorIdRaw: sql`COALESCE(${userProfileTable.sponsorIdRaw}, ${p.sponsorIdRaw})`,
          shopifyCustomerId: sql`COALESCE(${userProfileTable.shopifyCustomerId}, ${p.shopifyCustomerId})`,
        })
        .where(eq(userProfileTable.clerkUserId, realClerkUserId));
      // Anyone who was sponsored by the placeholder (extremely unlikely
      // for a pending account, but possible if data was hand-edited) gets
      // re-pointed to the real user.
      await tx
        .update(userProfileTable)
        .set({ sponsorClerkUserId: realClerkUserId })
        .where(eq(userProfileTable.sponsorClerkUserId, p.clerkUserId));
      // Finally, drop the placeholder.
      await tx
        .delete(userProfileTable)
        .where(eq(userProfileTable.clerkUserId, p.clerkUserId));
    }
  });
}

/**
 * If the user's profile is missing personal details (name / phone / address),
 * back-fill them from the most recent Shopify order matched to this user.
 * Monotonic: only fills empty slots; never overwrites values the user has set.
 * Safe to call repeatedly — it's a no-op once filled.
 */
async function backfillFromOrders(profile: UserProfile): Promise<UserProfile> {
  const needsName = !profile.firstName && !profile.lastName;
  const needsPhone = !profile.phone;
  const [latestOrder] = await db
    .select()
    .from(orderTable)
    .where(eq(orderTable.clerkUserId, profile.clerkUserId))
    .orderBy(sql`${orderTable.occurredAt} desc`)
    .limit(1);
  if (latestOrder && (needsName || needsPhone)) {
    const patch: Partial<UserProfile> = {};
    if (needsName && latestOrder.customerName) {
      const parts = latestOrder.customerName.trim().split(/\s+/);
      patch.firstName = parts[0] ?? null;
      patch.lastName = parts.slice(1).join(" ") || null;
    }
    if (needsPhone && latestOrder.customerPhone) {
      patch.phone = latestOrder.customerPhone;
    }
    if (Object.keys(patch).length > 0) {
      const [updated] = await db
        .update(userProfileTable)
        .set(patch)
        .where(eq(userProfileTable.clerkUserId, profile.clerkUserId))
        .returning();
      if (updated) profile = updated;
    }
  }
  // Seed a default address from the order's shipping address if user has none.
  if (latestOrder?.shippingAddress?.line1) {
    const existingAddrs = await db
      .select({ id: addressTable.id })
      .from(addressTable)
      .where(eq(addressTable.clerkUserId, profile.clerkUserId))
      .limit(1);
    if (existingAddrs.length === 0) {
      const sa = latestOrder.shippingAddress;
      const recipient =
        [sa.firstName, sa.lastName].filter(Boolean).join(" ") ||
        latestOrder.customerName ||
        [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
        profile.email ||
        "Recipient";
      await db.insert(addressTable).values({
        clerkUserId: profile.clerkUserId,
        label: "Shipping",
        recipient,
        line1: sa.line1 ?? "",
        line2: sa.line2 ?? null,
        city: sa.city ?? "",
        region: sa.region ?? "",
        postalCode: sa.postalCode ?? "",
        country: sa.countryCode ?? sa.country ?? "US",
        isDefault: true,
      });
    }
  }
  return profile;
}

export async function getOrCreateProfile(
  clerkUserId: string,
  claims?: OidcClaims,
): Promise<UserProfile> {
  const existing = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.clerkUserId, clerkUserId))
    .limit(1);
  if (existing[0]) {
    let row = existing[0];
    // Opportunistically fill identity fields from fresh OIDC claims when the
    // stored row is missing them (e.g. a profile first seeded as a pending
    // placeholder from a webhook). Monotonic: never overwrites set values.
    if (claims) {
      const patch: Partial<UserProfile> = {};
      if (!row.email && claims.email) patch.email = claims.email;
      if (!row.firstName && claims.firstName) patch.firstName = claims.firstName;
      if (!row.lastName && claims.lastName) patch.lastName = claims.lastName;
      if (Object.keys(patch).length > 0) {
        const [updated] = await db
          .update(userProfileTable)
          .set(patch)
          .where(eq(userProfileTable.clerkUserId, clerkUserId))
          .returning();
        if (updated) row = updated;
      }
    }
    // Always opportunistically attach any newly-arrived unmapped orders,
    // then backfill any empty profile/address slots from those orders.
    await mergePendingPlaceholder(clerkUserId, row.email);
    await attachUnmappedOrders(clerkUserId, row.email);
    // Back-fill kwikApexId for legacy rows created before we defaulted it
    // to the influencerId. Without this, share links omit `sponsor_id` and
    // referred orders can't be attributed.
    if (!row.kwikApexId) {
      const [updated] = await db
        .update(userProfileTable)
        .set({ kwikApexId: row.influencerId })
        .where(eq(userProfileTable.clerkUserId, clerkUserId))
        .returning();
      if (updated) row = updated;
    }
    return await backfillFromOrders(row);
  }

  const firstName: string | null = claims?.firstName ?? null;
  const lastName: string | null = claims?.lastName ?? null;
  const email: string | null = claims?.email ?? null;
  // Personal details beyond identity (phone, address) are no longer carried
  // through signup metadata; they're back-filled from matched Shopify orders
  // by backfillFromOrders below.
  const phone: string | null = null;

  // Determine admin status:
  //  1) Email matches ADMIN_EMAILS
  //  2) Bootstrap: first user in an empty system becomes admin
  const adminEmails = parseAdminEmails();
  let isAdmin = !!(email && adminEmails.includes(email.toLowerCase()));
  if (!isAdmin) {
    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(userProfileTable);
    if (existingCount === 0) isAdmin = true;
  }

  // Race-safe upsert: concurrent first requests for the same user both reach
  // INSERT; ON CONFLICT DO NOTHING ensures the second is a no-op, then we
  // re-read the row to return whichever one won.
  const influencerId = makeInfluencerId(clerkUserId);
  await db
    .insert(userProfileTable)
    .values({
      clerkUserId,
      influencerId,
      // Default the user's own MLM sponsor code to their influencer ID so
      // share links render `?sponsor_id=<id>` immediately on first load.
      // Admins can override this later via the admin panel; the Shopify
      // webhook matcher is case-insensitive and uses whatever value is set.
      kwikApexId: influencerId,
      rank: "Influencer",
      firstName,
      lastName,
      email,
      phone,
      walletBalance: 0,
      isAdmin,
    })
    .onConflictDoNothing({ target: userProfileTable.clerkUserId });

  const [profile] = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!profile) {
    throw new Error(
      `Failed to provision profile for Clerk user ${clerkUserId}`,
    );
  }

  // Merge any pending placeholder first so its orders + sponsor are owned
  // by the real profile before we backfill from those orders.
  await mergePendingPlaceholder(clerkUserId, profile.email);
  await attachUnmappedOrders(clerkUserId, profile.email);
  // Back-fill any blank profile fields and default address from the most
  // recent matched order.
  const backfilled = await backfillFromOrders(profile);
  // Reassign so the function returns the populated row.
  Object.assign(profile, backfilled);

  return profile;
}
