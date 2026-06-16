import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { RequestHandler } from "express";
import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Server-side session for the BFF auth flow. OIDC tokens and the resolved
 * identity live HttpOnly in a Postgres-backed session store, so the SPA never
 * sees tokens and sessions survive server restarts (the dev workflow rebuilds
 * frequently). The browser only ever holds an opaque, signed session id cookie.
 */

declare module "express-session" {
  interface SessionData {
    /** Established identity + tokens after a successful OIDC callback. */
    oidc?: {
      sub: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
      /** Epoch ms when the access token expires, if known. */
      expiresAt?: number;
    };
    /** Transient PKCE/state material kept only between login and callback. */
    oidcAuth?: {
      state: string;
      nonce: string;
      codeVerifier: string;
      returnTo: string;
    };
  }
}

const PgStore = connectPgSimple(session);

export function buildSessionMiddleware(): RequestHandler {
  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail closed in production: an unset or predictable signing secret lets an
    // attacker forge session cookies. Only fall back to a throwaway dev secret
    // outside production, where sessions are disposable.
    if (isProd) {
      throw new Error(
        "SESSION_SECRET must be set in production. Refusing to start with an insecure session signing secret.",
      );
    }
    logger.warn(
      "SESSION_SECRET is not set; using an ephemeral dev secret. Set SESSION_SECRET in production.",
    );
  }
  return session({
    name: "mh.sid",
    secret: secret ?? "dev-insecure-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new PgStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}
