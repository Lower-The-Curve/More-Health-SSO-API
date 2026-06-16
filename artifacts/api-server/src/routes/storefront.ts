import { Router, type IRouter } from "express";
import {
  db,
  orderTable,
  appSettingsTable,
  storefrontVisitTable,
  SHARE_LINKS_SETTING_KEY,
} from "@workspace/db";
import { and, eq, gte, lt, or, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateProfile } from "../lib/getOrCreateProfile";

const router: IRouter = Router();

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getUTCDay();
  const diff = (day + 6) % 7;
  out.setUTCDate(out.getUTCDate() - diff);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

async function readShopBaseUrl(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, SHARE_LINKS_SETTING_KEY))
    .limit(1);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { shopBaseUrl?: string | null };
    return typeof parsed.shopBaseUrl === "string" ? parsed.shopBaseUrl : null;
  } catch {
    return null;
  }
}

function withSponsorId(base: string | null, sponsorId: string | null): string | null {
  if (!base) return null;
  if (!sponsorId) return base;
  try {
    const u = new URL(base);
    u.searchParams.set("sponsor_ID", sponsorId);
    return u.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}sponsor_ID=${encodeURIComponent(sponsorId)}`;
  }
}

function parseDateUtc(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(y, mo - 1, day));
  if (Number.isNaN(d.getTime())) return null;
  // Reject rollover dates like 2026-02-31 → 2026-03-03.
  if (
    d.getUTCFullYear() !== y ||
    d.getUTCMonth() + 1 !== mo ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d;
}

router.get("/storefront", requireAuth, async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);

  const now = new Date();
  const fromParam = parseDateUtc(req.query.from);
  const toParam = parseDateUtc(req.query.to);

  // Range is inclusive of `to`; we treat `weekEnd` as exclusive upper bound.
  let weekStart: Date;
  let weekEnd: Date;
  if (fromParam && toParam && fromParam <= toParam) {
    weekStart = fromParam;
    weekEnd = new Date(toParam);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 1);
  } else {
    weekStart = startOfWeek(now);
    weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  }
  const rangeDays = Math.max(
    1,
    Math.round((weekEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const prevStart = new Date(weekStart);
  prevStart.setUTCDate(prevStart.getUTCDate() - rangeDays);

  // Personal + referred orders this user is associated with, deduped by id.
  const ownership = or(
    eq(orderTable.clerkUserId, req.userId!),
    eq(orderTable.referrerClerkUserId, req.userId!),
  );

  const [thisWeekRaw, prevWeekRaw] = await Promise.all([
    db
      .select()
      .from(orderTable)
      .where(and(ownership, gte(orderTable.occurredAt, weekStart), lt(orderTable.occurredAt, weekEnd))),
    db
      .select()
      .from(orderTable)
      .where(and(ownership, gte(orderTable.occurredAt, prevStart), lt(orderTable.occurredAt, weekStart))),
  ]);

  const dedupe = <T extends { id: number }>(rows: T[]): T[] => {
    const seen = new Set<number>();
    return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  };
  const thisWeek = dedupe(thisWeekRaw);
  const prevWeek = dedupe(prevWeekRaw);

  // Visit counts (only meaningful when the user has a kwikApexId assigned).
  let visits = 0;
  let prevVisits = 0;
  if (profile.kwikApexId) {
    const [curRow, prevRow] = await Promise.all([
      db
        .select({ n: count() })
        .from(storefrontVisitTable)
        .where(
          and(
            eq(storefrontVisitTable.sponsorId, profile.kwikApexId),
            gte(storefrontVisitTable.occurredAt, weekStart),
            lt(storefrontVisitTable.occurredAt, weekEnd),
          ),
        ),
      db
        .select({ n: count() })
        .from(storefrontVisitTable)
        .where(
          and(
            eq(storefrontVisitTable.sponsorId, profile.kwikApexId),
            gte(storefrontVisitTable.occurredAt, prevStart),
            lt(storefrontVisitTable.occurredAt, weekStart),
          ),
        ),
    ]);
    visits = Number(curRow[0]?.n ?? 0);
    prevVisits = Number(prevRow[0]?.n ?? 0);
  }

  const sum = (rows: typeof thisWeek, k: "amountCents") =>
    rows.reduce((s, r) => s + (r[k] ?? 0), 0);

  const ordersCount = thisWeek.length;
  const revenueCents = sum(thisWeek, "amountCents");
  const avgOrderValueCents = ordersCount > 0 ? Math.round(revenueCents / ordersCount) : 0;

  const prevOrders = prevWeek.length;
  const prevRevenue = sum(prevWeek, "amountCents");
  const prevAov = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

  // Conversion rate = orders / visits, as a percentage with 1 decimal.
  const conversionRate = visits > 0 ? Math.round((ordersCount / visits) * 1000) / 10 : 0;
  const prevConversionRate =
    prevVisits > 0 ? Math.round((prevOrders / prevVisits) * 1000) / 10 : 0;
  // Delta in percentage points. Null only when there is no prior baseline
  // (prevVisits === 0); a valid 0% prior week still yields a real delta.
  const conversionDelta =
    prevVisits === 0
      ? null
      : Math.round((conversionRate - prevConversionRate) * 10) / 10;

  // Most ordered products: aggregate line items across personal+referred orders.
  const productMap = new Map<string, { name: string; units: number; revenueCents: number }>();
  for (const o of thisWeek) {
    const items = o.lineItems ?? [];
    for (const li of items) {
      const name = (li.title || "").trim();
      if (!name) continue;
      const existing = productMap.get(name) ?? { name, units: 0, revenueCents: 0 };
      existing.units += li.quantity ?? 0;
      existing.revenueCents += (li.priceCents ?? 0) * (li.quantity ?? 0);
      productMap.set(name, existing);
    }
  }
  const mostOrdered = Array.from(productMap.values())
    .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents)
    .slice(0, 6);

  const shopBase = await readShopBaseUrl();
  const shopShareUrl = withSponsorId(shopBase, profile.kwikApexId);

  res.json({
    shopShareUrl,
    rangeStart: weekStart.toISOString(),
    rangeEnd: weekEnd.toISOString(),
    prevRangeStart: prevStart.toISOString(),
    prevRangeEnd: weekStart.toISOString(),
    orders: { value: ordersCount, deltaPct: pctDelta(ordersCount, prevOrders) },
    revenueCents: { value: revenueCents, deltaPct: pctDelta(revenueCents, prevRevenue) },
    storeVisits: { value: visits, deltaPct: pctDelta(visits, prevVisits) },
    conversionRate: { value: conversionRate, deltaPct: conversionDelta },
    avgOrderValueCents: {
      value: avgOrderValueCents,
      deltaPct: pctDelta(avgOrderValueCents, prevAov),
    },
    mostOrdered,
  });
});

export default router;
