"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";
import { BridgeStateExperience } from "@/src/features/bridge-state/components/bridge-state-experience";
import { useNow } from "@/src/features/bridge-state/hooks/use-now";
import { formatStaleNotice, getDisplayedBridgeState } from "@/src/features/bridge-state/bridge-state.freshness";

export default function Home() {
  const { data, loading, error } = useBridgeState();
  const now = useNow();

  if (loading) {
    return (
      <main className="pt-20" id="main-content">
        <p className="text-center" role="status">
          Loading bridge state...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-20" id="main-content">
        <p className="text-center text-red-600" role="alert">
          Failed to load bridge state.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="pt-20" id="main-content">
        <p className="text-center">No bridge state available.</p>
      </main>
    );
  }

  const { state, staleMinutes } = getDisplayedBridgeState(data, now);

  return (
    <BridgeStateExperience
      state={state}
      notice={staleMinutes !== null ? formatStaleNotice(staleMinutes) : null}
    />
  );
}
