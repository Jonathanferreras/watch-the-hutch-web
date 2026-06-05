import {
    BRIDGE_POSITION,
    BRIDGE_TRAFFIC,
    BridgeTraffic,
    CurrentBridgeState,
} from "../bridge-state.types";

interface BridgeStateOverviewProps {
    state: CurrentBridgeState;
}

type TrafficDirection = "northbound" | "southbound" | "both";

type WorstTraffic = {
    traffic: BridgeTraffic;
    direction: TrafficDirection;
};

export function BridgeStateOverview({ state }: BridgeStateOverviewProps) {
    const { position, northBoundTraffic, southBoundTraffic } = state;

    function getTrafficSummary() {
        if (position === BRIDGE_POSITION.UNKNOWN) {
            return {
                emphasis: TrafficVisuals.unknown.label,
                subtitle: "Waiting for a reliable bridge update.",
                color: TrafficVisuals.unknown.color,
            };
        }

        if (position !== BRIDGE_POSITION.CLOSED) {
            return {
                emphasis: "Stopped",
                subtitle: "Bridge activity in progress.",
                color: TrafficVisuals.standstill.color,
            };
        }

        const worstTraffic = getWorstTraffic();

        if (northBoundTraffic !== southBoundTraffic) {
            return {
                emphasis: "Mixed",
                subtitle: getMixedTrafficSubtitle(worstTraffic),
                color: TrafficVisuals[worstTraffic.traffic].color,
            };
        }

        return {
            emphasis: TrafficVisuals[worstTraffic.traffic].label,
            subtitle: getTrafficSubtitle(worstTraffic.traffic),
            color: TrafficVisuals[worstTraffic.traffic].color,
        };
    }

    function getWorstTraffic(): WorstTraffic {
        const northWeight = TrafficVisuals[northBoundTraffic].weight;
        const southWeight = TrafficVisuals[southBoundTraffic].weight;

        if (northWeight === southWeight) {
            return {
                traffic: northBoundTraffic,
                direction: "both",
            };
        }

        if (northWeight > southWeight) {
            return {
                traffic: northBoundTraffic,
                direction: "northbound",
            };
        }

        return {
            traffic: southBoundTraffic,
            direction: "southbound",
        };
    }

    function getMixedTrafficSubtitle(worstTraffic: WorstTraffic): string {
        const direction = getDirectionLabel(worstTraffic.direction);

        if (worstTraffic.traffic === BRIDGE_TRAFFIC.UNKNOWN) {
            return `Waiting for a reliable ${worstTraffic.direction} update.`;
        }

        if (worstTraffic.traffic === BRIDGE_TRAFFIC.STANDSTILL) {
            return `${direction} traffic is stopped.`;
        }

        if (worstTraffic.traffic === BRIDGE_TRAFFIC.HEAVY) {
            return `Heavier delays ${worstTraffic.direction}.`;
        }

        if (worstTraffic.traffic === BRIDGE_TRAFFIC.MODERATE) {
            return `Slight slowdown ${worstTraffic.direction}.`;
        }

        return `${direction} traffic is moving better.`;
    }

    function getTrafficSubtitle(traffic: BridgeTraffic): string {
        if (traffic === BRIDGE_TRAFFIC.UNKNOWN) {
            return "Waiting for a reliable traffic update.";
        }

        if (traffic === BRIDGE_TRAFFIC.LIGHT) {
            return "Both directions are moving smoothly.";
        }

        return `${TrafficVisuals[traffic].label} traffic in both directions.`;
    }

    function getDirectionLabel(direction: TrafficDirection): string {
        if (direction === "northbound") {
            return "Northbound";
        }

        if (direction === "southbound") {
            return "Southbound";
        }

        return "Both directions";
    }

    const summary = getTrafficSummary();

    return (
        <section className="flex flex-col items-center justify-center px-4 text-center">
            <h1 className="mt-10 text-4xl font-bold leading-tight">
                <span style={{ color: summary.color }}>
                    {summary.emphasis} Traffic
                </span>
            </h1>

            <p className="max-w-xs text-md text-slate-500">
                {summary.subtitle}
            </p>
        </section>
    );
}

const TrafficVisuals: Record<
    BridgeTraffic,
    {
        color: string;
        label: string;
        weight: number;
    }
> = {
    light: {
        color: "#21D19F",
        label: "Great",
        weight: 1,
    },
    moderate: {
        color: "#FACC15",
        label: "Moderate",
        weight: 2,
    },
    heavy: {
        color: "#F97316",
        label: "Heavy",
        weight: 3,
    },
    standstill: {
        color: "#EF4444",
        label: "Backed up",
        weight: 4,
    },
    unknown: {
        color: "#9CA3AF",
        label: "Unclear",
        weight: 0,
    },
};