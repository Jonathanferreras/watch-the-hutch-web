import { BridgeTraffic } from "../../bridge-state.types";
import { TrafficCard } from "./traffic-card";

interface BridgeTrafficOverviewProps {
    traffic: {
        northBoundTraffic: BridgeTraffic;
        northBoundTrafficConfidence: number;
        southBoundTraffic: BridgeTraffic;
        southBoundTrafficConfidence: number;
    };
}

export function BridgeTrafficOverview({ traffic }: BridgeTrafficOverviewProps) {
    return (
        <div className="relative z-10 -mt-12 grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
            <TrafficCard
                direction="NorthBound"
                intensity={traffic.northBoundTraffic}
                confidence={traffic.northBoundTrafficConfidence}
            />

            <TrafficCard
                direction="SouthBound"
                intensity={traffic.southBoundTraffic}
                confidence={traffic.southBoundTrafficConfidence}
            />
        </div>
    );
}

