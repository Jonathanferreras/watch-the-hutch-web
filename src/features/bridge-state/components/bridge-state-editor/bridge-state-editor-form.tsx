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
		<section className="rounded-xl border bg-white p-4 shadow-sm">
			<div className="mb-4">
				<h2 className="text-base font-semibold">Bridge State Editor</h2>
				<p className="text-sm text-gray-500">
					Update the live bridge position and traffic conditions.
				</p>
			</div>

			<form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
				<label className="flex flex-col gap-1 text-sm font-medium" htmlFor="bridge-position">
					Bridge Position
					<select
						className="rounded-lg border bg-white px-3 py-2 font-normal"
						id="bridge-position"
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
				</label>

				<label className="flex flex-col gap-1 text-sm font-medium" htmlFor="bridge-northbound-traffic">
					North-Bound Traffic
					<select
						className="rounded-lg border bg-white px-3 py-2 font-normal"
						id="bridge-northbound-traffic"
						name="bridge-northbound-traffic"
						value={northBoundTraffic}
						onChange={(event) => setNorthBoundTraffic(event.target.value as BridgeTraffic)}
					>
						{renderTrafficOptions()}
					</select>
				</label>

				<label className="flex flex-col gap-1 text-sm font-medium" htmlFor="bridge-southbound-traffic">
					South-Bound Traffic
					<select
						className="rounded-lg border bg-white px-3 py-2 font-normal"
						id="bridge-southbound-traffic"
						name="bridge-southbound-traffic"
						value={southBoundTraffic}
						onChange={(event) => setSouthBoundTraffic(event.target.value as BridgeTraffic)}
					>
						{renderTrafficOptions()}
					</select>
				</label>

				{canEditEstimatedWaitTime &&
					<div className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-3">
						<label className="flex flex-col gap-1 text-sm font-medium" htmlFor="estimated-wait-minutes">
							Estimated Wait Time
							{hasSavedEstimatedWaitTime ? (
								<div className="flex gap-2">
									<input
										className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 font-normal disabled:bg-gray-100"
										id="estimated-wait-minutes"
										name="estimated-wait-minutes"
										disabled
										value={getEstimatedWaitCountdown()}
									/>
									<button
										className="rounded-lg border bg-white px-3 py-2 text-sm"
										onClick={() => setShouldSetEstimatedWaitTime(false)}
										type="button"
									>
										Clear
									</button>
								</div>
							) : (
								<input
									className="rounded-lg border bg-white px-3 py-2 font-normal disabled:bg-gray-100"
									id="estimated-wait-minutes"
									name="estimated-wait-minutes"
									disabled={!shouldSetEstimatedWaitTime}
									type="number"
									min={1}
									value={estimatedWaitMinutes}
									onChange={(event) => setEstimatedWaitMinutes(Number(event.target.value))}
								/>
							)}
						</label>

						{!hasSavedEstimatedWaitTime ? (
							<label
								className="flex items-center gap-2 text-sm font-medium"
								htmlFor="set-estimated-wait-time"
							>
								<input
									checked={shouldSetEstimatedWaitTime}
									className="size-4"
									id="set-estimated-wait-time"
									name="set-estimated-wait-time"
									onChange={(event) => setShouldSetEstimatedWaitTime(event.target.checked)}
									type="checkbox"
								/>
								Set estimated wait time
							</label>
						) : null}
					</div>
				}

				<button
					className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
					disabled={updating}
					type="submit"
				>
					{updating ? "Updating..." : "Update"}
				</button>

				{submitError ? <p role="alert" className="text-sm text-red-600">{submitError}</p> : null}
			</form>
		</section>
	);
}
