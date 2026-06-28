"use client";

import { useEffect, useMemo, useState } from "react";

import { BridgeStateExperience } from "../../bridge-state/components/bridge-state-experience";
import {
  BRIDGE_POSITION,
  CURRENT_BRIDGE_STATE_ID,
  CurrentBridgeState,
} from "../../bridge-state/bridge-state.types";
import { useAuthContext } from "../../auth/components/auth-provider";
import { Simulation, SimulationEvent, SimulationFrame } from "../simulation.types";

interface SimulationPlaybackProps {
  simulation: Simulation;
}

const getTotalDurationSeconds = (events: SimulationEvent[]) =>
  events.reduce((total, event) => total + event.durationSeconds, 0);

const getEventTimeline = (events: SimulationEvent[]) => {
  let cursor = 0;

  return events.map((event, index) => {
    const startSeconds = cursor;
    cursor += event.durationSeconds;

    return {
      event,
      index,
      startSeconds,
      endSeconds: cursor,
    };
  });
};

const findActiveEvent = (simulation: Simulation, elapsedSeconds: number) => {
  let cursor = 0;

  for (const [index, event] of simulation.events.entries()) {
    const eventEnd = cursor + event.durationSeconds;

    if (elapsedSeconds < eventEnd) {
      return {
        event,
        eventIndex: index,
        eventElapsedSeconds: elapsedSeconds - cursor,
        eventStartSeconds: cursor,
      };
    }

    cursor = eventEnd;
  }

  const finalEvent = simulation.events[simulation.events.length - 1];

  return {
    event: finalEvent,
    eventIndex: Math.max(0, simulation.events.length - 1),
    eventElapsedSeconds: finalEvent?.durationSeconds ?? 0,
    eventStartSeconds: Math.max(
      0,
      cursor - (finalEvent?.durationSeconds ?? 0)
    ),
  };
};

const buildFrame = (
  simulation: Simulation,
  elapsedSeconds: number
): SimulationFrame | null => {
  const active = findActiveEvent(simulation, elapsedSeconds);

  if (!active.event) {
    return null;
  }

  const now = new Date();
  const waitTotalMinutes = active.event.estimatedWaitMinutes;
  const waitStartRemainingMinutes =
    active.event.estimatedWaitStartRemainingMinutes ?? waitTotalMinutes;
  const waitEndRemainingMinutes =
    active.event.estimatedWaitEndRemainingMinutes ?? waitStartRemainingMinutes;
  const eventProgress =
    active.event.durationSeconds > 0
      ? active.eventElapsedSeconds / active.event.durationSeconds
      : 1;
  const interpolatedRemainingMinutes =
    waitStartRemainingMinutes !== null && waitEndRemainingMinutes !== null
      ? waitStartRemainingMinutes +
      (waitEndRemainingMinutes - waitStartRemainingMinutes) * eventProgress
      : null;
  const interpolatedElapsedWaitMinutes =
    waitTotalMinutes !== null && interpolatedRemainingMinutes !== null
      ? Math.max(0, waitTotalMinutes - interpolatedRemainingMinutes)
      : 0;
  const visualProgressPercent =
    waitTotalMinutes && interpolatedRemainingMinutes !== null
      ? Math.min(
        100,
        Math.max(
          0,
          ((waitTotalMinutes - interpolatedRemainingMinutes) /
            waitTotalMinutes) *
          100
        )
      )
      : 0;
  const waitStartedAt = new Date(
    now.getTime() - interpolatedElapsedWaitMinutes * 60000
  );

  const baseState: CurrentBridgeState = {
    id: CURRENT_BRIDGE_STATE_ID,
    sourceId: simulation.createdBy,
    sourceType: "admin",
    position: active.event.position,
    positionConfidence: 1,
    northBoundTraffic: active.event.northBoundTraffic,
    northBoundTrafficConfidence: 1,
    southBoundTraffic: active.event.southBoundTraffic,
    southBoundTrafficConfidence: 1,
    estimatedWaitTime:
      waitTotalMinutes &&
        active.event.position !== BRIDGE_POSITION.CLOSED &&
        active.event.position !== BRIDGE_POSITION.UNKNOWN
        ? {
          status: "estimated",
          startedAt: waitStartedAt,
          initialTotalMinutes: waitTotalMinutes,
          estimatedTotalMinutes: waitTotalMinutes,
          displayedRemainingMinutes:
            interpolatedRemainingMinutes !== null
              ? Math.ceil(interpolatedRemainingMinutes)
              : waitTotalMinutes,
          visualProgressPercent,
          lastRevisedAt: null,
          revisionReason: "manual_override",
          confidence: 1,
          updatedAt: now,
        }
        : null,
    acceptsDeviceUpdates: false,
    updatedAt: now,
  };

  return {
    ...baseState,
    simulationEventId: active.event.id,
    simulationEventLabel: active.event.label,
    simulationElapsedSeconds: elapsedSeconds,
    simulationEventElapsedSeconds: active.eventElapsedSeconds,
  };
};

export function SimulationPlayback({ simulation }: SimulationPlaybackProps) {
  const { user } = useAuthContext();
  const [playing, setPlaying] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timeline = useMemo(
    () => getEventTimeline(simulation.events),
    [simulation.events]
  );
  const totalDurationSeconds = useMemo(
    () => getTotalDurationSeconds(simulation.events),
    [simulation.events]
  );
  const frame = useMemo(
    () => buildFrame(simulation, elapsedSeconds),
    [simulation, elapsedSeconds]
  );
  const activeEvent = useMemo(
    () => findActiveEvent(simulation, elapsedSeconds),
    [elapsedSeconds, simulation]
  );

  useEffect(() => {
    if (!playing || totalDurationSeconds === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((currentElapsedSeconds) => {
        const nextElapsedSeconds = currentElapsedSeconds + 1;

        if (nextElapsedSeconds >= totalDurationSeconds) {
          window.clearInterval(intervalId);
          setPlaying(false);
          return totalDurationSeconds;
        }

        return nextElapsedSeconds;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [playing, totalDurationSeconds]);

  if (simulation.createdBy !== user?.uid) {
    return (
      <div className="pt-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="rounded-lg border bg-white p-4 text-sm">
            You do not have access to this simulation.
          </p>
        </div>
      </div>
    );
  }

  if (!frame) {
    return (
      <div className="pt-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="rounded-lg border bg-white p-4 text-sm">
            This simulation has no events.
          </p>
        </div>
      </div>
    );
  }

  const progress =
    totalDurationSeconds > 0
      ? Math.min(100, (elapsedSeconds / totalDurationSeconds) * 100)
      : 0;
  const activeTimelineEvent = timeline[activeEvent.eventIndex];
  const canGoBack = activeEvent.eventIndex > 0;
  const canGoForward = activeEvent.eventIndex < timeline.length - 1;

  const goToEvent = (eventIndex: number) => {
    const nextEvent = timeline[eventIndex];

    if (!nextEvent) {
      return;
    }

    setElapsedSeconds(nextEvent.startSeconds);
  };

  return (
    <>
      <div className="pb-24 md:pb-32">
        <BridgeStateExperience state={frame} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-green-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-3 py-2 md:px-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium uppercase leading-4 text-gray-500">
                {simulation.title}
              </p>
              <h1 className="truncate text-sm font-semibold leading-5 text-gray-950">
                {frame.simulationEventLabel}
              </h1>
              <p className="truncate text-xs leading-4 text-gray-500">
                Event {activeEvent.eventIndex + 1}/{timeline.length} ·{" "}
                {activeEvent.eventElapsedSeconds}s/
                {activeTimelineEvent?.event.durationSeconds ?? 0}s ·{" "}
                {elapsedSeconds}s/{totalDurationSeconds}s
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                aria-label="Previous event"
                className="h-9 w-9 rounded-full border text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!canGoBack}
                onClick={() => goToEvent(activeEvent.eventIndex - 1)}
                type="button"
              >
                {"<<"}
              </button>
              <button
                aria-label={playing ? "Pause simulation" : "Play simulation"}
                className="h-9 min-w-14 rounded-full bg-green-600 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={totalDurationSeconds === 0}
                onClick={() => setPlaying((current) => !current)}
                type="button"
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                aria-label="Next event"
                className="h-9 w-9 rounded-full border text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!canGoForward}
                onClick={() => goToEvent(activeEvent.eventIndex + 1)}
                type="button"
              >
                {">>"}
              </button>
              <button
                aria-label="Restart simulation"
                className="h-9 w-9 rounded-full border text-xs font-semibold"
                onClick={() => {
                  setElapsedSeconds(0);
                  setPlaying(true);
                }}
                type="button"
              >
                R
              </button>
            </div>
          </div>

          <div className="mt-2 hidden gap-1.5 overflow-x-auto pb-0.5 md:flex">
            {timeline.map((timelineEvent) => (
              <button
                className={`max-w-36 shrink-0 rounded-full border px-2.5 py-1 text-left text-[11px] leading-4 transition-colors ${timelineEvent.index === activeEvent.eventIndex
                  ? "border-green-600 bg-green-50 text-green-900"
                  : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                key={timelineEvent.event.id}
                onClick={() => goToEvent(timelineEvent.index)}
                type="button"
              >
                <span className="block truncate font-medium">
                  {timelineEvent.event.label}
                </span>
                <span className="block text-gray-500">
                  {timelineEvent.startSeconds}s
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
