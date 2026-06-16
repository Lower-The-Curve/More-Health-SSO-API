import { useGetDisplayFlags } from "@workspace/api-client-react";

/**
 * Global, admin-controlled display toggles for the user-facing app.
 * `hideVolume` hides all volume data and its visual boxes/KPIs/columns.
 * `hideInfluencerStatus` hides the user's rank/influencer status everywhere.
 * `hideEarnings` hides the Earnings navigation tab.
 * Defaults to showing everything until the flags load (values cached by
 * react-query, so this only matters on the very first paint).
 */
export function useDisplayFlags(): {
  hideVolume: boolean;
  hideInfluencerStatus: boolean;
  hideEarnings: boolean;
  isLoading: boolean;
} {
  const q = useGetDisplayFlags();
  return {
    hideVolume: q.data?.hideVolume ?? false,
    hideInfluencerStatus: q.data?.hideInfluencerStatus ?? false,
    hideEarnings: q.data?.hideEarnings ?? false,
    isLoading: q.isLoading,
  };
}
