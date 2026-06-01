import { SyntheticEvent, useState } from "react";

import { BRIDGE_POSITIONS, BRIDGE_TRAFFIC_STATES, BridgePosition, BridgeTraffic } from "../../bridge-state.types";
import { useUpdateBridgeState } from "../../hooks/use-update-bridge-state";
import { errorMessage } from "@/src/lib/errors";

interface BridgeStateEditorFormProps {
	initialPosition: BridgePosition,
	initialTraffic: BridgeTraffic
}

export function BridgeStateEditorForm({ initialPosition, initialTraffic }: BridgeStateEditorFormProps) {
	const { updateBridgeState, updating } = useUpdateBridgeState();
	const [position, setPosition] = useState<BridgePosition>(initialPosition);
	const [traffic, setTraffic] = useState<BridgeTraffic>(initialTraffic);
	const [submitError, setSubmitError] = useState("");

	const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitError("");

		try {
			await updateBridgeState({ position, traffic });
		} catch (error) {
			setSubmitError(errorMessage(error, "Unable to update bridge state."));
		}
	};

	return (
		<div className="rounded-xl p-2 overflow-hidden border">
			<h2>Bridge State Editor</h2>

			<form className="flex max-w-sm flex-col gap-3" onSubmit={handleSubmit}>
				<select
					name="bridge-position"
					value={position}
					onChange={(event) =>
						setPosition(event.target.value as BridgePosition)
					}
				>
					{BRIDGE_POSITIONS.map((pos) => (
						<option key={pos} value={pos}>
							{pos}
						</option>
					))}
				</select>

				<select
					name="bridge-traffic"
					value={traffic}
					onChange={(event) =>
						setTraffic(event.target.value as BridgeTraffic)
					}
				>
					{BRIDGE_TRAFFIC_STATES.map((traf) => (
						<option key={traf} value={traf}>
							{traf}
						</option>
					))}
				</select>

				<button className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded" disabled={updating} type="submit">
					{updating ? "Updating..." : "Update"}
				</button>

				{submitError ? <p>{submitError}</p> : null}
			</form>
		</div>
	);
}