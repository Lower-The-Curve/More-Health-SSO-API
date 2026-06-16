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
export declare const translationOverrideTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "translation_override";
    schema: undefined;
    columns: {
        enText: import("drizzle-orm/pg-core").PgColumn<{
            name: "en_text";
            tableName: "translation_override";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        zhPublished: import("drizzle-orm/pg-core").PgColumn<{
            name: "zh_published";
            tableName: "translation_override";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        zhDraft: import("drizzle-orm/pg-core").PgColumn<{
            name: "zh_draft";
            tableName: "translation_override";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "translation_override";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedByClerkUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_by_clerk_user_id";
            tableName: "translation_override";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export type TranslationOverride = typeof translationOverrideTable.$inferSelect;
//# sourceMappingURL=translationOverride.d.ts.map