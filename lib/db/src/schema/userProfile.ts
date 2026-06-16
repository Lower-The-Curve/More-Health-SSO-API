import { pgTable, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfileTable = pgTable("user_profiles", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  influencerId: text("influencer_id").notNull(),
  rank: text("rank").notNull().default("Influencer"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  dateOfBirth: date("date_of_birth"),
  walletBalance: integer("wallet_balance_cents").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  byDesignUserId: text("bydesign_user_id"),
  netfiWalletId: text("netfi_wallet_id"),
  kwikApexId: text("kwik_apex_id"),
  shopifyCustomerId: text("shopify_customer_id"),
  // 'active' = backed by a real Clerk account; 'pending' = placeholder
  // synthesized from an inbound Shopify order whose email we hadn't seen
  // yet. Pending profiles are merged into the real Clerk account when the
  // buyer goes through /activate (or any signup flow with matching email).
  accountStatus: text("account_status").notNull().default("active"),
  // Sponsor (referrer) of this user — resolved from the order's sponsor_id
  // metafield/note attribute at ingest time.
  sponsorClerkUserId: text("sponsor_clerk_user_id"),
  // Raw sponsor_id string captured at ingest (preserved even if no local
  // user matched it, so attribution can be repaired later).
  sponsorIdRaw: text("sponsor_id_raw"),
  // For pending placeholders, the order row that triggered creation.
  createdFromOrderId: integer("created_from_order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserProfileSchema = createInsertSchema(userProfileTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfileTable.$inferSelect;
