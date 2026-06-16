import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { db, userProfileTable, orderTable } from "@workspace/db";
import { desc, eq, sql, count, isNull, isNotNull } from "drizzle-orm";
import { AdminTransferAccountBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.use("/admin", requireAuth, requireAdmin);

/**
 * True if `candidateSponsorId` is `userId` itself or anywhere inside `userId`'s
 * downline. Used to reject sponsor assignments that would create a cycle
 * (e.g. making a user a descendant of one of their own descendants), which
 * would corrupt the recursive downline traversal.
 */
async function wouldCreateSponsorCycle(
  userId: string,
  candidateSponsorId: string,
): Promise<boolean> {
  if (userId === candidateSponsorId) return true;
  const result = await db.execute<{ clerk_user_id: string }>(sql`
    WITH RECURSIVE downline AS (
      SELECT clerk_user_id
      FROM user_profiles
      WHERE sponsor_clerk_user_id = ${userId}
      UNION
      SELECT up.clerk_user_id
      FROM user_profiles up
      JOIN downline d ON up.sponsor_clerk_user_id = d.clerk_user_id
    )
    SELECT clerk_user_id FROM downline WHERE clerk_user_id = ${candidateSponsorId}
    LIMIT 1
  `);
  return result.rows.length > 0;
}

function shopifyAdminStore(): string {
  return process.env.SHOPIFY_ADMIN_STORE ?? "morehealth-3";
}
function shopifyAdminCustomerUrl(shopifyCustomerId: string | null): string | null {
  if (!shopifyCustomerId) return null;
  return `https://admin.shopify.com/store/${shopifyAdminStore()}/customers/${shopifyCustomerId}`;
}
function shopifyAdminOrderUrl(shopifyOrderId: string | null): string | null {
  if (!shopifyOrderId) return null;
  // Shopify admin URLs accept the numeric order GID without prefix; if a full
  // gid://shopify/Order/<id> sneaks in, strip down to the numeric tail.
  const numeric = shopifyOrderId.includes("/")
    ? shopifyOrderId.split("/").pop()!
    : shopifyOrderId;
  return `https://admin.shopify.com/store/${shopifyAdminStore()}/orders/${numeric}`;
}

router.get("/admin/users", async (_req, res) => {
  const rows = await db
    .select({
      clerkUserId: userProfileTable.clerkUserId,
      influencerId: userProfileTable.influencerId,
      rank: userProfileTable.rank,
      firstName: userProfileTable.firstName,
      lastName: userProfileTable.lastName,
      email: userProfileTable.email,
      phone: userProfileTable.phone,
      walletBalance: userProfileTable.walletBalance,
      isAdmin: userProfileTable.isAdmin,
      byDesignUserId: userProfileTable.byDesignUserId,
      netfiWalletId: userProfileTable.netfiWalletId,
      kwikApexId: userProfileTable.kwikApexId,
      shopifyCustomerId: userProfileTable.shopifyCustomerId,
      accountStatus: userProfileTable.accountStatus,
      sponsorClerkUserId: userProfileTable.sponsorClerkUserId,
      sponsorIdRaw: userProfileTable.sponsorIdRaw,
      createdAt: userProfileTable.createdAt,
      ordersCount: sql<number>`(
        select count(*)::int from ${orderTable}
        where ${orderTable.clerkUserId} = ${userProfileTable.clerkUserId}
      )`,
      // Human-readable sponsor name resolved from the active attribution
      // (sponsor_clerk_user_id). Falls back to email then influencer id.
      sponsorName: sql<string | null>`(
        select coalesce(
          nullif(trim(coalesce(sp.first_name, '') || ' ' || coalesce(sp.last_name, '')), ''),
          sp.email,
          sp.influencer_id
        )
        from user_profiles sp
        where sp.clerk_user_id = ${userProfileTable.sponsorClerkUserId}
      )`,
    })
    .from(userProfileTable)
    .orderBy(desc(userProfileTable.createdAt));

  res.json(
    rows.map((u) => ({
      clerkUserId: u.clerkUserId,
      influencerId: u.influencerId,
      rank: u.rank,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      walletBalanceCents: u.walletBalance,
      isAdmin: u.isAdmin,
      byDesignUserId: u.byDesignUserId,
      netfiWalletId: u.netfiWalletId,
      kwikApexId: u.kwikApexId,
      shopifyCustomerId: u.shopifyCustomerId,
      shopifyAdminCustomerUrl: shopifyAdminCustomerUrl(u.shopifyCustomerId),
      accountStatus: u.accountStatus,
      sponsorClerkUserId: u.sponsorClerkUserId,
      sponsorIdRaw: u.sponsorIdRaw,
      sponsorName: u.sponsorName ?? null,
      ordersCount: Number(u.ordersCount ?? 0),
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

/**
 * POST /admin/users — create a member directly from the admin panel.
 *
 * This provisions a *pending* placeholder profile (no Clerk account yet),
 * mirroring the placeholder the Shopify webhook synthesizes for unmapped
 * buyers. Unlike the webhook placeholder, we DO assign a kwikApexId (= the
 * generated influencer id) so the member immediately carries an MLM id and can
 * be ordered/enrolled on behalf of. An optional sponsor places them inside an
 * upline's downline so the whole add → downline → order-on-behalf demo works.
 */
router.post("/admin/users", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email.includes("@")) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  const firstName =
    typeof body.firstName === "string" && body.firstName.trim()
      ? body.firstName.trim()
      : null;
  const lastName =
    typeof body.lastName === "string" && body.lastName.trim()
      ? body.lastName.trim()
      : null;
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : null;
  const rank =
    typeof body.rank === "string" && body.rank.trim()
      ? body.rank.trim()
      : "Influencer";
  const sponsorClerkUserId =
    typeof body.sponsorClerkUserId === "string" && body.sponsorClerkUserId.trim()
      ? body.sponsorClerkUserId.trim()
      : null;

  // Validate the sponsor exists before linking, so we never persist a dangling
  // attribution that silently drops the new member out of every downline.
  if (sponsorClerkUserId) {
    const [sponsor] = await db
      .select({ clerkUserId: userProfileTable.clerkUserId })
      .from(userProfileTable)
      .where(eq(userProfileTable.clerkUserId, sponsorClerkUserId))
      .limit(1);
    if (!sponsor) {
      res.status(400).json({ error: "Selected sponsor not found" });
      return;
    }
  }

  // Synthetic, password-less id (no Clerk account). Prefixed so it's obvious in
  // logs/DB that this row was hand-created by an admin rather than via signup.
  const clerkUserId = `admin_${randomUUID()}`;
  const influencerId = `MH-A${clerkUserId
    .slice(-6)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "X")}`;

  const [created] = await db
    .insert(userProfileTable)
    .values({
      clerkUserId,
      influencerId,
      kwikApexId: influencerId,
      rank,
      firstName,
      lastName,
      email,
      phone,
      walletBalance: 0,
      isAdmin: false,
      accountStatus: "pending",
      sponsorClerkUserId,
    })
    .returning();

  if (!created) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  let sponsorName: string | null = null;
  if (created.sponsorClerkUserId) {
    const [sp] = await db
      .select({
        firstName: userProfileTable.firstName,
        lastName: userProfileTable.lastName,
        email: userProfileTable.email,
        influencerId: userProfileTable.influencerId,
      })
      .from(userProfileTable)
      .where(eq(userProfileTable.clerkUserId, created.sponsorClerkUserId))
      .limit(1);
    if (sp) {
      sponsorName =
        [sp.firstName, sp.lastName].filter(Boolean).join(" ").trim() ||
        sp.email ||
        sp.influencerId ||
        null;
    }
  }

  req.log?.info(
    { clerkUserId, email, sponsorClerkUserId },
    "Admin created pending member",
  );

  res.status(201).json({
    clerkUserId: created.clerkUserId,
    influencerId: created.influencerId,
    rank: created.rank,
    firstName: created.firstName,
    lastName: created.lastName,
    email: created.email,
    phone: created.phone,
    walletBalanceCents: created.walletBalance,
    isAdmin: created.isAdmin,
    byDesignUserId: created.byDesignUserId,
    netfiWalletId: created.netfiWalletId,
    kwikApexId: created.kwikApexId,
    shopifyCustomerId: created.shopifyCustomerId,
    shopifyAdminCustomerUrl: shopifyAdminCustomerUrl(created.shopifyCustomerId),
    accountStatus: created.accountStatus,
    sponsorClerkUserId: created.sponsorClerkUserId,
    sponsorIdRaw: created.sponsorIdRaw,
    sponsorName,
    ordersCount: 0,
    createdAt: created.createdAt.toISOString(),
  });
});

router.patch("/admin/users/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;
  const {
    firstName,
    lastName,
    phone,
    rank,
    walletBalanceCents,
    isAdmin,
    byDesignUserId,
    netfiWalletId,
    kwikApexId,
    shopifyCustomerId,
    sponsorClerkUserId,
  } = req.body ?? {};

  const updates: Record<string, unknown> = {};
  if (typeof firstName === "string") updates.firstName = firstName;
  if (typeof lastName === "string") updates.lastName = lastName;
  if (typeof phone === "string") updates.phone = phone;
  if (typeof rank === "string") updates.rank = rank;
  if (Number.isInteger(walletBalanceCents))
    updates.walletBalance = walletBalanceCents;
  if (typeof isAdmin === "boolean") updates.isAdmin = isAdmin;
  // Accept string OR null to clear. Empty string also clears.
  for (const [k, v] of [
    ["byDesignUserId", byDesignUserId],
    ["netfiWalletId", netfiWalletId],
    ["kwikApexId", kwikApexId],
    ["shopifyCustomerId", shopifyCustomerId],
  ] as const) {
    if (v === null) updates[k] = null;
    else if (typeof v === "string") updates[k] = v.trim() === "" ? null : v.trim();
  }

  // Sponsor reassignment is validated separately: it must reference an existing
  // user, can't be the user themselves, and can't be one of the user's own
  // descendants (which would create a cycle in the downline tree).
  if (sponsorClerkUserId === null || sponsorClerkUserId === "") {
    updates.sponsorClerkUserId = null;
  } else if (typeof sponsorClerkUserId === "string") {
    const nextSponsor = sponsorClerkUserId.trim();
    if (nextSponsor === clerkUserId) {
      res.status(400).json({ error: "A user cannot sponsor themselves" });
      return;
    }
    const [sponsor] = await db
      .select({ clerkUserId: userProfileTable.clerkUserId })
      .from(userProfileTable)
      .where(eq(userProfileTable.clerkUserId, nextSponsor))
      .limit(1);
    if (!sponsor) {
      res.status(400).json({ error: "Selected sponsor not found" });
      return;
    }
    if (await wouldCreateSponsorCycle(clerkUserId!, nextSponsor)) {
      res.status(400).json({
        error: "That sponsor is in this user's downline, which would create a loop",
      });
      return;
    }
    updates.sponsorClerkUserId = nextSponsor;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No updatable fields supplied" });
    return;
  }

  const [updated] = await db
    .update(userProfileTable)
    .set(updates)
    .where(eq(userProfileTable.clerkUserId, clerkUserId!))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    clerkUserId: updated.clerkUserId,
    influencerId: updated.influencerId,
    rank: updated.rank,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    phone: updated.phone,
    walletBalanceCents: updated.walletBalance,
    isAdmin: updated.isAdmin,
  });
});

// Account-credential management (password reset, email change) was backed by
// the previous identity provider's admin API. The shared OIDC provider does not
// (yet) expose user-management endpoints, so these actions are disabled. They
// return 501 so the admin UI can surface a clear "not available" state rather
// than silently failing.
router.post("/admin/users/:clerkUserId/password", (_req, res) => {
  res.status(501).json({
    error: "Setting a member's password is not available with shared login.",
  });
});

router.post("/admin/users/:clerkUserId/email", (_req, res) => {
  res.status(501).json({
    error: "Changing a member's email is not available with shared login.",
  });
});

router.post("/admin/users/transfer", async (req, res) => {
  // Strict runtime validation: rejects non-string IDs and non-boolean flags
  // (e.g. "false") so a destructive admin action can never be triggered by a
  // coerced truthy value.
  const parsed = AdminTransferAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }
  const { sourceClerkUserId, targetClerkUserId, deleteSource, mergeWallet } = parsed.data;
  if (sourceClerkUserId === targetClerkUserId) {
    res.status(400).json({ error: "Source and target must differ" });
    return;
  }
  const [source] = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.clerkUserId, sourceClerkUserId))
    .limit(1);
  const [target] = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.clerkUserId, targetClerkUserId))
    .limit(1);
  if (!source || !target) {
    res.status(404).json({ error: "Source or target user not found" });
    return;
  }

  // All DB mutations happen inside a single transaction so a partial failure
  // (e.g. wallet merge throws) does not leave orders moved but wallet not
  // merged. The Clerk-side delete happens after commit because it is an
  // external side effect; its outcome is reported separately.
  const txResult = await db.transaction(async (tx) => {
    // Lock both rows up-front in a stable order to avoid deadlock and
    // ensure neither side is concurrently deleted/mutated mid-transfer.
    // `orders.clerk_user_id` has no FK, so without this guard a concurrent
    // delete of target could leave orders pointing to a non-existent user.
    const lockOrder = [sourceClerkUserId, targetClerkUserId].sort();
    const lockedRows = await tx
      .select({
        clerkUserId: userProfileTable.clerkUserId,
        balance: userProfileTable.walletBalance,
      })
      .from(userProfileTable)
      .where(sql`${userProfileTable.clerkUserId} in (${lockOrder[0]}, ${lockOrder[1]})`)
      .for("update");
    const lockedSource = lockedRows.find((r) => r.clerkUserId === sourceClerkUserId);
    const lockedTarget = lockedRows.find((r) => r.clerkUserId === targetClerkUserId);
    if (!lockedSource || !lockedTarget) {
      throw new Error("Source or target user vanished during transfer");
    }

    const movedRows = await tx
      .update(orderTable)
      .set({ clerkUserId: targetClerkUserId })
      .where(eq(orderTable.clerkUserId, sourceClerkUserId))
      .returning({ id: orderTable.id });

    let walletMovedCents = 0;
    if (mergeWallet && lockedSource.balance !== 0) {
      walletMovedCents = lockedSource.balance;
      await tx
        .update(userProfileTable)
        .set({ walletBalance: 0 })
        .where(eq(userProfileTable.clerkUserId, sourceClerkUserId));
      await tx
        .update(userProfileTable)
        .set({
          walletBalance: sql`${userProfileTable.walletBalance} + ${walletMovedCents}`,
        })
        .where(eq(userProfileTable.clerkUserId, targetClerkUserId));
    }

    let sourceDbDeleted = false;
    if (deleteSource) {
      await tx
        .delete(userProfileTable)
        .where(eq(userProfileTable.clerkUserId, sourceClerkUserId));
      sourceDbDeleted = true;
    }

    return { ordersMoved: movedRows.length, walletMovedCents, sourceDbDeleted };
  });

  // There is no external identity provider to delete from anymore; the local
  // DB profile removal performed inside the transaction is the only deletion.
  // The legacy `sourceClerkDeleted`/`sourceClerkDeleteError` response fields
  // are retained for response-shape stability and now mirror the DB outcome.
  const sourceClerkDeleted = txResult.sourceDbDeleted;
  const sourceClerkDeleteError: string | null = null;

  req.log?.info(
    {
      sourceClerkUserId,
      targetClerkUserId,
      ...txResult,
      sourceClerkDeleted,
    },
    "Admin transferred account",
  );
  res.json({
    ...txResult,
    sourceClerkDeleted,
    sourceClerkDeleteError,
  });
});

router.get("/admin/orders", async (_req, res) => {
  const rows = await db
    .select({
      id: orderTable.id,
      clerkUserId: orderTable.clerkUserId,
      customerName: orderTable.customerName,
      customerEmail: orderTable.customerEmail,
      productName: orderTable.productName,
      amountCents: orderTable.amountCents,
      commissionCents: orderTable.commissionCents,
      currency: orderTable.currency,
      status: orderTable.status,
      source: orderTable.source,
      shopifyOrderId: orderTable.shopifyOrderId,
      orderName: orderTable.orderName,
      occurredAt: orderTable.occurredAt,
      userEmail: userProfileTable.email,
      userFirst: userProfileTable.firstName,
      userLast: userProfileTable.lastName,
      userInfluencerId: userProfileTable.influencerId,
      userAccountStatus: userProfileTable.accountStatus,
    })
    .from(orderTable)
    .leftJoin(
      userProfileTable,
      eq(userProfileTable.clerkUserId, orderTable.clerkUserId),
    )
    .orderBy(desc(orderTable.occurredAt))
    .limit(500);

  res.json(
    rows.map((o) => ({
      id: o.id,
      clerkUserId: o.clerkUserId,
      mappedUserName: o.clerkUserId
        ? [o.userFirst, o.userLast].filter(Boolean).join(" ") ||
          o.userEmail ||
          o.userInfluencerId ||
          null
        : null,
      mappedInfluencerId: o.userInfluencerId,
      mappedAccountStatus: o.clerkUserId ? o.userAccountStatus ?? null : null,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      productName: o.productName,
      amountCents: o.amountCents,
      commissionCents: o.commissionCents,
      currency: o.currency,
      status: o.status,
      source: o.source,
      shopifyOrderId: o.shopifyOrderId,
      shopifyAdminOrderUrl: shopifyAdminOrderUrl(o.shopifyOrderId),
      orderName: o.orderName,
      occurredAt: o.occurredAt.toISOString(),
    })),
  );
});

router.get("/admin/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({
      order: orderTable,
      userFirst: userProfileTable.firstName,
      userLast: userProfileTable.lastName,
      userEmail: userProfileTable.email,
      userInfluencerId: userProfileTable.influencerId,
      userAccountStatus: userProfileTable.accountStatus,
      userSponsorClerkUserId: userProfileTable.sponsorClerkUserId,
    })
    .from(orderTable)
    .leftJoin(
      userProfileTable,
      eq(userProfileTable.clerkUserId, orderTable.clerkUserId),
    )
    .where(eq(orderTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const o = row.order;

  // Look up the sponsor (referrer) of the mapped user, if any. This powers
  // the "Sponsor" line on the admin order detail "Mapped to" card.
  let mappedSponsor: {
    clerkUserId: string;
    name: string | null;
    influencerId: string | null;
  } | null = null;
  if (row.userSponsorClerkUserId) {
    const [sp] = await db
      .select({
        clerkUserId: userProfileTable.clerkUserId,
        firstName: userProfileTable.firstName,
        lastName: userProfileTable.lastName,
        email: userProfileTable.email,
        influencerId: userProfileTable.influencerId,
      })
      .from(userProfileTable)
      .where(eq(userProfileTable.clerkUserId, row.userSponsorClerkUserId))
      .limit(1);
    if (sp) {
      mappedSponsor = {
        clerkUserId: sp.clerkUserId,
        name:
          [sp.firstName, sp.lastName].filter(Boolean).join(" ") ||
          sp.email ||
          null,
        influencerId: sp.influencerId,
      };
    }
  }

  res.json({
    id: o.id,
    clerkUserId: o.clerkUserId,
    mappedUserName: o.clerkUserId
      ? [row.userFirst, row.userLast].filter(Boolean).join(" ") ||
        row.userEmail ||
        row.userInfluencerId ||
        null
      : null,
    mappedInfluencerId: row.userInfluencerId,
    mappedAccountStatus: o.clerkUserId ? row.userAccountStatus ?? null : null,
    mappedSponsor,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    productName: o.productName,
    orderName: o.orderName,
    amountCents: o.amountCents,
    commissionCents: o.commissionCents,
    currency: o.currency,
    status: o.status,
    source: o.source,
    shopifyOrderId: o.shopifyOrderId,
    shopifyAdminOrderUrl: shopifyAdminOrderUrl(o.shopifyOrderId),
    occurredAt: o.occurredAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
    note: o.note,
    tags: o.tags ?? [],
    discountCodes: o.discountCodes ?? [],
    noteAttributes: o.noteAttributes ?? [],
    lineItems: o.lineItems ?? [],
    shippingAddress: o.shippingAddress,
    rawPayload: o.rawPayload,
  });
});

router.get("/admin/users/:clerkUserId/detail", async (req, res) => {
  const clerkUserId = req.params.clerkUserId!;
  const [user] = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.clerkUserId, clerkUserId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const orders = await db
    .select()
    .from(orderTable)
    .where(eq(orderTable.clerkUserId, clerkUserId))
    .orderBy(desc(orderTable.occurredAt));

  // Resolve a human-readable sponsor name from the active attribution, if any.
  let sponsorName: string | null = null;
  if (user.sponsorClerkUserId) {
    const [sponsor] = await db
      .select({
        firstName: userProfileTable.firstName,
        lastName: userProfileTable.lastName,
        email: userProfileTable.email,
        influencerId: userProfileTable.influencerId,
      })
      .from(userProfileTable)
      .where(eq(userProfileTable.clerkUserId, user.sponsorClerkUserId))
      .limit(1);
    if (sponsor) {
      sponsorName =
        [sponsor.firstName, sponsor.lastName].filter(Boolean).join(" ").trim() ||
        sponsor.email ||
        sponsor.influencerId ||
        null;
    }
  }

  const totalSpendCents = orders.reduce((acc, o) => acc + (o.amountCents ?? 0), 0);
  const totalCommissionCents = orders.reduce(
    (acc, o) => acc + (o.commissionCents ?? 0),
    0,
  );

  res.json({
    profile: {
      clerkUserId: user.clerkUserId,
      influencerId: user.influencerId,
      rank: user.rank,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      walletBalanceCents: user.walletBalance,
      isAdmin: user.isAdmin,
      byDesignUserId: user.byDesignUserId,
      netfiWalletId: user.netfiWalletId,
      kwikApexId: user.kwikApexId,
      shopifyCustomerId: user.shopifyCustomerId,
      shopifyAdminCustomerUrl: shopifyAdminCustomerUrl(user.shopifyCustomerId),
      accountStatus: user.accountStatus,
      sponsorClerkUserId: user.sponsorClerkUserId,
      sponsorIdRaw: user.sponsorIdRaw,
      sponsorName,
      ordersCount: orders.length,
      createdAt: user.createdAt.toISOString(),
    },
    orders: orders.map((o) => ({
      id: o.id,
      clerkUserId: o.clerkUserId,
      mappedUserName: null,
      mappedInfluencerId: user.influencerId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      productName: o.productName,
      orderName: o.orderName,
      amountCents: o.amountCents,
      commissionCents: o.commissionCents,
      currency: o.currency,
      status: o.status,
      source: o.source,
      shopifyOrderId: o.shopifyOrderId,
      shopifyAdminOrderUrl: shopifyAdminOrderUrl(o.shopifyOrderId),
      occurredAt: o.occurredAt.toISOString(),
    })),
    totalSpendCents,
    totalCommissionCents,
  });
});

router.get("/admin/integrations", async (req, res) => {
  const [{ value: totalOrders }] = await db
    .select({ value: count() })
    .from(orderTable);
  const [{ value: mappedOrders }] = await db
    .select({ value: count() })
    .from(orderTable)
    .where(isNotNull(orderTable.clerkUserId));
  const [{ value: unmappedOrders }] = await db
    .select({ value: count() })
    .from(orderTable)
    .where(isNull(orderTable.clerkUserId));
  const [{ value: shopifyOrders }] = await db
    .select({ value: count() })
    .from(orderTable)
    .where(eq(orderTable.source, "shopify"));

  const host = req.get("host") ?? "";
  const proto = (req.get("x-forwarded-proto") ?? req.protocol) || "https";
  const webhookUrl = `${proto}://${host}/api/webhooks/shopify/orders`;

  res.json({
    shopify: {
      webhookUrl,
    },
    stats: {
      totalOrders: Number(totalOrders),
      mappedOrders: Number(mappedOrders),
      unmappedOrders: Number(unmappedOrders),
      shopifyOrders: Number(shopifyOrders),
    },
  });
});

export default router;
