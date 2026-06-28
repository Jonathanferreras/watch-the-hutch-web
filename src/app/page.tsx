"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";
import { BridgeStateExperience } from "@/src/features/bridge-state/components/bridge-state-experience";

export default function Home() {
  const { data, loading, error } = useBridgeState();

  if (loading) {
    return <p>Loading bridge state...</p>;
  }

  if (error) {
    return <p>Failed to load bridge state.</p>;
  }

  if (!data) {
    return <p>No bridge state available.</p>;
  }

  return <BridgeStateExperience state={data} />;
}
