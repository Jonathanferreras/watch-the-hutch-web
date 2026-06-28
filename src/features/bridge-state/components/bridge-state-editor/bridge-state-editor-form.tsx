import { SyntheticEvent, useEffect, useState } from "react";

import {
	BRIDGE_POSITION,
	BRIDGE_POSITIONS,
	BRIDGE_TRAFFIC,
	BRIDGE_TRAFFIC_STATES,
	BridgeEstimatedWaitTime,
	BridgePosition,
	BridgeTraffic,
} from "../../bridge-state.types";
import { useUpdateBridgeState } from "../../hooks/use-update-bridge-state";
import { errorMessage } from "@/src/lib/errors";

interface BridgeStateEditorFormProps {
	initialState: {
		initialPosition: BridgePosition;
		initialNorthBoundTraffic: BridgeTraffic;
		initialSouthBoundTraffic: BridgeTraffic;
		initialEstimatedWaitTime: BridgeEstimatedWaitTime | null;
	};
}

export function BridgeStateEditorForm({ initialState }: BridgeStateEditorFormProps) {
	const {
		initialPosition,
		initialNorthBoundTraffic,
		initialSouthBoundTraffic,
		initialEstimatedWaitTime,
	} = initialState;

	const { updateBridgeState, updating } = useUpdateBridgeState();

	const [position, setPosition] = useState<BridgePosition>(initialPosition);
	const [northBoundTraffic, setNorthBoundTraffic] = useState<BridgeTraffic>(initialNorthBoundTraffic);
	const [southBoundTraffic, setSouthBoundTraffic] = useState<BridgeTraffic>(initialSouthBoundTraffic);
	const [shouldSetEstimatedWaitTime, setShouldSetEstimatedWaitTime] = useState(
		initialPosition === BRIDGE_POSITION.CLOSED || Boolean(initialEstimatedWaitTime)
	);
	const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState(
		initialEstimatedWaitTime?.estimatedTotalMinutes ?? 15
	);
	const [submitError, setSubmitError] = useState("");
	const [now, setNow] = useState(() => Date.now());
	const canEditEstimatedWaitTime = position !== BRIDGE_POSITION.CLOSED &&
		position !== BRIDGE_POSITION.UNKNOWN;
	const hasSavedEstimatedWaitTime = Boolean(initialEstimatedWaitTime && shouldSetEstimatedWaitTime);

	useEffect(() => {
		if (!hasSavedEstimatedWaitTime) {
			return;
		}

		const intervalId = window.setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [hasSavedEstimatedWaitTime]);

	const getNextEstimatedWaitTime = () => {
		const now = new Date();

		if (!canEditEstimatedWaitTime || !shouldSetEstimatedWaitTime) {
			return null;
		}

		if (
			initialEstimatedWaitTime &&
			estimatedWaitMinutes === initialEstimatedWaitTime.estimatedTotalMinutes
		) {
			return initialEstimatedWaitTime;
		}

		return {
			status: "estimated" as const,
			startedAt: now,
			initialTotalMinutes: estimatedWaitMinutes,
			estimatedTotalMinutes: estimatedWaitMinutes,
			lastRevisedAt: null,
			revisionReason: "manual_override" as const,
			confidence: 1,
			updatedAt: now,
		};
	};

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
				estimatedWaitTime: getNextEstimatedWaitTime(),
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
			return BRIDGE_TRAFFIC_STATES.map((traf) => (
				<option key={traf} value={traf}>
					{traf}
				</option>
			));
		}

		return [BRIDGE_TRAFFIC.STANDSTILL, BRIDGE_TRAFFIC.UNKNOWN].map((traf) => (
			<option key={traf} value={traf}>
				{traf}
			</option>
		));
	};

	const getEstimatedWaitCountdown = () => {
		if (!initialEstimatedWaitTime) {
			return "";
		}

		const startedAtDate = new Date(initialEstimatedWaitTime.startedAt);
		const totalSeconds = initialEstimatedWaitTime.estimatedTotalMinutes * 60;
		const elapsedSeconds = Math.floor((now - startedAtDate.getTime()) / 1000);
		const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
		const minutes = Math.floor(remainingSeconds / 60);
		const seconds = remainingSeconds % 60;

		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	return (
		<div className="rounded-xl p-2 overflow-hidden border">
			<h2>Bridge State Editor</h2>

			<form className="flex max-w-sm flex-col gap-3" onSubmit={handleSubmit}>
				<label htmlFor="bridge-position">Bridge Position</label>
				<select
					name="bridge-position"
					value={position}
					onChange={(event) => {
						const nextPosition = event.target.value as BridgePosition;
						setPosition(nextPosition);

						if (
							initialPosition === BRIDGE_POSITION.CLOSED &&
							nextPosition === BRIDGE_POSITION.OPENING
						) {
							setShouldSetEstimatedWaitTime(true);
						}
					}}
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
					onChange={(event) => setNorthBoundTraffic(event.target.value as BridgeTraffic)}
				>
					{renderTrafficOptions()}
				</select>

				<label htmlFor="bridge-southbound-traffic">South-Bound Traffic</label>
				<select
					name="bridge-southbound-traffic"
					value={southBoundTraffic}
					onChange={(event) => setSouthBoundTraffic(event.target.value as BridgeTraffic)}
				>
					{renderTrafficOptions()}
				</select>

				{canEditEstimatedWaitTime &&
					<>
						<label htmlFor="estimated-wait-minutes">Estimated Wait Time</label>
						{hasSavedEstimatedWaitTime ? (
							<div className="flex gap-2">
								<input
									id="estimated-wait-minutes"
									name="estimated-wait-minutes"
									disabled
									value={getEstimatedWaitCountdown()}
								/>
								<button
									className="rounded border px-3 py-2"
									onClick={() => setShouldSetEstimatedWaitTime(false)}
									type="button"
								>
									Clear
								</button>
							</div>
						) : (
							<>
								<label htmlFor="set-estimated-wait-time">
									<input
										checked={shouldSetEstimatedWaitTime}
										id="set-estimated-wait-time"
										name="set-estimated-wait-time"
										onChange={(event) => setShouldSetEstimatedWaitTime(event.target.checked)}
										type="checkbox"
									/>{" "}
									Set estimated wait time
								</label>

								<input
									id="estimated-wait-minutes"
									name="estimated-wait-minutes"
									disabled={!shouldSetEstimatedWaitTime}
									type="number"
									min={1}
									value={estimatedWaitMinutes}
									onChange={(event) => setEstimatedWaitMinutes(Number(event.target.value))}
								/>
							</>
						)}
					</>
				}

				<button
					className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
					disabled={updating}
					type="submit"
				>
					{updating ? "Updating..." : "Update"}
				</button>

				{submitError ? <p>{submitError}</p> : null}
			</form>
		</div>
	);
}
