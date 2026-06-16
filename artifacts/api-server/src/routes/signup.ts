import { Router, type IRouter } from "express";
import { db, userProfileTable } from "@workspace/db";
import { and, ne, sql } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const CheckEmailBody = z.object({
  email: z.string().trim().email(),
});

// Simple in-memory sliding-window rate limit to deter account enumeration
// via /signup/check-email. Mirrors the limiter pattern used in onboarding.
// Best-effort (single-process); a production rollout should layer a shared
// limiter (Redis / cloud WAF).
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_EMAIL = 5;
const ipAttempts = new Map<string, number[]>();
const emailAttempts = new Map<string, number[]>();

function take(bucket: Map<string, number[]>, key: string, limit: number) {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const arr = (bucket.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= limit) {
    bucket.set(key, arr);
    return { allowed: false, retryAfterMs: arr[0]! + WINDOW_MS - now };
  }
  arr.push(now);
  bucket.set(key, arr);
  if (bucket.size > 5000) {
    for (const [k, v] of bucket) {
      const fresh = v.filter((t) => t > cutoff);
      if (fresh.length === 0) bucket.delete(k);
      else bucket.set(k, fresh);
    }
  }
  return { allowed: true, retryAfterMs: 0 };
}

router.post("/signup/check-email", async (req, res) => {
  const parsed = CheckEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";

  const ipCheck = take(ipAttempts, ip, MAX_ATTEMPTS_PER_IP);
  if (!ipCheck.allowed) {
    res
      .status(429)
      .set("Retry-After", String(Math.ceil(ipCheck.retryAfterMs / 1000)))
      .json({ error: "Too many requests" });
    return;
  }
  const emailCheck = take(emailAttempts, email, MAX_ATTEMPTS_PER_EMAIL);
  if (!emailCheck.allowed) {
    res
      .status(429)
      .set("Retry-After", String(Math.ceil(emailCheck.retryAfterMs / 1000)))
      .json({ error: "Too many requests" });
    return;
  }

  try {
    // An account "exists" (can sign in) when a non-pending local profile has
    // this email. Pending placeholders (synthesized from orders) don't yet
    // have a login, so they should not block someone from activating.
    const [row] = await db
      .select({ id: userProfileTable.clerkUserId })
      .from(userProfileTable)
      .where(
        and(
          sql`lower(${userProfileTable.email}) = ${email}`,
          ne(userProfileTable.accountStatus, "pending"),
        ),
      )
      .limit(1);
    res.json({ exists: !!row });
  } catch (err) {
    req.log.error({ err }, "check-email failed");
    res.status(500).json({ error: "Lookup failed" });
  }
});

export default router;
