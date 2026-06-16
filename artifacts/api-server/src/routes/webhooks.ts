import { Router, type IRouter, type Request, text } from "express";
import { db, orderTable, userProfileTable, type ShippingAddress } from "@workspace/db";
import { sql, eq, and, isNull } from "drizzle-orm";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function verifyShopifyHmac(raw: string, headerHmac: string | undefined): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !headerHmac || !raw) return false;
  try {
    const computed = createHmac("sha256", secret).update(raw, "utf8").digest("base64");
    const a = Buffer.from(computed, "utf8");
    const b = Buffer.from(headerHmac, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Shopify Flow's "send HTTP request" action cannot compute a webhook HMAC, so
// Flow-originated orders authenticate with the shared SHOPIFY_FLOW_TOKEN bearer
// token instead — the same token already used to guard /public/sponsors.
// Accepts `Authorization: Bearer <token>` or a `?token=` query param.
function verifyFlowToken(req: Request): boolean {
  const expected = process.env.SHOPIFY_FLOW_TOKEN;
  if (!expected) return false;
  const header = req.header("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  const headerToken = m?.[1]?.trim();
  const q = req.query["token"];
  const queryToken = typeof q === "string" ? q.trim() : undefined;
  const provided = headerToken || queryToken;
  if (!provided) return false;
  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const router: IRouter = Router();

interface ShopifyAddress {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  province_code?: string | null;
  country?: string | null;
  country_code?: string | null;
  zip?: string | null;
}
interface ShopifyLineItem {
  title?: string;
  name?: string;
  variant_title?: string | null;
  sku?: string | null;
  quantity?: number;
  price?: string | null;
  product_id?: number | string | null;
  variant_id?: number | string | null;
}
interface ShopifyDiscountCode {
  code?: string;
  amount?: string;
  type?: string | null;
}
interface ShopifyNoteAttribute {
  name?: string;
  value?: string;
}
interface ShopifyCustomer {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}
interface ShopifyPricing {
  subtotal?: string | number | null;
  total_price?: string | number | null;
  current_total_price?: string | number | null;
  total_tax?: string | number | null;
  total_shipping?: string | number | null;
  total_discounts?: string | number | null;
}
interface ShopifyOrderPayload {
  // Standard Shopify webhook fields
  id?: number | string;
  name?: string | null;
  order_number?: number | string | null;
  email?: string | null;
  phone?: string | null;
  contact_email?: string | null;
  customer?: ShopifyCustomer | null;
  shipping_address?: ShopifyAddress | null;
  billing_address?: ShopifyAddress | null;
  total_price?: string | number | null;
  current_total_price?: string | number | null;
  currency?: string | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
  line_items?: ShopifyLineItem[];
  note?: string | null;
  tags?: string | string[] | null;
  discount_codes?: ShopifyDiscountCode[];
  note_attributes?: ShopifyNoteAttribute[];

  // Shopify Flow "order_created" / "order_paid" trigger payload fields
  event?: string;
  order_id?: string | number | null;
  order_name?: string | null;
  pricing?: ShopifyPricing | null;
}

// Shopify GIDs look like "gid://shopify/Order/6981618991291".
// Return the trailing numeric ID, or the raw value unchanged if not a GID.
function unwrapGid(v: string | number | null | undefined): string | null {
  if (v == null) return null;
  const s = String(v);
  const m = /^gid:\/\/shopify\/[^/]+\/(.+)$/.exec(s);
  return m ? m[1]! : s;
}

function toCents(amount: string | number | null | undefined): number {
  if (amount == null) return 0;
  const n = typeof amount === "number" ? amount : parseFloat(amount);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

// Shopify Flow's Liquid templating leaves empty values where a number/boolean
// was expected, producing fragments like:
//   "order_number": ,
//   "taxes_included": }
//   "requires_shipping": ]
// which break strict JSON.parse. Rewrite those to `null` so we can still
// ingest the order. Also strip trailing commas Flow sometimes emits.
function sanitizeFlowJson(raw: string): string {
  let s = raw
    .replace(/:\s*(?=[,}\]])/g, ": null")
    .replace(/,(\s*[}\]])/g, "$1");
  // Walk the string tracking string boundaries and brace/bracket depth, then
  // append closers for anything left open. Shopify Flow's JSON body template
  // often omits the outermost `}`, which would otherwise drop the whole order.
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") stack.push("}");
    else if (c === "[") stack.push("]");
    else if (c === "}" || c === "]") stack.pop();
  }
  while (stack.length) s += stack.pop();
  return s;
}

// Last-ditch effort: pull the order id/name out of an unparseable body so
// we can still record the order in the DB with a stub payload.
function extractOrderIdFallback(raw: string): {
  shopifyOrderId: string | null;
  orderName: string | null;
} {
  const idMatch =
    /"order_id"\s*:\s*"([^"]+)"/.exec(raw) ?? /"id"\s*:\s*"?([^",}\s]+)/.exec(raw);
  const nameMatch =
    /"order_name"\s*:\s*"([^"]+)"/.exec(raw) ?? /"name"\s*:\s*"([^"]+)"/.exec(raw);
  return {
    shopifyOrderId: idMatch ? unwrapGid(idMatch[1]!) : null,
    orderName: nameMatch ? nameMatch[1]! : null,
  };
}

function normalizeAddress(a: ShopifyAddress | null | undefined): ShippingAddress | null {
  if (!a) return null;
  if (!a.address1 && !a.city && !a.zip) return null;
  return {
    firstName: a.first_name ?? null,
    lastName: a.last_name ?? null,
    phone: a.phone ?? null,
    line1: a.address1 ?? null,
    line2: a.address2 ?? null,
    city: a.city ?? null,
    region: a.province ?? a.province_code ?? null,
    postalCode: a.zip ?? null,
    country: a.country ?? null,
    countryCode: a.country_code ?? null,
  };
}

router.post(
  "/webhooks/shopify/orders",
  // Parse as raw text so we can log the body on JSON failures. Shopify Flow
  // produces unescaped values that can break strict JSON.parse, and the
  // default Express body parser would respond with opaque "Bad Request" HTML
  // instead of telling us what's wrong.
  text({ limit: "5mb", type: () => true }),
  async (req, res) => {
    // Public webhook endpoint. Accepts either a raw Shopify Order JSON
    // (recommended) or a wrapper { order: { ... } }. Idempotent via
    // shopify_order_id, so replays are safe.
    const raw = typeof req.body === "string" ? req.body : "";
    let body: ({ order?: ShopifyOrderPayload } & ShopifyOrderPayload) | null = null;
    let parseWarning: string | null = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch (err1) {
        // First failure — try lenient sanitization (Flow leaves empty number/
        // boolean values that produce invalid JSON).
        try {
          body = JSON.parse(sanitizeFlowJson(raw));
          parseWarning = "Recovered from invalid JSON via sanitization";
          req.log?.warn(
            { firstError: (err1 as Error).message, bodyLength: raw.length },
            parseWarning,
          );
        } catch (err2) {
          // Truly unparseable — fall back to a regex extraction so we still
          // record the order. UI will show mostly empty fields.
          const message = (err2 as Error).message;
          const offsetMatch = /position (\d+)/.exec(message);
          const offset = offsetMatch ? Number(offsetMatch[1]) : -1;
          const snippet =
            offset >= 0
              ? raw.slice(Math.max(0, offset - 80), offset + 80)
              : raw.slice(0, 200);
          parseWarning = `Unparseable JSON (${message}); ingested as stub`;
          req.log?.warn(
            { parseError: message, offset, snippet, bodyLength: raw.length },
            "Shopify webhook JSON unrecoverable — ingesting as stub",
          );
          body = null;
        }
      }
    }

    const payload: ShopifyOrderPayload =
      body && typeof body === "object" && body.order && typeof body.order === "object"
        ? body.order
        : (body ?? {});

    // Accept both raw Shopify webhook (`id`) and Shopify Flow (`order_id`,
    // often a GID like `gid://shopify/Order/123`).
    let shopifyOrderId =
      unwrapGid(payload?.id ?? null) ?? unwrapGid(payload?.order_id ?? null);
    let fallbackOrderName: string | null = null;
    if (!shopifyOrderId && raw) {
      const fb = extractOrderIdFallback(raw);
      shopifyOrderId = fb.shopifyOrderId;
      fallbackOrderName = fb.orderName;
    }
    if (!shopifyOrderId) {
      req.log?.warn(
        { keys: body ? Object.keys(body) : [], bodyLength: raw.length },
        "Shopify order webhook missing id; dropping",
      );
      // Acknowledge so Flow doesn't retry forever, but signal that nothing was stored.
      res.status(200).json({ ok: false, reason: "no_order_id" });
      return;
    }

    const customerEmail =
      payload.customer?.email ?? payload.email ?? payload.contact_email ?? null;
    const customerPhone =
      payload.customer?.phone ??
      payload.shipping_address?.phone ??
      payload.billing_address?.phone ??
      payload.phone ??
      null;
    const customerName =
      [payload.customer?.first_name, payload.customer?.last_name]
        .filter(Boolean)
        .join(" ") ||
      [payload.shipping_address?.first_name, payload.shipping_address?.last_name]
        .filter(Boolean)
        .join(" ") ||
      customerEmail ||
      "Shopify customer";
    const productName =
      payload.line_items?.[0]?.title ||
      payload.line_items?.[0]?.name ||
      (payload.line_items && payload.line_items.length > 1
        ? `${payload.line_items.length} items`
        : "Order");
    const amountCents = toCents(
      payload.current_total_price ??
        payload.total_price ??
        payload.pricing?.current_total_price ??
        payload.pricing?.total_price ??
        "0",
    );
    const currency = payload.currency ?? "USD";
    const status = payload.financial_status ?? "paid";
    const occurredAt = payload.processed_at
      ? new Date(payload.processed_at)
      : payload.created_at
        ? new Date(payload.created_at)
        : new Date();
    const orderName =
      payload.name ??
      payload.order_name ??
      fallbackOrderName ??
      (payload.order_number != null ? `#${payload.order_number}` : null);
    const shippingAddress =
      normalizeAddress(payload.shipping_address) ??
      normalizeAddress(payload.billing_address);

    const note = payload.note ?? null;
    const tagsRaw = payload.tags;
    const tags: string[] = Array.isArray(tagsRaw)
      ? tagsRaw.map((s) => String(s).trim()).filter(Boolean)
      : (tagsRaw ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const lineItems = (payload.line_items ?? []).map((li) => ({
      title: li.title ?? li.name ?? "Item",
      variantTitle: li.variant_title ?? null,
      sku: li.sku ?? null,
      quantity: li.quantity ?? 1,
      priceCents: toCents(li.price),
      productId: unwrapGid(li.product_id ?? null),
      variantId: unwrapGid(li.variant_id ?? null),
    }));
    const discountCodes = (payload.discount_codes ?? []).map((d) => ({
      code: d.code ?? "",
      amountCents: toCents(d.amount),
      type: d.type ?? null,
    }));
    // Shopify Flow exposes order custom attributes (cart attributes) under
    // `customAttributes` with `{key, value}` shape, while Shopify's REST
    // webhook uses `note_attributes` with `{name, value}`. Accept both
    // (plus snake_case alias) so the Flow template can use the most natural
    // field name without the data getting silently dropped — which is what
    // caused order #1040 to lose its sponsor_id.
    type AttrLike = { name?: string; value?: string; key?: string };
    const attrSource: AttrLike[] = [
      ...(Array.isArray(payload.note_attributes) ? payload.note_attributes : []),
      ...(Array.isArray((payload as { custom_attributes?: AttrLike[] }).custom_attributes)
        ? (payload as { custom_attributes: AttrLike[] }).custom_attributes
        : []),
      ...(Array.isArray((payload as { customAttributes?: AttrLike[] }).customAttributes)
        ? (payload as { customAttributes: AttrLike[] }).customAttributes
        : []),
      ...(Array.isArray((payload as { attributes?: AttrLike[] }).attributes)
        ? (payload as { attributes: AttrLike[] }).attributes
        : []),
    ];
    const noteAttributes = attrSource.map((a) => ({
      name: (a.name ?? a.key ?? "").toString(),
      value: (a.value ?? "").toString(),
    }));

    // Map to a user by email if possible.
    let clerkUserId: string | null = null;
    if (customerEmail) {
      const [match] = await db
        .select({ id: userProfileTable.clerkUserId })
        .from(userProfileTable)
        .where(sql`lower(${userProfileTable.email}) = lower(${customerEmail})`)
        .limit(1);
      clerkUserId = match?.id ?? null;
    }

    // If we still have no clerkUserId, check whether an earlier order already
    // synthesized a pending placeholder for this buyer. We key placeholders
    // by Shopify customer id when available (most stable across orders), then
    // by the lowercased email, then by the order itself. This guarantees a
    // second order from the same buyer attaches to the same pending user
    // instead of creating a new placeholder per order.
    const shopifyCustomerIdEarly = unwrapGid(
      (payload.customer as { id?: string } | undefined)?.id ?? null,
    );
    const emailHash = customerEmail
      ? createHash("sha256")
          .update(customerEmail.trim().toLowerCase())
          .digest("hex")
          .slice(0, 16)
      : null;
    let pendingPlaceholderId: string | null = null;
    if (!clerkUserId) {
      pendingPlaceholderId = shopifyCustomerIdEarly
        ? `pending_shop_${shopifyCustomerIdEarly}`
        : emailHash
          ? `pending_email_${emailHash}`
          : `pending_order_${shopifyOrderId}`;
      // If an existing pending placeholder is present, reuse it as-is.
      const [existingPending] = await db
        .select({ id: userProfileTable.clerkUserId })
        .from(userProfileTable)
        .where(eq(userProfileTable.clerkUserId, pendingPlaceholderId))
        .limit(1);
      if (existingPending) {
        clerkUserId = existingPending.id;
      }
    }

    // Extract IDs from the payload so we can auto-fill the matched profile.
    const shopifyCustomerId = shopifyCustomerIdEarly;
    const mfArr = Array.isArray((payload as { metafields?: unknown }).metafields)
      ? ((payload as { metafields: Array<{ key?: string; value?: string }> })
          .metafields)
      : [];
    const mfMap = new Map<string, string>();
    for (const m of mfArr) {
      if (m?.key && typeof m.value === "string" && m.value.trim()) {
        mfMap.set(m.key.toLowerCase(), m.value.trim());
      }
    }
    const apexUserId = mfMap.get("apex_user_id") ?? null;
    const walletOrderRef = mfMap.get("order_reference") ?? null;

    // Verify Shopify HMAC up front. Order ingest itself stays lenient
    // (idempotent on shopify_order_id) for replay safety, but any field
    // that could be used to forge MLM attribution — referrer mapping, and
    // the profile-autofill IDs below — must be gated on a verified
    // signature so an unauthenticated caller cannot poison data by posting
    // crafted payloads.
    const hmacHeader = req.get("x-shopify-hmac-sha256") ?? undefined;
    const hmacVerified = verifyShopifyHmac(raw, hmacHeader);
    // A request is "verified" if it carries either a valid Shopify webhook
    // HMAC (native webhooks) or a valid Flow bearer token (Shopify Flow). Both
    // are shared secrets, so either proves the payload came from our store.
    const verified = hmacVerified || verifyFlowToken(req);

    // MLM attribution: extract sponsor_id from cart/note attributes (most
    // common — Shopify persists cart attributes there). Also fall back to
    // a `sponsor_id` order metafield and a top-level `sponsor_id` field
    // that Shopify Flow templates may surface directly.
    const noteAttrSponsor =
      noteAttributes.find((a) =>
        ["sponsor_id", "sponsorid", "sponsor"].includes(
          a.name.trim().toLowerCase(),
        ),
      )?.value ?? null;
    const metafieldSponsor =
      mfMap.get("sponsor_id") ?? mfMap.get("sponsorid") ?? null;
    const topLevelSponsor =
      (payload as { sponsor_id?: unknown }).sponsor_id ?? null;
    const sponsorCandidate =
      (typeof noteAttrSponsor === "string" && noteAttrSponsor) ||
      metafieldSponsor ||
      (typeof topLevelSponsor === "string" && topLevelSponsor) ||
      null;
    const sponsorId =
      typeof sponsorCandidate === "string" && sponsorCandidate.trim()
        ? sponsorCandidate.trim()
        : null;
    let referrerClerkUserId: string | null = null;
    // Only attribute when the request is verified (HMAC or Flow token) —
    // otherwise an attacker could forge referred orders for any kwikApexId.
    if (verified && sponsorId) {
      const [refMatch] = await db
        .select({ id: userProfileTable.clerkUserId })
        .from(userProfileTable)
        .where(
          sql`lower(${userProfileTable.kwikApexId}) = lower(${sponsorId})`,
        )
        .limit(1);
      referrerClerkUserId = refMatch?.id ?? null;
    }

    // Auto-create a pending placeholder profile for unmapped buyers. This
    // is the "create them as a new user" flow: instead of leaving the order
    // unmapped, we synthesize a placeholder user so the order surfaces a
    // real (pending) account. The placeholder carries the sponsor linkage
    // so admins can see who referred this buyer before they activate.
    //
    // A placeholder is created for unmapped buyers from VERIFIED requests
    // (HMAC or Flow token) so every legitimate buyer surfaces as a manageable
    // (pending) account. We gate on `verified` because pending placeholders
    // are later merged into the real Clerk profile by email match (see
    // mergePendingPlaceholder in getOrCreateProfile): a placeholder forged by
    // an unauthenticated caller would otherwise graft attacker-controlled
    // orders + sponsor onto a victim's real account on activation. Legitimate
    // store traffic always carries a shared secret, so this never drops a
    // real order. Unverified payloads still record an unmapped order row for
    // admin visibility; they just don't synthesize an account.
    // Identity fields (name / email / phone) come straight from the order.
    if (verified && !clerkUserId && pendingPlaceholderId) {
      const first =
        payload.customer?.first_name ??
        payload.shipping_address?.first_name ??
        null;
      const last =
        payload.customer?.last_name ??
        payload.shipping_address?.last_name ??
        null;
      // Synthetic but human-recognizable influencer id for the pending
      // placeholder. Real users get MH-XXXXXX from clerk id; for pending
      // we derive from the placeholder suffix to keep it stable and short.
      const placeholderTail = pendingPlaceholderId
        .slice(-6)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "X");
      const placeholderInfluencerId = `MH-P${placeholderTail}`;
      // This block only runs for verified requests, so the buyer's Shopify
      // customer id and sponsor attribution are trusted.
      const placeholderShopifyCustomerId = shopifyCustomerId;
      await db
        .insert(userProfileTable)
        .values({
          clerkUserId: pendingPlaceholderId,
          influencerId: placeholderInfluencerId,
          // Pending users aren't yet eligible to share — leave kwikApexId
          // null so they don't appear in /public/sponsors dropdowns.
          kwikApexId: null,
          rank: "Influencer",
          firstName: first,
          lastName: last,
          email: customerEmail,
          phone: customerPhone,
          shopifyCustomerId: placeholderShopifyCustomerId,
          accountStatus: "pending",
          sponsorClerkUserId: referrerClerkUserId,
          sponsorIdRaw: sponsorId,
        })
        .onConflictDoNothing({ target: userProfileTable.clerkUserId });

      // If a placeholder already existed, opportunistically fill in any
      // newly-available identity fields without overwriting admin-set data.
      await db
        .update(userProfileTable)
        .set({
          firstName: sql`COALESCE(${userProfileTable.firstName}, ${first})`,
          lastName: sql`COALESCE(${userProfileTable.lastName}, ${last})`,
          email: sql`COALESCE(${userProfileTable.email}, ${customerEmail})`,
          phone: sql`COALESCE(${userProfileTable.phone}, ${customerPhone})`,
          shopifyCustomerId: sql`COALESCE(${userProfileTable.shopifyCustomerId}, ${placeholderShopifyCustomerId})`,
          sponsorClerkUserId: sql`COALESCE(${userProfileTable.sponsorClerkUserId}, ${referrerClerkUserId})`,
          sponsorIdRaw: sql`COALESCE(${userProfileTable.sponsorIdRaw}, ${sponsorId})`,
        })
        .where(eq(userProfileTable.clerkUserId, pendingPlaceholderId));

      clerkUserId = pendingPlaceholderId;
    }

    // Auto-populate IDs on the matched profile if currently blank. Never
    // overwrite values an admin has set manually. Gated on a verified
    // request (HMAC or Flow token) computed above.
    if (
      verified &&
      clerkUserId &&
      (shopifyCustomerId || apexUserId || walletOrderRef)
    ) {
      const setExpr: Record<string, unknown> = {};
      if (shopifyCustomerId) {
        setExpr.shopifyCustomerId = sql`COALESCE(${userProfileTable.shopifyCustomerId}, ${shopifyCustomerId})`;
      }
      if (apexUserId) {
        setExpr.kwikApexId = sql`COALESCE(${userProfileTable.kwikApexId}, ${apexUserId})`;
      }
      if (walletOrderRef) {
        setExpr.netfiWalletId = sql`COALESCE(${userProfileTable.netfiWalletId}, ${walletOrderRef})`;
      }
      await db
        .update(userProfileTable)
        .set(setExpr)
        .where(eq(userProfileTable.clerkUserId, clerkUserId));
    }

    // Idempotent atomic upsert keyed by shopify_order_id.
    const [insertedOrder] = await db
      .insert(orderTable)
      .values({
        clerkUserId,
        sponsorId,
        referrerClerkUserId,
        customerName,
        customerEmail,
        customerPhone,
        productName,
        amountCents,
        cvCents: amountCents,
        qvCents: amountCents,
        commissionCents: 0,
        currency,
        status,
        source: "shopify",
        shopifyOrderId,
        orderName,
        shippingAddress,
        note,
        tags,
        discountCodes,
        noteAttributes,
        lineItems,
        rawPayload: {
          ...(payload as unknown as Record<string, unknown>),
          ...(parseWarning ? { _parseWarning: parseWarning, _rawBody: raw } : {}),
        },
        occurredAt,
      })
      .onConflictDoUpdate({
        target: orderTable.shopifyOrderId,
        set: {
          // Monotonic claim: keep an existing user mapping; only fill if currently null.
          clerkUserId: sql`COALESCE(${orderTable.clerkUserId}, EXCLUDED.clerk_user_id)`,
          sponsorId: sql`COALESCE(${orderTable.sponsorId}, EXCLUDED.sponsor_id)`,
          referrerClerkUserId: sql`COALESCE(${orderTable.referrerClerkUserId}, EXCLUDED.referrer_clerk_user_id)`,
          customerName,
          customerEmail,
          customerPhone,
          productName,
          amountCents,
          cvCents: sql`COALESCE(${orderTable.cvCents}, EXCLUDED.cv_cents)`,
          qvCents: sql`COALESCE(${orderTable.qvCents}, EXCLUDED.qv_cents)`,
          currency,
          status,
          orderName,
          shippingAddress,
          note,
          tags,
          discountCodes,
          noteAttributes,
          lineItems,
          rawPayload: {
            ...(payload as unknown as Record<string, unknown>),
            ...(parseWarning ? { _parseWarning: parseWarning, _rawBody: raw } : {}),
          },
          occurredAt,
        },
      })
      .returning({ id: orderTable.id });

    // Backfill the placeholder's audit pointer to the order that triggered
    // it, once we know the order id. Only writes if still null, so it
    // records the first order that created the placeholder (not the latest).
    if (
      pendingPlaceholderId &&
      clerkUserId === pendingPlaceholderId &&
      insertedOrder?.id
    ) {
      await db
        .update(userProfileTable)
        .set({ createdFromOrderId: insertedOrder.id })
        .where(
          and(
            eq(userProfileTable.clerkUserId, pendingPlaceholderId),
            isNull(userProfileTable.createdFromOrderId),
          ),
        );
    }

    req.log?.info(
      { shopifyOrderId, orderName, clerkUserId, sponsorId, referrerClerkUserId },
      "Shopify order ingested",
    );

    res.status(200).json({
      ok: true,
      mapped: !!clerkUserId,
      referred: !!referrerClerkUserId,
    });
  },
);

export default router;
