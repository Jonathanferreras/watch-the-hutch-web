"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";
import { BridgeStatusVisualizer } from "@/src/features/bridge-state/components/bridge-status-visualizer/bridge-status-visualizer";
import { BridgeStateOverview } from "@/src/features/bridge-state/components/bridge-state-overview";
import { BridgeTrafficOverview } from "@/src/features/bridge-state/components/bridge-traffic-overview/bridge-traffic-overview";

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

  const { position, northBoundTraffic, northBoundTrafficConfidence, southBoundTraffic, southBoundTrafficConfidence } = data;

  return (
    <main className="pt-16">
      <BridgeStateOverview state={{ position }} />
      <BridgeStatusVisualizer state={data} />
      <BridgeTrafficOverview traffic={{
        northBoundTraffic,
        northBoundTrafficConfidence,
        southBoundTraffic,
        southBoundTrafficConfidence
      }} />
    </main>
  );
}
