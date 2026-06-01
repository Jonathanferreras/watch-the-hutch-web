"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";
import { Navbar } from "@/src/components/Navbar";
import { BridgeStatusVisualizer } from "@/src/features/bridge-state/components/bridge-status-visualizer/bridge-status-visualizer";

export default function Home() {
  const { data } = useBridgeState();

  return (
    <main className="pt-16">
      <Navbar />
      {data && <BridgeStatusVisualizer state={data} />}
    </main>
  );
}
