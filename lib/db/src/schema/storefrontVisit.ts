import { pgTable, text, timestamp, serial, index } from "drizzle-orm/pg-core";

/**
 * Storefront visit log. Recorded when a shopper lands on the Shopify
 * storefront with a sponsor_ID query parameter. Used to compute Store
 * Visits and Conversion Rate (orders / visits) for the influencer
 * whose kwikApexId matches the sponsorId.
 */
export const storefrontVisitTable = pgTable(
  "storefront_visits",
  {
    id: serial("id").primaryKey(),
    sponsorId: text("sponsor_id").notNull(),
    referer: text("referer"),
    userAgent: text("user_agent"),
    path: text("path"),
    ip: text("ip"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sponsorIdIdx: index("storefront_visits_sponsor_id_idx").on(t.sponsorId),
    occurredAtIdx: index("storefront_visits_occurred_at_idx").on(t.occurredAt),
  }),
);

export type StorefrontVisit = typeof storefrontVisitTable.$inferSelect;
