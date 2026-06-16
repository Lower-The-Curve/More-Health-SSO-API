import { useGetProfile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

export function useCurrentUser() {
  const { user, isLoaded: authLoaded } = useAuth();
  const profileQuery = useGetProfile();

  const firstName = profileQuery.data?.firstName ?? user?.firstName ?? null;
  const lastName = profileQuery.data?.lastName ?? user?.lastName ?? null;
  const email = user?.email ?? profileQuery.data?.email ?? null;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || email || "Influencer";
  const initials =
    (firstName?.[0] ?? "") + (lastName?.[0] ?? "") ||
    (email?.[0]?.toUpperCase() ?? "U");
  const imageUrl = null;
  const influencerId = profileQuery.data?.influencerId ?? "";
  const rank = profileQuery.data?.rank ?? "Influencer";
  const walletBalanceCents = profileQuery.data?.walletBalanceCents ?? 0;
  const isAdmin = profileQuery.data?.isAdmin ?? user?.isAdmin ?? false;
  const phone = profileQuery.data?.phone ?? null;
  const phoneVerified = profileQuery.data?.phoneVerified ?? false;

  return {
    isLoaded: authLoaded,
    user,
    profile: profileQuery.data,
    firstName,
    lastName,
    fullName,
    initials,
    imageUrl,
    influencerId,
    rank,
    walletBalanceCents,
    isAdmin,
    phone,
    phoneVerified,
  };
}
