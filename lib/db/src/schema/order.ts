import {
  pgTable,
  text,
  timestamp,
  serial,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface OrderLineItem {
  title: string;
  variantTitle?: string | null;
  sku?: string | null;
  quantity: number;
  priceCents: number;
  productId?: string | null;
  variantId?: string | null;
}

export interface OrderDiscountCode {
  code: string;
  amountCents: number;
  type?: string | null;
}

export interface OrderNoteAttribute {
  name: string;
  value: string;
}

export interface ShippingAddress {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
}

export const orderTable = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    // Nullable: Shopify orders may arrive before we know which user to attribute them to
    clerkUserId: text("clerk_user_id"),
    // sponsor_id from Shopify cart attributes / note_attributes / metafields
    // (the value that came back from the shop/enroll share-link query param).
    // Stored verbatim (trimmed) for auditing.
    sponsorId: text("sponsor_id"),
    // The local user (clerkUserId) whose kwikApexId matched `sponsorId` at
    // ingest time. This is the "referrer" — the order shows up on their
    // referred-orders report.
    referrerClerkUserId: text("referrer_clerk_user_id"),
    customerName: text("customer_name").notNull().default(""),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    productName: text("product_name").notNull().default(""),
    amountCents: integer("amount_cents").notNull(),
    // Commissionable Volume (Market 1) and Qualifying Volume (Market 2)
    // tracked per order for MLM volume rollups. Nullable so legacy rows
    // fall back to amountCents at read time.
    cvCents: integer("cv_cents"),
    qvCents: integer("qv_cents"),
    commissionCents: integer("commission_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    status: text("status").notNull().default("paid"),
    source: text("source").notNull().default("manual"),
    shopifyOrderId: text("shopify_order_id"),
    orderName: text("order_name"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    note: text("note"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    discountCodes: jsonb("discount_codes").$type<OrderDiscountCode[]>().notNull().default([]),
    noteAttributes: jsonb("note_attributes").$type<OrderNoteAttribute[]>().notNull().default([]),
    lineItems: jsonb("line_items").$type<OrderLineItem[]>().notNull().default([]),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown> | null>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    shopifyOrderIdUnique: uniqueIndex("orders_shopify_order_id_unique").on(t.shopifyOrderId),
    customerEmailIdx: index("orders_customer_email_idx").on(t.customerEmail),
    clerkUserIdIdx: index("orders_clerk_user_id_idx").on(t.clerkUserId),
    referrerClerkUserIdIdx: index("orders_referrer_clerk_user_id_idx").on(
      t.referrerClerkUserId,
    ),
    orderNameIdx: index("orders_order_name_idx").on(t.orderName),
  }),
);

export const insertOrderSchema = createInsertSchema(orderTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orderTable.$inferSelect;
