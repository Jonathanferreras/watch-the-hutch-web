"use client";

import { useBridgeState } from "@/src/features/bridge-state/hooks/use-bridge-state";

export function BridgeStatusCard() {
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
        <div className="rounded-xl p-2 overflow-hidden border">
            <h2>Bridge Status</h2>
            <p>Position: {data.position}</p>
            <p>Traffic: {data.traffic}</p>
            <p>Last Updated:   {data.updatedAt ? data.updatedAt.toLocaleString() : "Unknown"}
            </p>
        </div>
    );
}
