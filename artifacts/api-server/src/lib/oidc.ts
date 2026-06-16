import { Issuer, generators, type Client } from "openid-client";
import type { Request } from "express";
import { logger } from "./logger";

/**
 * Env-driven OpenID Connect configuration for the Kwik shared-login provider.
 *
 * The dashboard authenticates against the same issuer as the Shopify store, so
 * a user who logs in anywhere is logged in everywhere. This module owns issuer
 * discovery + client construction; the auth routes drive the actual flow.
 *
 * Required env to actually log in:
 *   OIDC_CLIENT_ID, OIDC_CLIENT_SECRET
 * Optional env:
 *   OIDC_ISSUER_URL   (default: Kwik dev issuer)
 *   OIDC_REDIRECT_URI (default: derived from the incoming request)
 *   OIDC_SCOPES       (default: "openid profile email offline_access")
 *   OIDC_POST_LOGOUT_REDIRECT_URI (optional, for provider end-session)
 *
 * The provider supports Authorization Code + PKCE (S256) only and
 * `client_secret_post` token auth. When client credentials are absent the
 * auth routes fail clearly rather than silently no-op.
 */

const DEFAULT_ISSUER_URL =
  "https://dev.mh.kwik.dev/ords/oidc_provider/oidc";
const DEFAULT_SCOPES = "openid profile email offline_access";

export function oidcIssuerUrl(): string {
  return (process.env.OIDC_ISSUER_URL ?? DEFAULT_ISSUER_URL).replace(/\/$/, "");
}

export function oidcScopes(): string {
  return process.env.OIDC_SCOPES ?? DEFAULT_SCOPES;
}

export function isOidcConfigured(): boolean {
  return !!(process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET);
}

export { generators };

/**
 * Resolve the public-facing origin (proto + host) of the incoming request,
 * honoring the shared reverse proxy's forwarding headers. Used to derive the
 * OIDC redirect URI when one isn't pinned via env.
 */
function requestOrigin(req: Request): string {
  const xfProto = req.headers["x-forwarded-proto"];
  const proto =
    (Array.isArray(xfProto) ? xfProto[0] : xfProto)?.split(",")[0]?.trim() ||
    req.protocol ||
    "https";
  const xfHost = req.headers["x-forwarded-host"];
  const host =
    (Array.isArray(xfHost) ? xfHost[0] : xfHost)?.split(",")[0]?.trim() ||
    req.headers.host ||
    "";
  return `${proto}://${host}`;
}

/**
 * The absolute callback URL registered with the provider. Pin it with
 * OIDC_REDIRECT_URI for production; otherwise it is derived from the request
 * so dev "just works" behind the shared proxy. It must match exactly between
 * the authorization request and the token exchange.
 */
export function oidcRedirectUri(req: Request): string {
  const fromEnv = process.env.OIDC_REDIRECT_URI;
  if (fromEnv) return fromEnv;
  return `${requestOrigin(req)}/api/auth/callback`;
}

let clientPromise: Promise<Client> | null = null;

/**
 * Discover the issuer and build the OIDC client, caching the result. The
 * client is stateless w.r.t. redirect URI (passed per-request), so a single
 * cached client serves every request.
 */
export async function getOidcClient(): Promise<Client> {
  if (!isOidcConfigured()) {
    throw new Error("OIDC is not configured (missing client id/secret).");
  }
  if (!clientPromise) {
    const issuerUrl = oidcIssuerUrl();
    clientPromise = (async () => {
      try {
        const issuer = await Issuer.discover(issuerUrl);
        logger.info({ issuer: issuer.metadata.issuer }, "OIDC issuer discovered");
        return new issuer.Client({
          client_id: process.env.OIDC_CLIENT_ID!,
          client_secret: process.env.OIDC_CLIENT_SECRET!,
          response_types: ["code"],
          token_endpoint_auth_method: "client_secret_post",
        });
      } catch (err) {
        // Reset so a transient discovery failure can be retried on next call.
        clientPromise = null;
        throw err;
      }
    })();
  }
  return clientPromise;
}
