import { SyntheticEvent, ChangeEvent, useState, useEffect } from "react";
import { BRIDGE_POSITIONS, BRIDGE_TRAFFIC_STATES, BridgePosition, BridgeTraffic } from "../bridge-state.types";
import { useBridgeState } from "../hooks/use-bridge-state";
import { useUpdateBridgeState } from "../hooks/use-update-bridge-state";
import { errorMessage } from "@/src/lib/errors";

export function BridgeStateEditor() {
    const { data, loading } = useBridgeState();
    const { updateBridgeState, updating } = useUpdateBridgeState();
    const [position, setPosition] = useState<BridgePosition | undefined>();
    const [traffic, setTraffic] = useState<BridgeTraffic | undefined>();
    const [submitError, setSubmitError] = useState<string>("");

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitError("");

        try {
            if (position && traffic) {
                await updateBridgeState({ position, traffic });
            }
        } catch (error) {
            setSubmitError(errorMessage(error, "Unable to update bridge state."));
        }
    };

    const handlePositionChange = (
        event: ChangeEvent<HTMLSelectElement>
    ) => {
        setPosition(event.target.value as BridgePosition);
    };

    const handleTrafficChange = (
        event: ChangeEvent<HTMLSelectElement>
    ) => {
        setTraffic(event.target.value as BridgeTraffic);
    };

    useEffect(() => {
        if (data) {
            setPosition(data.position);
            setTraffic(data.traffic);
        }
    }, [data]);

    return (
        <div>
            <h2>Bridge State Editor</h2>
            <form className="flex max-w-sm flex-col gap-3" onSubmit={handleSubmit}>
                <select name="bridge-position" id="" value={position} onChange={handlePositionChange}>{BRIDGE_POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select>
                <select name="bridge-traffic" id="" value={traffic} onChange={handleTrafficChange}>{BRIDGE_TRAFFIC_STATES.map(traf => <option key={traf} value={traf}>{traf}</option>)}</select>

                <button
                    className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading || updating}
                    type="submit"
                >
                    {updating ? "Updating..." : "Update"}
                </button>

                {submitError ? (
                    <p className="text-sm text-red-600">{submitError}</p>
                ) : null}
            </form>
        </div>
    );
}
