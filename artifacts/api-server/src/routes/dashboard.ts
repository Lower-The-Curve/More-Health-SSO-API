import { Router, type IRouter } from "express";
import { db, orderTable, activityTable } from "@workspace/db";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateProfile } from "../lib/getOrCreateProfile";

const router: IRouter = Router();

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getUTCDay(); // 0 Sun..6 Sat — treat Mon as start
  const diff = (day + 6) % 7;
  out.setUTCDate(out.getUTCDate() - diff);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

router.get("/dashboard", requireAuth, async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  // "Last week" = the most recently completed week (Mon–Sun before the
  // current week). Used for the Commissions Paid KPI so it lines up with
  // the weekly statements on the Earnings page.
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  const prevPrevWeekStart = new Date(lastWeekStart);
  prevPrevWeekStart.setUTCDate(prevPrevWeekStart.getUTCDate() - 7);

  function pctDelta(curr: number, prev: number): number | null {
    if (prev === 0) return curr === 0 ? null : null;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  const ordersThisWeek = await db
    .select()
    .from(orderTable)
    .where(
      and(
        eq(orderTable.clerkUserId, req.userId!),
        gte(orderTable.occurredAt, weekStart),
        lt(orderTable.occurredAt, weekEnd),
      ),
    );

  // Referred / sponsor orders this week (orders where this user is the
  // upline referrer, regardless of who the buyer is). Used to roll the
  // referred volume into the "Volume Generated" KPI.
  const referredOrdersThisWeek = await db
    .select()
    .from(orderTable)
    .where(
      and(
        eq(orderTable.referrerClerkUserId, req.userId!),
        gte(orderTable.occurredAt, weekStart),
        lt(orderTable.occurredAt, weekEnd),
      ),
    );

  // De-dupe: if an order is both personal (clerkUserId) and referred
  // (referrerClerkUserId) for the same user, count it once.
  const volumeOrdersById = new Map<number, (typeof ordersThisWeek)[number]>();
  for (const o of ordersThisWeek) volumeOrdersById.set(o.id, o);
  for (const o of referredOrdersThisWeek) volumeOrdersById.set(o.id, o);
  const volumeOrders = Array.from(volumeOrdersById.values());

  const totalOrders = ordersThisWeek.length;
  // Referred orders = orders this user sponsored but did NOT place themselves.
  const personalOrderIds = new Set(ordersThisWeek.map((o) => o.id));
  const referredOnly = referredOrdersThisWeek.filter(
    (o) => !personalOrderIds.has(o.id),
  );
  const referredOrdersCount = referredOnly.length;
  const volumeCents = volumeOrders.reduce((s, o) => s + o.amountCents, 0);
  const commissionsCentsThisWeek = ordersThisWeek.reduce(
    (s, o) => s + o.commissionCents,
    0,
  );

  // Last week (completed) — used for the "Commissions Paid" KPI so it
  // matches the most recent weekly statement on the Earnings page.
  const lastWeekOrders = await db
    .select()
    .from(orderTable)
    .where(
      and(
        eq(orderTable.clerkUserId, req.userId!),
        gte(orderTable.occurredAt, lastWeekStart),
        lt(orderTable.occurredAt, lastWeekEnd),
      ),
    );
  const lastWeekCommissionsCents = lastWeekOrders.reduce(
    (s, o) => s + o.commissionCents,
    0,
  );

  // Week-over-week comparison sources for the other KPIs (this week vs
  // last week) and for commissions (last week vs the week before that).
  const prevWeekOrders = lastWeekOrders;
  const prevPrevWeekOrders = await db
    .select()
    .from(orderTable)
    .where(
      and(
        eq(orderTable.clerkUserId, req.userId!),
        gte(orderTable.occurredAt, prevPrevWeekStart),
        lt(orderTable.occurredAt, lastWeekStart),
      ),
    );
  const prevWeekVolumeOrders = await db
    .select()
    .from(orderTable)
    .where(
      and(
        eq(orderTable.referrerClerkUserId, req.userId!),
        gte(orderTable.occurredAt, lastWeekStart),
        lt(orderTable.occurredAt, lastWeekEnd),
      ),
    );
  const prevVolumeById = new Map<number, (typeof prevWeekOrders)[number]>();
  for (const o of prevWeekOrders) prevVolumeById.set(o.id, o);
  for (const o of prevWeekVolumeOrders) prevVolumeById.set(o.id, o);
  const prevVolumeCents = Array.from(prevVolumeById.values()).reduce(
    (s, o) => s + o.amountCents,
    0,
  );

  const totalOrdersDelta = pctDelta(totalOrders, prevWeekOrders.length);
  const prevPersonalIds = new Set(prevWeekOrders.map((o) => o.id));
  const prevReferredOnly = prevWeekVolumeOrders.filter(
    (o) => !prevPersonalIds.has(o.id),
  );
  const referredOrdersDelta = pctDelta(
    referredOrdersCount,
    prevReferredOnly.length,
  );
  const volumeDelta = pctDelta(volumeCents, prevVolumeCents);
  const commissionsDelta = pctDelta(
    lastWeekCommissionsCents,
    prevPrevWeekOrders.reduce((s, o) => s + o.commissionCents, 0),
  );

  const salesByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    const label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]!;
    const value = volumeOrders
      .filter((o) => {
        const od = new Date(o.occurredAt);
        return (
          od.getUTCFullYear() === d.getUTCFullYear() &&
          od.getUTCMonth() === d.getUTCMonth() &&
          od.getUTCDate() === d.getUTCDate()
        );
      })
      .reduce((s, o) => s + o.amountCents, 0);
    return { label, value: value / 100 };
  });

  // Four-week earnings history
  const earningsHistory: { label: string; value: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const wkStart = new Date(weekStart);
    wkStart.setUTCDate(wkStart.getUTCDate() - i * 7);
    const wkEnd = new Date(wkStart);
    wkEnd.setUTCDate(wkEnd.getUTCDate() + 7);
    const rows = await db
      .select()
      .from(orderTable)
      .where(
        and(
          eq(orderTable.clerkUserId, req.userId!),
          gte(orderTable.occurredAt, wkStart),
          lt(orderTable.occurredAt, wkEnd),
        ),
      );
    const sum = rows.reduce((s, o) => s + o.commissionCents, 0);
    const month = wkStart.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    const startDay = wkStart.getUTCDate();
    const endDay = new Date(wkEnd.getTime() - 1).getUTCDate();
    earningsHistory.push({ label: `${month} ${startDay}–${endDay}`, value: sum / 100 });
  }

  // Derive the activity feed from real order data: personal orders,
  // personally sponsored (referred) orders, and commission payouts.
  // Falls back to the activities table for anything else we've logged.
  const activityWindowStart = new Date(now);
  activityWindowStart.setUTCDate(activityWindowStart.getUTCDate() - 60);

  const [personalOrdersRecent, referredOrdersRecent, loggedActivity] =
    await Promise.all([
      db
        .select()
        .from(orderTable)
        .where(
          and(
            eq(orderTable.clerkUserId, req.userId!),
            gte(orderTable.occurredAt, activityWindowStart),
          ),
        )
        .orderBy(desc(orderTable.occurredAt))
        .limit(25),
      db
        .select()
        .from(orderTable)
        .where(
          and(
            eq(orderTable.referrerClerkUserId, req.userId!),
            gte(orderTable.occurredAt, activityWindowStart),
          ),
        )
        .orderBy(desc(orderTable.occurredAt))
        .limit(25),
      db
        .select()
        .from(activityTable)
        .where(eq(activityTable.clerkUserId, req.userId!))
        .orderBy(desc(activityTable.occurredAt))
        .limit(25),
    ]);

  type FeedItem = {
    id: string;
    kind: string;
    description: string;
    amountCents: number | null;
    occurredAt: Date;
    sortKey: number;
  };
  const feed: FeedItem[] = [];

  const personalIds = new Set(personalOrdersRecent.map((o) => o.id));
  for (const o of personalOrdersRecent) {
    const who = o.customerName?.trim() || o.customerEmail || "a customer";
    const label = o.orderName ? ` ${o.orderName}` : "";
    feed.push({
      id: `order-${o.id}`,
      kind: "order_received",
      description: `Order${label} from ${who}`,
      amountCents: o.amountCents,
      occurredAt: o.occurredAt,
      sortKey: 1,
    });
    if (o.status && o.status !== "paid" && o.status !== "pending") {
      feed.push({
        id: `order-status-${o.id}`,
        kind: "order_status",
        description: `Order${label} ${o.status}`,
        amountCents: null,
        occurredAt: o.occurredAt,
        sortKey: 2,
      });
    }
    if (o.commissionCents > 0) {
      feed.push({
        id: `commission-${o.id}`,
        kind: "commission_paid",
        description: `Commission paid${label ? ` for${label}` : ""}`,
        amountCents: o.commissionCents,
        occurredAt: o.occurredAt,
        sortKey: 4,
      });
    }
  }

  for (const o of referredOrdersRecent) {
    if (personalIds.has(o.id)) continue; // don't double-list own orders
    const who = o.customerName?.trim() || o.customerEmail || "a referred customer";
    feed.push({
      id: `referred-${o.id}`,
      kind: "referred_order",
      description: `Personally sponsored order from ${who}`,
      amountCents: o.amountCents,
      occurredAt: o.occurredAt,
      sortKey: 3,
    });
    if (o.commissionCents > 0) {
      feed.push({
        id: `referred-commission-${o.id}`,
        kind: "commission_paid",
        description: `Commission paid on referred order`,
        amountCents: o.commissionCents,
        occurredAt: o.occurredAt,
        sortKey: 4,
      });
    }
  }

  for (const a of loggedActivity) {
    feed.push({
      id: `activity-${a.id}`,
      kind: a.kind,
      description: a.description,
      amountCents: a.amountCents,
      occurredAt: a.occurredAt,
      sortKey: a.kind === "commission_paid" ? 4 : 0,
    });
  }

  const recentActivity = feed
    .sort((a, b) => {
      const tDiff = b.occurredAt.getTime() - a.occurredAt.getTime();
      if (tDiff !== 0) return tDiff;
      return a.sortKey - b.sortKey;
    })
    .slice(0, 10);

  res.json({
    walletBalanceCents: profile.walletBalance,
    weeklyEarningsCents: commissionsCentsThisWeek,
    ordersThisWeek: totalOrders,
    rangeStart: weekStart.toISOString(),
    rangeEnd: weekEnd.toISOString(),
    kpis: {
      totalOrders: { value: totalOrders, deltaPct: totalOrdersDelta },
      referredOrders: { value: referredOrdersCount, deltaPct: referredOrdersDelta },
      volumeCents: { value: volumeCents, deltaPct: volumeDelta },
      // "Commissions Paid" reflects the most recently completed week so
      // it lines up with the latest weekly statement on the Earnings page.
      commissionsCents: {
        value: lastWeekCommissionsCents,
        deltaPct: commissionsDelta,
      },
    },
    salesByDay,
    earningsHistory,
    volume: {
      // Market 1 = sum of CV, Market 2 = sum of QV, across personal +
      // personally referred orders. Legacy rows without CV/QV fall back
      // to amountCents so totals stay accurate.
      totalCents: volumeOrders.reduce(
        (s, o) => s + (o.cvCents ?? o.amountCents) + (o.qvCents ?? o.amountCents),
        0,
      ),
      deltaPct: volumeDelta,
      market1Cents: volumeOrders.reduce((s, o) => s + (o.cvCents ?? o.amountCents), 0),
      market2Cents: volumeOrders.reduce((s, o) => s + (o.qvCents ?? o.amountCents), 0),
    },
    activity: recentActivity.map((a) => ({
      id: a.id,
      kind: a.kind,
      description: a.description,
      amountCents: a.amountCents,
      occurredAt: a.occurredAt.toISOString(),
    })),
  });
});

export default router;
