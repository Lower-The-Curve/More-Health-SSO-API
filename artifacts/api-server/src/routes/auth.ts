import { Router, type IRouter } from "express";
import { db, userProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getOidcClient,
  isOidcConfigured,
  oidcRedirectUri,
  oidcScopes,
  generators,
} from "../lib/oidc";
import { getOrCreateProfile } from "../lib/getOrCreateProfile";

const router: IRouter = Router();

/**
 * Validate a caller-supplied post-login destination. Only same-site absolute
 * paths are allowed, to prevent the login flow being used as an open redirect.
 */
function safeReturnTo(raw: unknown): string {
  if (typeof raw !== "string") return "/dashboard";
  // Must be a root-relative path, not a protocol-relative ("//evil.com") or
  // absolute URL.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

/**
 * GET /api/auth/login — begin the OIDC Authorization Code + PKCE flow.
 * Stashes state/nonce/verifier in the session and redirects to the provider.
 */
router.get("/auth/login", async (req, res) => {
  if (!isOidcConfigured()) {
    res.status(503).json({
      error:
        "Login is not configured yet. Add the OIDC client credentials to enable sign-in.",
    });
    return;
  }
  try {
    const client = await getOidcClient();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();
    const returnTo = safeReturnTo(req.query.returnTo);

    req.session.oidcAuth = { state, nonce, codeVerifier, returnTo };

    const authUrl = client.authorizationUrl({
      scope: oidcScopes(),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
      redirect_uri: oidcRedirectUri(req),
    });
    res.redirect(authUrl);
  } catch (err) {
    req.log?.error({ err }, "OIDC login initiation failed");
    res.status(502).json({ error: "Could not start sign-in. Please try again." });
  }
});

/**
 * GET /api/auth/callback — provider redirects here with an auth code. Validate
 * state/nonce, exchange the code, establish the session, provision the local
 * profile, then bounce the user back into the SPA.
 */
router.get("/auth/callback", async (req, res) => {
  const pending = req.session.oidcAuth;
  const failRedirect = (code: string) =>
    res.redirect(`/sign-in?error=${encodeURIComponent(code)}`);

  if (!isOidcConfigured() || !pending) {
    failRedirect("login_failed");
    return;
  }
  try {
    const client = await getOidcClient();
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(oidcRedirectUri(req), params, {
      code_verifier: pending.codeVerifier,
      state: pending.state,
      nonce: pending.nonce,
    });
    const claims = tokenSet.claims();
    const sub = claims.sub;
    const email = (claims.email as string | undefined) ?? null;
    const firstName =
      (claims.given_name as string | undefined) ??
      ((claims.name as string | undefined)?.split(" ")[0] ?? null);
    const lastName =
      (claims.family_name as string | undefined) ??
      ((claims.name as string | undefined)?.split(" ").slice(1).join(" ") ||
        null);

    // Establish the session identity + tokens (HttpOnly, server-side only).
    req.session.oidc = {
      sub,
      email,
      firstName,
      lastName,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      idToken: tokenSet.id_token,
      expiresAt: tokenSet.expires_at ? tokenSet.expires_at * 1000 : undefined,
    };
    // Clear the transient PKCE/state material.
    delete req.session.oidcAuth;

    // Provision (or refresh) the local profile from the verified claims.
    await getOrCreateProfile(sub, { email, firstName, lastName });

    const returnTo = safeReturnTo(pending.returnTo);
    // Persist the session before redirecting so the cookie + store are durable.
    req.session.save((err) => {
      if (err) {
        req.log?.error({ err }, "Session save failed after OIDC callback");
        failRedirect("login_failed");
        return;
      }
      res.redirect(returnTo);
    });
  } catch (err) {
    req.log?.error({ err }, "OIDC callback failed");
    failRedirect("login_failed");
  }
});

/**
 * POST /api/auth/logout — destroy the local session. The SPA navigates the
 * user back to the sign-in screen afterward.
 */
router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.log?.error({ err }, "Session destroy failed");
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("mh.sid", { path: "/" });
    res.json({ ok: true });
  });
});

/**
 * GET /api/auth/me — current-user endpoint for the SPA. Returns the logged-in
 * identity (or { authenticated: false }) without ever exposing tokens.
 */
router.get("/auth/me", async (req, res) => {
  const sub = req.session.oidc?.sub;
  if (!sub) {
    res.json({ authenticated: false });
    return;
  }
  try {
    const [profile] = await db
      .select({
        firstName: userProfileTable.firstName,
        lastName: userProfileTable.lastName,
        email: userProfileTable.email,
        isAdmin: userProfileTable.isAdmin,
      })
      .from(userProfileTable)
      .where(eq(userProfileTable.clerkUserId, sub))
      .limit(1);

    const ident = profile ?? {
      firstName: req.session.oidc?.firstName ?? null,
      lastName: req.session.oidc?.lastName ?? null,
      email: req.session.oidc?.email ?? null,
      isAdmin: false,
    };

    res.json({
      authenticated: true,
      user: {
        id: sub,
        email: ident.email,
        firstName: ident.firstName,
        lastName: ident.lastName,
        isAdmin: ident.isAdmin,
      },
    });
  } catch (err) {
    req.log?.error({ err }, "auth/me lookup failed");
    res.status(500).json({ error: "Lookup failed" });
  }
});

export default router;
