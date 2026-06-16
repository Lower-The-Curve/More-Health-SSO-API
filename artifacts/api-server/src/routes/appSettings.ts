import { Router, type IRouter } from "express";
import {
  db,
  appSettingsTable,
  SHARE_LINKS_SETTING_KEY,
  DISPLAY_FLAGS_SETTING_KEY,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { getOrCreateProfile } from "../lib/getOrCreateProfile";

const router: IRouter = Router();

export interface ShareLinksConfig {
  shopBaseUrl: string | null;
  enrollBaseUrl: string | null;
  siteBaseUrl: string | null;
}

export async function readShareLinks(): Promise<ShareLinksConfig> {
  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, SHARE_LINKS_SETTING_KEY))
    .limit(1);
  if (!row)
    return { shopBaseUrl: null, enrollBaseUrl: null, siteBaseUrl: null };
  try {
    const parsed = JSON.parse(row.value) as Partial<ShareLinksConfig>;
    return {
      shopBaseUrl: typeof parsed.shopBaseUrl === "string" ? parsed.shopBaseUrl : null,
      enrollBaseUrl:
        typeof parsed.enrollBaseUrl === "string" ? parsed.enrollBaseUrl : null,
      siteBaseUrl:
        typeof parsed.siteBaseUrl === "string" ? parsed.siteBaseUrl : null,
    };
  } catch {
    return { shopBaseUrl: null, enrollBaseUrl: null, siteBaseUrl: null };
  }
}

/**
 * Append `sponsor_id=<id>` to a base URL. Returns null if base is empty.
 * Uses URL parsing so the param is inserted into the query string even when
 * the base URL contains a fragment (e.g. `https://x.com/?a=1#hash`).
 */
/**
 * Append the sponsor ID as the final path segment of `base`.
 * Used for replicated-site-style URLs (e.g. `https://morehealth.cn/m/<id>`).
 * Returns null if base is empty; returns base unchanged if sponsorId is null.
 */
function withSponsorIdInPath(
  base: string | null,
  sponsorId: string | null,
): string | null {
  if (!base) return null;
  if (!sponsorId) return base;
  const slug = encodeURIComponent(sponsorId.toLowerCase());
  try {
    const u = new URL(base);
    u.pathname = u.pathname.endsWith("/")
      ? `${u.pathname}${slug}`
      : `${u.pathname}/${slug}`;
    return u.toString();
  } catch {
    const hashIdx = base.indexOf("#");
    const queryIdx = base.indexOf("?");
    const cut =
      hashIdx === -1 && queryIdx === -1
        ? base.length
        : Math.min(
            hashIdx === -1 ? Infinity : hashIdx,
            queryIdx === -1 ? Infinity : queryIdx,
          );
    const head = base.slice(0, cut);
    const tail = base.slice(cut);
    return `${head}${head.endsWith("/") ? "" : "/"}${slug}${tail}`;
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
    // Fall back to naive append for non-absolute strings; still place the
    // param before any fragment so the query is well-formed.
    const hashIdx = base.indexOf("#");
    const head = hashIdx === -1 ? base : base.slice(0, hashIdx);
    const tail = hashIdx === -1 ? "" : base.slice(hashIdx);
    const sep = head.includes("?") ? "&" : "?";
    return `${head}${sep}sponsor_ID=${encodeURIComponent(sponsorId)}${tail}`;
  }
}

router.get("/share-links", requireAuth, async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);
  const cfg = await readShareLinks();
  const sponsorId = profile.kwikApexId;
  res.json({
    shopBaseUrl: cfg.shopBaseUrl,
    enrollBaseUrl: cfg.enrollBaseUrl,
    siteBaseUrl: cfg.siteBaseUrl,
    sponsorId,
    shopShareUrl: withSponsorId(cfg.shopBaseUrl, sponsorId),
    enrollShareUrl: withSponsorId(cfg.enrollBaseUrl, sponsorId),
    siteShareUrl: withSponsorId(cfg.siteBaseUrl, sponsorId),
  });
});

const UpdateShareLinksBody = z.object({
  // Accept absolute http(s) URLs only; empty string clears the value.
  shopBaseUrl: z
    .string()
    .trim()
    .refine((s) => s === "" || /^https?:\/\//i.test(s), {
      message: "Must be an http(s) URL or empty",
    })
    .optional(),
  enrollBaseUrl: z
    .string()
    .trim()
    .refine((s) => s === "" || /^https?:\/\//i.test(s), {
      message: "Must be an http(s) URL or empty",
    })
    .optional(),
  siteBaseUrl: z
    .string()
    .trim()
    .refine((s) => s === "" || /^https?:\/\//i.test(s), {
      message: "Must be an http(s) URL or empty",
    })
    .optional(),
});

router.patch(
  "/admin/share-links",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = UpdateShareLinksBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
      return;
    }
    const current = await readShareLinks();
    const next: ShareLinksConfig = {
      shopBaseUrl:
        parsed.data.shopBaseUrl === undefined
          ? current.shopBaseUrl
          : parsed.data.shopBaseUrl === ""
            ? null
            : parsed.data.shopBaseUrl,
      enrollBaseUrl:
        parsed.data.enrollBaseUrl === undefined
          ? current.enrollBaseUrl
          : parsed.data.enrollBaseUrl === ""
            ? null
            : parsed.data.enrollBaseUrl,
      siteBaseUrl:
        parsed.data.siteBaseUrl === undefined
          ? current.siteBaseUrl
          : parsed.data.siteBaseUrl === ""
            ? null
            : parsed.data.siteBaseUrl,
    };
    const serialized = JSON.stringify(next);
    // Upsert on the singleton key.
    await db
      .insert(appSettingsTable)
      .values({ key: SHARE_LINKS_SETTING_KEY, value: serialized })
      .onConflictDoUpdate({
        target: appSettingsTable.key,
        set: { value: serialized },
      });
    res.json({
      shopBaseUrl: next.shopBaseUrl,
      enrollBaseUrl: next.enrollBaseUrl,
      siteBaseUrl: next.siteBaseUrl,
    });
  },
);

interface DisplayFlags {
  hideVolume: boolean;
  hideInfluencerStatus: boolean;
  hideEarnings: boolean;
}

async function readDisplayFlags(): Promise<DisplayFlags> {
  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, DISPLAY_FLAGS_SETTING_KEY))
    .limit(1);
  if (!row)
    return {
      hideVolume: false,
      hideInfluencerStatus: false,
      hideEarnings: false,
    };
  try {
    const parsed = JSON.parse(row.value) as Partial<DisplayFlags>;
    return {
      hideVolume: parsed.hideVolume === true,
      hideInfluencerStatus: parsed.hideInfluencerStatus === true,
      hideEarnings: parsed.hideEarnings === true,
    };
  } catch {
    return {
      hideVolume: false,
      hideInfluencerStatus: false,
      hideEarnings: false,
    };
  }
}

router.get("/display-flags", requireAuth, async (_req, res) => {
  const flags = await readDisplayFlags();
  res.json(flags);
});

const UpdateDisplayFlagsBody = z.object({
  hideVolume: z.boolean().optional(),
  hideInfluencerStatus: z.boolean().optional(),
  hideEarnings: z.boolean().optional(),
});

router.patch(
  "/admin/display-flags",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = UpdateDisplayFlagsBody.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.issues });
      return;
    }
    const current = await readDisplayFlags();
    const next: DisplayFlags = {
      hideVolume:
        parsed.data.hideVolume === undefined
          ? current.hideVolume
          : parsed.data.hideVolume,
      hideInfluencerStatus:
        parsed.data.hideInfluencerStatus === undefined
          ? current.hideInfluencerStatus
          : parsed.data.hideInfluencerStatus,
      hideEarnings:
        parsed.data.hideEarnings === undefined
          ? current.hideEarnings
          : parsed.data.hideEarnings,
    };
    const serialized = JSON.stringify(next);
    await db
      .insert(appSettingsTable)
      .values({ key: DISPLAY_FLAGS_SETTING_KEY, value: serialized })
      .onConflictDoUpdate({
        target: appSettingsTable.key,
        set: { value: serialized },
      });
    res.json(next);
  },
);

export default router;
