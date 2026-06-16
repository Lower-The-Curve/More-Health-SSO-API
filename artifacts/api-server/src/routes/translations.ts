import { Router, type IRouter } from "express";
import { db, translationOverrideTable } from "@workspace/db";
import { isNotNull, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { AdminPutTranslationDraftsBody } from "@workspace/api-zod";

const router: IRouter = Router();

// --- Public: published translations map -------------------------------------
// No auth. Cheap, read-mostly; clients fetch once on load.
router.get("/translations", async (_req, res) => {
  const rows = await db
    .select({
      enText: translationOverrideTable.enText,
      zhPublished: translationOverrideTable.zhPublished,
    })
    .from(translationOverrideTable)
    .where(isNotNull(translationOverrideTable.zhPublished));

  const translations: Record<string, string> = {};
  for (const r of rows) {
    if (r.zhPublished != null) translations[r.enText] = r.zhPublished;
  }
  res.json({ translations });
});

// --- Admin endpoints --------------------------------------------------------
router.use("/admin/translations", requireAuth, requireAdmin);

async function loadState(): Promise<{
  published: Record<string, string>;
  drafts: Record<string, string>;
}> {
  const rows = await db
    .select({
      enText: translationOverrideTable.enText,
      zhPublished: translationOverrideTable.zhPublished,
      zhDraft: translationOverrideTable.zhDraft,
    })
    .from(translationOverrideTable);

  const published: Record<string, string> = {};
  const drafts: Record<string, string> = {};
  for (const r of rows) {
    if (r.zhPublished != null) published[r.enText] = r.zhPublished;
    if (r.zhDraft != null) drafts[r.enText] = r.zhDraft;
  }
  return { published, drafts };
}

router.get("/admin/translations", async (_req, res) => {
  res.json(await loadState());
});

// PUT replaces the draft set wholesale: any key not in the new map has its
// draft cleared. Empty string values are treated as "no draft" (clear).
router.put("/admin/translations/drafts", async (req, res) => {
  const parsed = AdminPutTranslationDraftsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const { drafts: incoming } = parsed.data;
  const updatedBy = req.userId ?? null;

  // Normalize: trim, skip empty/whitespace-only values.
  const cleaned = new Map<string, string>();
  for (const [en, zh] of Object.entries(incoming)) {
    const enKey = en;
    const zhVal = typeof zh === "string" ? zh : "";
    if (!enKey) continue;
    if (zhVal.trim() === "") continue;
    cleaned.set(enKey, zhVal);
  }

  await db.transaction(async (tx) => {
    // Clear every existing draft first; then re-apply the new set. This
    // gives PUT semantics in one atomic step. We don't delete rows whose
    // only signal was a draft, because preserving the row with a cleared
    // draft is harmless and keeps the table small relative to catalog size.
    await tx
      .update(translationOverrideTable)
      .set({ zhDraft: null })
      .where(isNotNull(translationOverrideTable.zhDraft));

    if (cleaned.size === 0) return;

    const values = [...cleaned.entries()].map(([enText, zhDraft]) => ({
      enText,
      zhDraft,
      updatedByClerkUserId: updatedBy,
    }));
    // Drizzle insert with onConflictDoUpdate; batched to avoid huge single
    // statements but typical CSV imports are well under a few hundred rows.
    const CHUNK = 200;
    for (let i = 0; i < values.length; i += CHUNK) {
      const chunk = values.slice(i, i + CHUNK);
      await tx
        .insert(translationOverrideTable)
        .values(chunk)
        .onConflictDoUpdate({
          target: translationOverrideTable.enText,
          set: {
            zhDraft: sql`excluded.zh_draft`,
            updatedByClerkUserId: sql`excluded.updated_by_clerk_user_id`,
          },
        });
    }
  });

  req.log?.info({ count: cleaned.size }, "Replaced translation drafts");
  res.json(await loadState());
});

// Promote all drafts to published. Clears drafts after copy.
router.post("/admin/translations/publish", async (req, res) => {
  await db.transaction(async (tx) => {
    await tx
      .update(translationOverrideTable)
      .set({
        zhPublished: sql`${translationOverrideTable.zhDraft}`,
        zhDraft: null,
        updatedByClerkUserId: req.userId ?? null,
      })
      .where(isNotNull(translationOverrideTable.zhDraft));
  });
  req.log?.info("Published translation drafts");
  res.json(await loadState());
});

router.post("/admin/translations/discard-drafts", async (req, res) => {
  await db
    .update(translationOverrideTable)
    .set({ zhDraft: null })
    .where(isNotNull(translationOverrideTable.zhDraft));
  req.log?.info("Discarded translation drafts");
  res.json(await loadState());
});

export default router;
