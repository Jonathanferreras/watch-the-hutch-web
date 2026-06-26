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

  return (
    <main className="pt-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] md:gap-6 md:px-4">
        <div>
          <BridgeStateOverview state={data} />
          <BridgeStatusVisualizer state={data} />
        </div>

        <div className="mt-0 md:mt-8">
          <BridgeTrafficOverview state={data} />
        </div>
      </div>
    </main>
  );
}
