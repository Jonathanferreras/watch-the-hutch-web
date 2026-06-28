import { useBridgeStateExperience } from "../bridge-state-experience-context";
import { TrafficCard } from "./traffic-card";

export function BridgeTrafficOverview() {
    const state = useBridgeStateExperience();
    const { northBoundTraffic, northBoundTrafficConfidence, southBoundTraffic, southBoundTrafficConfidence } = state;
    return (
        <section className="relative z-10 -mt-8 mb-12 grid grid-cols-1 gap-3 px-4 pb-4 md:mt-0 md:px-0">
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
