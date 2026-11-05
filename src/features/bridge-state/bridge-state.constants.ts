import { BridgeTraffic } from "./bridge-state.types";

export const TRAFFIC_CONFIG: Record<
    BridgeTraffic,
    {
        color: string;
        label: string;
        weight: number;
        speed: number;
    }
> = {
    light: {
        color: "#21D19F",
        label: "Great",
        weight: 1,
        speed: 15,
    },
    moderate: {
        color: "#FACC15",
        label: "Moderate",
        weight: 2,
        speed: 5,
    },
    heavy: {
        color: "#F97316",
        label: "Heavy",
        weight: 3,
        speed: 2,
    },
    standstill: {
        color: "#EF4444",
        label: "Standstill",
        weight: 4,
        speed: 0,
    },
    unknown: {
        color: "#9CA3AF",
        label: "Unclear",
        weight: 0,
        speed: 0,
    },
};
/**
 * The edge device rewrites bridgeState/current at least every 10 minutes. A device state
 * older than this means the device or its connection is down, so the site stops showing it
 * as current.
 */
export const DEVICE_STALE_AFTER_MINUTES = 25;
