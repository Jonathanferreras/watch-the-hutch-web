import { CurrentBridgeState } from "../../bridge-state.types";
import { TrafficCard } from "./traffic-card";

interface BridgeTrafficOverviewProps {
    state: CurrentBridgeState
}

export function BridgeTrafficOverview({ state }: BridgeTrafficOverviewProps) {
    const { northBoundTraffic, northBoundTrafficConfidence, southBoundTraffic, southBoundTrafficConfidence } = state;
    return (
        <section className="relative z-10 -mt-8 mb-12 grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
            <TrafficCard
                direction="NorthBound"
                intensity={northBoundTraffic}
                confidence={northBoundTrafficConfidence}
            />

            <TrafficCard
                direction="SouthBound"
                intensity={southBoundTraffic}
                confidence={southBoundTrafficConfidence}
            />
        </section>
    );
}

