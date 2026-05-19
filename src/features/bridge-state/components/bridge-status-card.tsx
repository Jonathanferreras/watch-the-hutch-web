"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";

export function BridgeStatusCard() {
  const { data, isLoading, error } = useBridgeState();

  if (isLoading) {
    return <p>Loading bridge state...</p>;
  }

  if (error) {
    return <p>Failed to load bridge state.</p>;
  }

  if (!data) {
    return <p>No bridge state available.</p>;
  }

  return (
    <div>
      <h2>Bridge Status</h2>
      <p>Position: {data.position}</p>
      <p>Traffic: {data.traffic}</p>
      <p>Last Updated: {data.updatedAt.toString()}</p>
    </div>
  );
}
