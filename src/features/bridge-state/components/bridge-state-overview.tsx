import {
    BRIDGE_POSITION,
    BRIDGE_TRAFFIC,
    BridgeTraffic,
    CurrentBridgeState,
} from "../bridge-state.types";
import { TRAFFIC_CONFIG } from "../bridge-state.constants";

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
                emphasis: TRAFFIC_CONFIG.unknown.label,
                subtitle: "Waiting for a reliable bridge update.",
                color: TRAFFIC_CONFIG.unknown.color,
            };
        }

        if (position !== BRIDGE_POSITION.CLOSED) {
            return {
                emphasis: "Paused",
                subtitle: "Bridge activity in progress.",
                color: TRAFFIC_CONFIG.standstill.color,
            };
        }

        const worstTraffic = getWorstTraffic();
        const worstTrafficConfig = TRAFFIC_CONFIG[worstTraffic.traffic];

        if (northBoundTraffic !== southBoundTraffic) {
            return {
                emphasis: "Varied",
                subtitle: getMixedTrafficSubtitle(worstTraffic),
                color: worstTrafficConfig.color,
            };
        }

        return {
            emphasis: worstTrafficConfig.label,
            subtitle: getTrafficSubtitle(worstTraffic.traffic),
            color: worstTrafficConfig.color,
        };
    }

    function getWorstTraffic(): WorstTraffic {
        const northWeight = TRAFFIC_CONFIG[northBoundTraffic].weight;
        const southWeight = TRAFFIC_CONFIG[southBoundTraffic].weight;

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

        return `${TRAFFIC_CONFIG[traffic].label} traffic in both directions.`;
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