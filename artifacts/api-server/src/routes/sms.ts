import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { db, userProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// MVP in-memory store. Codes expire in 10 minutes.
// In dev (no SMS provider configured) the code is returned in the response
// so the UI can show it — enough to demo the flow end-to-end without Twilio.
interface CodeRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  phone: string;
}
const codes = new Map<string, CodeRecord>(); // key = clerkUserId
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;
const lastSent = new Map<string, number>();

function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "");
}

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

const devMode = !process.env.TWILIO_ACCOUNT_SID;

router.post("/sms/send-code", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const phoneInput: unknown = req.body?.phone;
  if (typeof phoneInput !== "string" || !phoneInput.trim()) {
    res.status(400).json({ error: "phone is required" });
    return;
  }
  const phone = normalizePhone(phoneInput);
  if (phone.length < 7) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  const now = Date.now();
  const last = lastSent.get(userId);
  if (last && now - last < RESEND_COOLDOWN_MS) {
    res.setHeader(
      "Retry-After",
      Math.ceil((RESEND_COOLDOWN_MS - (now - last)) / 1000).toString(),
    );
    res.status(429).json({ error: "Please wait before requesting another code." });
    return;
  }
  lastSent.set(userId, now);

  const code = generateCode();
  codes.set(userId, {
    code,
    expiresAt: now + CODE_TTL_MS,
    attempts: 0,
    phone,
  });

  if (devMode) {
    req.log?.warn(
      { userId, phone, code },
      "SMS verification code (DEV MODE — would have been sent via SMS)",
    );
    res.json({ ok: true, devMode: true, devCode: code });
    return;
  }

  // Real SMS provider would go here (e.g. Twilio). For MVP we don't have one,
  // so we only reach this branch if TWILIO_ACCOUNT_SID is set without code wired up.
  req.log?.error("SMS provider not implemented");
  res.status(503).json({ error: "SMS provider not configured." });
});

router.post("/sms/verify-code", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const codeInput: unknown = req.body?.code;
  if (typeof codeInput !== "string") {
    res.status(400).json({ error: "code is required" });
    return;
  }
  const submitted = codeInput.replace(/\s+/g, "");
  const record = codes.get(userId);
  if (!record) {
    res.status(400).json({ error: "No code requested. Send a code first." });
    return;
  }
  if (Date.now() > record.expiresAt) {
    codes.delete(userId);
    res.status(400).json({ error: "Code expired. Request a new one." });
    return;
  }
  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    codes.delete(userId);
    res.status(429).json({ error: "Too many attempts. Request a new code." });
    return;
  }

  // Dev/demo bypass: when no real SMS provider is wired up we already return
  // the generated code in the send-code response, so the flow is non-secret
  // by design. Allow a fixed "111111" code in that same mode so testers can
  // verify any phone without waiting for / copying the real code. Never
  // active once a provider is configured (devMode === false).
  const DEV_BYPASS_CODE = "111111";
  if (devMode && submitted === DEV_BYPASS_CODE) {
    codes.delete(userId);
    lastSent.delete(userId);
    await db
      .update(userProfileTable)
      .set({ phone: record.phone, phoneVerified: true })
      .where(eq(userProfileTable.clerkUserId, userId));
    req.log?.warn(
      { userId, phone: record.phone },
      "Phone verified via DEV bypass code (no SMS provider configured)",
    );
    res.json({ ok: true, phone: record.phone, devBypass: true });
    return;
  }

  const a = Buffer.from(submitted);
  const b = Buffer.from(record.code);
  // timingSafeEqual throws on length mismatch — guard first so we just return 400.
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!match) {
    res.status(400).json({
      error: "Incorrect code.",
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.attempts),
    });
    return;
  }

  codes.delete(userId);
  lastSent.delete(userId);
  await db
    .update(userProfileTable)
    .set({ phone: record.phone, phoneVerified: true })
    .where(eq(userProfileTable.clerkUserId, userId));
  req.log?.info({ userId, phone: record.phone }, "Phone verified");
  res.json({ ok: true, phone: record.phone });
});

export default router;
