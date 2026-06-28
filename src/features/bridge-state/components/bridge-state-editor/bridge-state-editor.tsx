import { useBridgeState } from "../../hooks/use-bridge-state";
import { BridgeStateEditorForm } from "./bridge-state-editor-form";

export function BridgeStateEditor() {
    const { data, loading } = useBridgeState();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!data) {
        return <p>Unable to load bridge state.</p>;
    }

    return <BridgeStateEditorForm initialState={{
        initialPosition: data.position,
        initialNorthBoundTraffic: data.northBoundTraffic,
        initialSouthBoundTraffic: data.southBoundTraffic,
        initialEstimatedWaitTime: data.estimatedWaitTime,
    }}
    />;
}
