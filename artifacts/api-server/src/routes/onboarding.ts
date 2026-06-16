import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { db, orderTable } from "@workspace/db";
import { and, desc, inArray, or, sql } from "drizzle-orm";
import { CreateAffiliateBody } from "@workspace/api-zod";
import { createKwikAffiliate, isKwikConfigured } from "../lib/kwikClient";

const router: IRouter = Router();

// Simple in-memory sliding-window rate limit to deter PII enumeration via
// /onboarding/lookup-order. Each (ip + lowercase-email) bucket allows
// MAX_ATTEMPTS in WINDOW_MS. This is best-effort (single-process); a
// production rollout should layer a shared limiter (Redis / cloud WAF).
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 8;
const lookupAttempts = new Map<string, number[]>();

function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const arr = (lookupAttempts.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= MAX_ATTEMPTS) {
    lookupAttempts.set(key, arr);
    return { allowed: false, retryAfterMs: arr[0]! + WINDOW_MS - now };
  }
  arr.push(now);
  lookupAttempts.set(key, arr);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (lookupAttempts.size > 5000) {
    for (const [k, v] of lookupAttempts) {
      const fresh = v.filter((t) => t > cutoff);
      if (fresh.length === 0) lookupAttempts.delete(k);
      else lookupAttempts.set(k, fresh);
    }
  }
  return { allowed: true, retryAfterMs: 0 };
}

function normalizeOrderName(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const withoutHash = trimmed.replace(/^#/, "");
  return Array.from(new Set([trimmed, `#${withoutHash}`, withoutHash]));
}

// Public — accepts EITHER an order number OR the email used at checkout
// (one suffices; both narrows the match). When only an email is given we
// return the most recent unclaimed order for that buyer so they can prefill
// their signup. No PII is leaked beyond what the caller already supplied.
router.post("/onboarding/lookup-order", async (req, res) => {
  const orderRaw: unknown = req.body?.orderName;
  const emailRaw: unknown = req.body?.email;
  const orderInput = typeof orderRaw === "string" ? orderRaw.trim() : "";
  const email = typeof emailRaw === "string" ? emailRaw.trim() : "";
  if (!orderInput && !email) {
    res.status(400).json({
      error: "Enter your order number or the email used at checkout.",
    });
    return;
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  // Rate-limit per (ip + identifier). Prefer the email bucket when present so
  // an attacker can't bypass the limit by varying the order number.
  const key = `${ip}|${(email || orderInput).toLowerCase()}`;
  const limit = checkRateLimit(key);
  if (!limit.allowed) {
    res.setHeader("Retry-After", Math.ceil(limit.retryAfterMs / 1000).toString());
    req.log?.warn({ ip }, "Order lookup rate limit hit");
    res.status(429).json({
      error: "Too many attempts. Please wait a few minutes and try again.",
    });
    return;
  }

  const conditions = [];
  if (orderInput) {
    const candidates = normalizeOrderName(orderInput);
    conditions.push(
      or(
        inArray(orderTable.orderName, candidates),
        inArray(orderTable.shopifyOrderId, candidates),
      ),
    );
  }
  if (email) {
    conditions.push(sql`lower(${orderTable.customerEmail}) = lower(${email})`);
  }
  const where =
    conditions.length === 1 ? conditions[0] : and(...conditions);

  // Pull a handful of the most recent matches so we can prefer an unclaimed
  // order (the one the buyer can actually use to set up their account).
  const rows = await db
    .select()
    .from(orderTable)
    .where(where)
    .orderBy(desc(orderTable.occurredAt))
    .limit(20);

  if (rows.length === 0) {
    req.log?.info(
      {
        hasOrder: !!orderInput,
        hasEmail: !!email,
        emailHash: email
          ? crypto.createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 8)
          : null,
      },
      "Order lookup miss",
    );
    res.status(404).json({
      error: "We couldn't find an order matching that. Double-check your order number or the email used at checkout.",
    });
    return;
  }

  const order = rows.find((r) => !r.clerkUserId);
  if (!order) {
    // Every matching order is already claimed → send them to sign in.
    res.status(409).json({
      error: "This order is already linked to an existing account. Please sign in instead.",
      alreadyClaimed: true,
    });
    return;
  }

  const shipping = order.shippingAddress ?? null;
  res.json({
    orderName: order.orderName ?? order.shopifyOrderId,
    email: order.customerEmail,
    phone: order.customerPhone,
    firstName: shipping?.firstName ?? null,
    lastName: shipping?.lastName ?? null,
    shippingAddress: shipping
      ? {
          line1: shipping.line1 ?? null,
          line2: shipping.line2 ?? null,
          city: shipping.city ?? null,
          region: shipping.region ?? null,
          postalCode: shipping.postalCode ?? null,
          country: shipping.country ?? null,
          countryCode: shipping.countryCode ?? null,
        }
      : null,
  });
});

// Public — called from the /activate signup form BEFORE the Clerk account is
// created. Exchanges OAuth client-credentials and forwards the customer to the
// Kwik MLM backend. Order-gated (the email must match a known order) and
// rate-limited to prevent abuse of an unauthenticated account-creation path.
router.post("/onboarding/create-affiliate", async (req, res) => {
  const parsed = CreateAffiliateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password, givenName, familyName, phoneNumber, acceptsMarketing } =
    parsed.data;

  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const limit = checkRateLimit(`affiliate|${ip}|${email.toLowerCase()}`);
  if (!limit.allowed) {
    res.setHeader("Retry-After", Math.ceil(limit.retryAfterMs / 1000).toString());
    req.log?.warn({ ip }, "Create-affiliate rate limit hit");
    res.status(429).json({
      error: "Too many attempts. Please wait a few minutes and try again.",
    });
    return;
  }

  // Order-gate: only allow affiliate creation for emails tied to a real order,
  // matching the onboarding security posture (this endpoint is unauthenticated).
  const [order] = await db
    .select({ id: orderTable.id })
    .from(orderTable)
    .where(sql`lower(${orderTable.customerEmail}) = lower(${email})`)
    .limit(1);
  if (!order) {
    res.status(403).json({
      error: "No order matches this email, so an account can't be created here.",
    });
    return;
  }

  if (!isKwikConfigured()) {
    req.log?.error("Kwik API credentials are not configured");
    res.status(503).json({
      error: "Account service is not configured. Please contact support.",
    });
    return;
  }

  try {
    const result = await createKwikAffiliate({
      email,
      password,
      givenName,
      familyName,
      phoneNumber,
      acceptsMarketing,
    });
    req.log?.info({ kwikUserId: result.userId }, "Kwik affiliate created");
    res.json({ ok: true });
  } catch (err) {
    req.log?.error({ err }, "Kwik affiliate creation failed");
    res.status(502).json({
      error: "We couldn't create your account right now. Please try again.",
    });
  }
});

export default router;
