"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";
import { useDeviceUpdates } from "@/src/features/bridge-state/hooks/use-device-updates";
import { useNow } from "@/src/features/bridge-state/hooks/use-now";
import { formatStaleNotice, getDisplayedBridgeState } from "@/src/features/bridge-state/bridge-state.freshness";

export function BridgeStatusCard() {
    const { data, loading, error } = useBridgeState();
    const { setAcceptsDeviceUpdates, saving, error: deviceError } = useDeviceUpdates();
    const now = useNow();

    if (loading) {
        return <p>Loading bridge state...</p>;
    }

    if (error) {
        return <p>Failed to load bridge state.</p>;
    }

    if (!data) {
        return <p>No bridge state available.</p>;
    }

    const { staleMinutes } = getDisplayedBridgeState(data, now);

    return (
        <div className="rounded-xl p-2 overflow-hidden border">
            <h2>Bridge Status</h2>
            <p>Position: {data.position}</p>
            <p>North-Bound Traffic: {data.northBoundTraffic}</p>
            <p>South-Bound Traffic: {data.southBoundTraffic}</p>
            <p>Source: {data.sourceType === "device" ? `device (${data.sourceId})` : "admin"}</p>
            <p>Last Updated:   {data.updatedAt ? data.updatedAt.toLocaleString() : "Unknown"}
            </p>
            {staleMinutes !== null ? (
                <p className="text-sm text-amber-600" role="status">
                    {formatStaleNotice(staleMinutes)}
                </p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
                <p id="device-updates-status">
                    Device updates: {data.acceptsDeviceUpdates ? "on" : "off (admin override)"}
                </p>
                <button
                    type="button"
                    className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-describedby="device-updates-status"
                    disabled={saving}
                    onClick={() => setAcceptsDeviceUpdates(!data.acceptsDeviceUpdates)}
                >
                    {saving
                        ? "Saving..."
                        : data.acceptsDeviceUpdates
                          ? "Pause device updates"
                          : "Hand back to device"}
                </button>
            </div>
            {deviceError ? <p className="text-sm text-red-600" role="alert">{deviceError.message}</p> : null}
        </div>
    );
}
