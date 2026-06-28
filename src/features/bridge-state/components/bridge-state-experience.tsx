import { CurrentBridgeState } from "../bridge-state.types";
import { BridgeStateOverview } from "./bridge-state-overview";
import { BridgeStateExperienceProvider } from "./bridge-state-experience-context";
import { BridgeTrafficOverview } from "./bridge-traffic-overview/bridge-traffic-overview";
import { BridgeStatusVisualizer } from "./bridge-status-visualizer/bridge-status-visualizer";

interface BridgeStateExperienceProps {
  state: CurrentBridgeState;
}

export function BridgeStateExperience({ state }: BridgeStateExperienceProps) {
  return (
    <BridgeStateExperienceProvider state={state}>
      <main className="pt-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] md:gap-6 md:px-4">
          <div>
            <BridgeStateOverview />
            <BridgeStatusVisualizer />
          </div>

          <div className="mt-0 md:mt-8">
            <BridgeTrafficOverview />
          </div>
        </div>
      </main>
    </BridgeStateExperienceProvider>
  );
}
