"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";
import { BridgeStateExperience } from "@/src/features/bridge-state/components/bridge-state-experience";

export default function Home() {
  const { data, loading, error } = useBridgeState();

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

  return <BridgeStateExperience state={data} />;
}
