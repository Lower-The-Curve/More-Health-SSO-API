import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Translation overrides keyed by the original English string. Each row may
 * have a `zhPublished` (live) and/or `zhDraft` (staged for review) value.
 *
 * Workflow: admin uploads a CSV of (english, chinese) → rows get upserted
 * with `zhDraft` set. Admin previews drafts in their session. On Publish,
 * `zhDraft` is copied to `zhPublished` and cleared.
 *
 * The frontend `t(en, zh)` consults `zhPublished` first (when lang=zh) and
 * falls back to the inline `zh` literal in source.
 */
export const translationOverrideTable = pgTable("translation_override", {
  enText: text("en_text").primaryKey(),
  zhPublished: text("zh_published"),
  zhDraft: text("zh_draft"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  updatedByClerkUserId: text("updated_by_clerk_user_id"),
});

export type TranslationOverride = typeof translationOverrideTable.$inferSelect;
