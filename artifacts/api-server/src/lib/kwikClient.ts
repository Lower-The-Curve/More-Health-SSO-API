import { logger } from "./logger";

/**
 * Client for the Kwik MLM backend (ORDS) used during the /activate signup flow
 * to create the customer/affiliate record. Auth is OAuth 2.0 client-credentials
 * with HTTP Basic client authentication; the access token is reused until it is
 * close to expiry.
 *
 * Required env:
 *   KWIK_CLIENT_ID, KWIK_CLIENT_SECRET
 * Optional env:
 *   KWIK_API_BASE_URL (default: https://dev.mh.kwik.dev/ords/mh)
 */

const DEFAULT_BASE_URL = "https://dev.mh.kwik.dev/ords/mh";

function baseUrl(): string {
  return (process.env.KWIK_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function isKwikConfigured(): boolean {
  return !!(process.env.KWIK_CLIENT_ID && process.env.KWIK_CLIENT_SECRET);
}

export interface KwikAffiliateInput {
  email: string;
  password: string;
  givenName?: string | null;
  familyName?: string | null;
  phoneNumber?: string | null;
  acceptsMarketing?: boolean;
}

export interface KwikAffiliateResult {
  userId: number | null;
  email: string | null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }
  const clientId = process.env.KWIK_CLIENT_ID;
  const clientSecret = process.env.KWIK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Kwik API is not configured (missing client id/secret).");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });

  const text = await res.text();
  if (!res.ok) {
    // Do not include the upstream body in the error/logs — this flow handles
    // plaintext credentials and the upstream may echo request fields.
    logger.warn({ status: res.status }, "Kwik OAuth token request failed");
    throw new Error(`Kwik OAuth token request failed (${res.status}).`);
  }

  let parsed: { access_token?: string; expires_in?: number };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new Error("Kwik OAuth token response was not valid JSON.");
  }
  if (!parsed.access_token) {
    throw new Error("Kwik OAuth token response did not include an access_token.");
  }

  // Refresh 60s before expiry; default to 5 minutes if expires_in is absent.
  const ttlMs = (parsed.expires_in ?? 300) * 1000;
  cachedToken = {
    token: parsed.access_token,
    expiresAt: now + Math.max(ttlMs - 60_000, 0),
  };
  return parsed.access_token;
}

const yn = (v: boolean | undefined, dflt: boolean): "Y" | "N" =>
  (v ?? dflt) ? "Y" : "N";

/**
 * Create a customer/affiliate in the Kwik backend. Throws on any non-2xx
 * response so the caller can block signup. `email_verified` is always sent as
 * "Y" — the activation flow creates the affiliate at password-set time.
 */
export async function createKwikAffiliate(
  input: KwikAffiliateInput,
): Promise<KwikAffiliateResult> {
  const body = JSON.stringify({
    email: input.email,
    password: input.password,
    given_name: input.givenName ?? "",
    family_name: input.familyName ?? "",
    email_verified: "Y",
    phone_number: input.phoneNumber ?? "",
    accepts_marketing: yn(input.acceptsMarketing, true),
  });

  const postOnce = (token: string) =>
    fetch(`${baseUrl()}/cce/affiliate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    });

  let res = await postOnce(await getAccessToken());

  // A 401 usually means a stale cached token; drop it, re-authenticate, and
  // retry exactly once so a transient token issue doesn't block a real signup.
  if (res.status === 401) {
    cachedToken = null;
    res = await postOnce(await getAccessToken());
  }

  if (!res.ok) {
    // Never log the upstream body: this request carries a plaintext password
    // and the upstream may echo request fields back on error.
    logger.warn({ status: res.status }, "Kwik affiliate creation returned an error");
    throw new Error(`Kwik affiliate creation failed (${res.status}).`);
  }

  let parsed: { user_id?: number; email?: string } = {};
  try {
    parsed = JSON.parse(await res.text()) as typeof parsed;
  } catch {
    // ORDS returned a non-JSON 2xx body; treat as success without an id.
  }
  return { userId: parsed.user_id ?? null, email: parsed.email ?? null };
}
