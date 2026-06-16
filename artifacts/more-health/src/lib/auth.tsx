import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Server-authenticated user, as returned by the BFF endpoint `/api/auth/me`.
 * The SPA never sees OIDC tokens — the session lives in an httpOnly cookie and
 * the server resolves identity for us.
 */
export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
}

interface MeResponse {
  authenticated: boolean;
  user?: AuthUser;
}

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
}

const AUTH_ME_KEY = ["auth", "me"] as const;

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    return { authenticated: false };
  }
  return (await res.json()) as MeResponse;
}

/**
 * Begin the OIDC login flow. This is a full-page navigation (not SPA routing)
 * because the browser must follow the redirect to the identity provider.
 */
export function startLogin(returnTo?: string): void {
  const target = returnTo ?? window.location.pathname + window.location.search;
  const url = `/api/auth/login?returnTo=${encodeURIComponent(target)}`;
  window.location.assign(url);
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const value: AuthState = {
    isLoaded: !query.isLoading,
    isSignedIn: query.data?.authenticated ?? false,
    user: query.data?.user ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/**
 * Hook returning a logout function that destroys the server session, clears the
 * react-query cache, and redirects to the sign-in screen.
 */
export function useLogout(): () => Promise<void> {
  const qc = useQueryClient();
  return async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      qc.clear();
      window.location.assign("/sign-in");
    }
  };
}
