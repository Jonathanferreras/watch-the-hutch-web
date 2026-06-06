import { SyntheticEvent, useState } from "react";

import { BRIDGE_POSITION, BRIDGE_POSITIONS, BRIDGE_TRAFFIC, BRIDGE_TRAFFIC_STATES, BridgePosition, BridgeTraffic } from "../../bridge-state.types";
import { useUpdateBridgeState } from "../../hooks/use-update-bridge-state";
import { errorMessage } from "@/src/lib/errors";

interface BridgeStateEditorFormProps {
	initialState: {
		initialPosition: BridgePosition,
		initialNorthBoundTraffic: BridgeTraffic,
		initialSouthBoundTraffic: BridgeTraffic
	}
}

export function BridgeStateEditorForm({ initialState }: BridgeStateEditorFormProps) {
	const { initialPosition, initialNorthBoundTraffic, initialSouthBoundTraffic } = initialState;
	const { updateBridgeState, updating } = useUpdateBridgeState();
	const [position, setPosition] = useState<BridgePosition>(initialPosition);
	const [northBoundTraffic, setNorthBoundTraffic] = useState<BridgeTraffic>(initialNorthBoundTraffic);
	const [southBoundTraffic, setSouthBoundTraffic] = useState<BridgeTraffic>(initialSouthBoundTraffic);
	const [submitError, setSubmitError] = useState("");

	const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitError("");

		const nextNorth = getEffectiveTraffic(northBoundTraffic);
		const nextSouth = getEffectiveTraffic(southBoundTraffic);

		setNorthBoundTraffic(nextNorth);
		setSouthBoundTraffic(nextSouth);

		try {
			await updateBridgeState({
				position,
				northBoundTraffic: nextNorth,
				southBoundTraffic: nextSouth,
			});
		} catch (error) {
			setSubmitError(errorMessage(error, "Unable to update bridge state."));
		}
	};

	const getEffectiveTraffic = (traffic: BridgeTraffic) => {
		if (
			position !== BRIDGE_POSITION.CLOSED &&
			traffic !== BRIDGE_TRAFFIC.STANDSTILL &&
			traffic !== BRIDGE_TRAFFIC.UNKNOWN
		) {
			return BRIDGE_TRAFFIC.STANDSTILL;
		}
		return traffic;
	};

	const renderTrafficOptions = () => {
		if (position === BRIDGE_POSITION.CLOSED || position === BRIDGE_POSITION.UNKNOWN) {
			return (BRIDGE_TRAFFIC_STATES.map((traf) => (
				<option key={traf} value={traf}>
					{traf}
				</option>
			)))
		} else {
			return ([BRIDGE_TRAFFIC.STANDSTILL, BRIDGE_TRAFFIC.UNKNOWN].map((traf) => (
				<option key={traf} value={traf}>
					{traf}
				</option>
			)))
		}
	}

	return (
		<div className="rounded-xl p-2 overflow-hidden border">
			<h2>Bridge State Editor</h2>

			<form className="flex max-w-sm flex-col gap-3" onSubmit={handleSubmit}>
				<label htmlFor="bridge-position">Bridge Position</label>
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
				<label htmlFor="bridge-northbound-traffic">North-Bound Traffic</label>
				<select
					name="bridge-northbound-traffic"
					value={northBoundTraffic}
					onChange={(event) =>
						setNorthBoundTraffic(event.target.value as BridgeTraffic)
					}
				>
					{renderTrafficOptions()}
				</select>
				<label htmlFor="bridge-northbound-traffic">South-Bound Traffic</label>
				<select
					name="bridge-southbound-traffic"
					value={southBoundTraffic}
					onChange={(event) =>
						setSouthBoundTraffic(event.target.value as BridgeTraffic)
					}
				>
					{renderTrafficOptions()}
				</select>

				<button className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded" disabled={updating} type="submit">
					{updating ? "Updating..." : "Update"}
				</button>

				{submitError ? <p>{submitError}</p> : null}
			</form>
		</div>
	);
}