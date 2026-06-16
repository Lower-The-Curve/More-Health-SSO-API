import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Singleton-style key/value store for admin-configurable settings.
 * Use `key` as a stable identifier (e.g. "share_links") and serialize
 * structured values as JSON strings in `value`.
 */
export const appSettingsTable = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AppSetting = typeof appSettingsTable.$inferSelect;

export const SHARE_LINKS_SETTING_KEY = "share_links";

/** Global display toggles controlling user-facing visibility of volume and influencer status. */
export const DISPLAY_FLAGS_SETTING_KEY = "display_flags";
