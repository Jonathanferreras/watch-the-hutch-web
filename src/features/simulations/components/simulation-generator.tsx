"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";

import {
  BRIDGE_POSITION,
  BRIDGE_POSITIONS,
  BRIDGE_TRAFFIC,
  BRIDGE_TRAFFIC_STATES,
  BridgePosition,
  BridgeTraffic,
} from "../../bridge-state/bridge-state.types";
import { errorMessage } from "@/src/lib/errors";
import { useCreateSimulation } from "../hooks/use-create-simulation";
import { useDeleteSimulation } from "../hooks/use-delete-simulation";
import { useSimulations } from "../hooks/use-simulations";
import { useUpdateSimulation } from "../hooks/use-update-simulation";
import { Simulation, SimulationEvent } from "../simulation.types";

const createDefaultEvent = (index: number): SimulationEvent => ({
  id: crypto.randomUUID(),
  label: `Event ${index + 1}`,
  durationSeconds: 30,
  position: BRIDGE_POSITION.CLOSED,
  northBoundTraffic: BRIDGE_TRAFFIC.LIGHT,
  southBoundTraffic: BRIDGE_TRAFFIC.LIGHT,
  estimatedWaitMinutes: null,
  estimatedWaitStartRemainingMinutes: null,
  estimatedWaitEndRemainingMinutes: null,
});

const canSetEstimatedWait = (position: BridgePosition) =>
  position !== BRIDGE_POSITION.CLOSED &&
  position !== BRIDGE_POSITION.UNKNOWN;

export function SimulationGenerator() {
  const router = useRouter();
  const { createSimulation, creating } = useCreateSimulation();
  const { updateSimulation, updating } = useUpdateSimulation();
  const { deleteSimulation, deleting } = useDeleteSimulation();
  const {
    data: simulations,
    loading: loadingSimulations,
    error: simulationsError,
    refresh,
  } = useSimulations();

  const [title, setTitle] = useState("Bridge opening drill");
  const [editingSimulationId, setEditingSimulationId] = useState<string | null>(
    null
  );
  const [events, setEvents] = useState<SimulationEvent[]>([
    createDefaultEvent(0),
    {
      ...createDefaultEvent(1),
      label: "Bridge opening",
      durationSeconds: 45,
      position: BRIDGE_POSITION.OPENING,
      northBoundTraffic: BRIDGE_TRAFFIC.STANDSTILL,
      southBoundTraffic: BRIDGE_TRAFFIC.STANDSTILL,
      estimatedWaitMinutes: 8,
      estimatedWaitStartRemainingMinutes: 8,
      estimatedWaitEndRemainingMinutes: 6,
    },
  ]);
  const [submitError, setSubmitError] = useState("");

  const updateEvent = (
    eventId: string,
    update: Partial<SimulationEvent>
  ) => {
    setEvents((currentEvents) =>
      currentEvents.map((event) => {
        if (event.id !== eventId) {
          return event;
        }

        const nextEvent = {
          ...event,
          ...update,
        };

        if (!canSetEstimatedWait(nextEvent.position)) {
          nextEvent.estimatedWaitMinutes = null;
          nextEvent.estimatedWaitStartRemainingMinutes = null;
          nextEvent.estimatedWaitEndRemainingMinutes = null;
        }

        return nextEvent;
      })
    );
  };

  const removeEvent = (eventId: string) => {
    setEvents((currentEvents) =>
      currentEvents.length === 1
        ? currentEvents
        : currentEvents.filter((event) => event.id !== eventId)
    );
  };

  const addEvent = () => {
    setEvents((currentEvents) => [
      ...currentEvents,
      createDefaultEvent(currentEvents.length),
    ]);
  };

  const resetForm = () => {
    setEditingSimulationId(null);
    setTitle("Bridge opening drill");
    setEvents([
      createDefaultEvent(0),
      {
        ...createDefaultEvent(1),
        label: "Bridge opening",
        durationSeconds: 45,
        position: BRIDGE_POSITION.OPENING,
        northBoundTraffic: BRIDGE_TRAFFIC.STANDSTILL,
        southBoundTraffic: BRIDGE_TRAFFIC.STANDSTILL,
        estimatedWaitMinutes: 8,
        estimatedWaitStartRemainingMinutes: 8,
        estimatedWaitEndRemainingMinutes: 6,
      },
    ]);
    setSubmitError("");
  };

  const editSimulation = (simulation: Simulation) => {
    setEditingSimulationId(simulation.id);
    setTitle(simulation.title);
    setEvents(
      simulation.events.map((event, index) => ({
        ...createDefaultEvent(index),
        ...event,
        estimatedWaitStartRemainingMinutes:
          event.estimatedWaitStartRemainingMinutes ??
          event.estimatedWaitMinutes,
        estimatedWaitEndRemainingMinutes:
          event.estimatedWaitEndRemainingMinutes ??
          event.estimatedWaitMinutes,
      }))
    );
    setSubmitError("");
  };

  const handleDelete = async (simulationId: string) => {
    if (!window.confirm("Delete this simulation?")) {
      return;
    }

    try {
      await deleteSimulation(simulationId);
      if (editingSimulationId === simulationId) {
        resetForm();
      }
      await refresh();
    } catch (error) {
      setSubmitError(errorMessage(error, "Unable to delete simulation."));
    }
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    const normalizedEvents = events.map((event, index) => ({
      ...event,
      label: event.label.trim() || `Event ${index + 1}`,
      durationSeconds: Math.max(1, Math.round(event.durationSeconds)),
      estimatedWaitMinutes:
        canSetEstimatedWait(event.position) && event.estimatedWaitMinutes
          ? Math.max(1, Math.round(event.estimatedWaitMinutes))
          : null,
      estimatedWaitStartRemainingMinutes:
        canSetEstimatedWait(event.position) &&
        event.estimatedWaitMinutes &&
        event.estimatedWaitStartRemainingMinutes
          ? Math.min(
              Math.max(0, Math.round(event.estimatedWaitStartRemainingMinutes)),
              Math.max(1, Math.round(event.estimatedWaitMinutes))
            )
          : null,
      estimatedWaitEndRemainingMinutes:
        canSetEstimatedWait(event.position) &&
        event.estimatedWaitMinutes &&
        event.estimatedWaitEndRemainingMinutes
          ? Math.min(
              Math.max(0, Math.round(event.estimatedWaitEndRemainingMinutes)),
              Math.max(1, Math.round(event.estimatedWaitMinutes))
            )
          : null,
    }));

    try {
      const nextTitle = title.trim() || "Untitled simulation";

      if (editingSimulationId) {
        await updateSimulation(
          editingSimulationId,
          nextTitle,
          normalizedEvents
        );
        await refresh();
        router.push(`/admin/simulations/${editingSimulationId}`);
        return;
      }

      const simulationId = await createSimulation(nextTitle, normalizedEvents);

      await refresh();
      router.push(`/admin/simulations/${simulationId}`);
    } catch (error) {
      setSubmitError(errorMessage(error, "Unable to create simulation."));
    }
  };

  const saving = creating || updating;

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Simulations</h2>
        <p className="text-sm text-gray-500">
          Create a timed sequence and preview it with the live home layout.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {editingSimulationId ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-green-50 px-3 py-2">
            <p className="text-sm font-medium text-green-900">
              Editing saved simulation
            </p>
            <button
              className="rounded-lg border bg-white px-3 py-2 text-sm"
              onClick={resetForm}
              type="button"
            >
              New Simulation
            </button>
          </div>
        ) : null}

        <label className="flex max-w-md flex-col gap-1 text-sm font-medium">
          Simulation Name
          <input
            className="rounded-lg border px-3 py-2 font-normal"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <div className="flex flex-col gap-3">
          {events.map((simulationEvent, index) => (
            <div
              className="rounded-lg border bg-gray-50 p-3"
              key={simulationEvent.id}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-gray-500">
                  Step {index + 1}
                </p>
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={events.length === 1}
                  onClick={() => removeEvent(simulationEvent.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium md:col-span-2">
                  Event Title
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal"
                    value={simulationEvent.label}
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        label: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
                  Seconds
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal"
                    min={1}
                    type="number"
                    value={simulationEvent.durationSeconds}
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        durationSeconds: Number(event.target.value),
                      })
                    }
                  />
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
                  Bridge
                  <select
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal"
                    value={simulationEvent.position}
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        position: event.target.value as BridgePosition,
                      })
                    }
                  >
                    {BRIDGE_POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
                  Northbound
                  <select
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal"
                    value={simulationEvent.northBoundTraffic}
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        northBoundTraffic: event.target.value as BridgeTraffic,
                      })
                    }
                  >
                    {BRIDGE_TRAFFIC_STATES.map((traffic) => (
                      <option key={traffic} value={traffic}>
                        {traffic}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
                  Southbound
                  <select
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal"
                    value={simulationEvent.southBoundTraffic}
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        southBoundTraffic: event.target.value as BridgeTraffic,
                      })
                    }
                  >
                    {BRIDGE_TRAFFIC_STATES.map((traffic) => (
                      <option key={traffic} value={traffic}>
                        {traffic}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
                  Wait Min
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal disabled:bg-gray-100"
                    disabled={!canSetEstimatedWait(simulationEvent.position)}
                    min={1}
                    placeholder="-"
                    type="number"
                    value={simulationEvent.estimatedWaitMinutes ?? ""}
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        estimatedWaitMinutes: event.target.value
                          ? Number(event.target.value)
                          : null,
                        estimatedWaitStartRemainingMinutes: event.target.value
                          ? simulationEvent.estimatedWaitStartRemainingMinutes ??
                            Number(event.target.value)
                          : null,
                        estimatedWaitEndRemainingMinutes: event.target.value
                          ? simulationEvent.estimatedWaitEndRemainingMinutes ??
                            Number(event.target.value)
                          : null,
                      })
                    }
                  />
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
                  Wait Starts At
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal disabled:bg-gray-100"
                    disabled={
                      !canSetEstimatedWait(simulationEvent.position) ||
                      !simulationEvent.estimatedWaitMinutes
                    }
                    max={simulationEvent.estimatedWaitMinutes ?? undefined}
                    min={0}
                    placeholder="remaining min"
                    type="number"
                    value={
                      simulationEvent.estimatedWaitStartRemainingMinutes ?? ""
                    }
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        estimatedWaitStartRemainingMinutes: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  />
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
                  Wait Ends At
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 font-normal disabled:bg-gray-100"
                    disabled={
                      !canSetEstimatedWait(simulationEvent.position) ||
                      !simulationEvent.estimatedWaitMinutes
                    }
                    max={simulationEvent.estimatedWaitMinutes ?? undefined}
                    min={0}
                    placeholder="remaining min"
                    type="number"
                    value={
                      simulationEvent.estimatedWaitEndRemainingMinutes ?? ""
                    }
                    onChange={(event) =>
                      updateEvent(simulationEvent.id, {
                        estimatedWaitEndRemainingMinutes: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={addEvent}
            type="button"
          >
            Add Event
          </button>

          <button
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving
              ? "Saving..."
              : editingSimulationId
                ? "Save Simulation"
                : "Generate Simulation"}
          </button>
        </div>

        {submitError ? (
          <p className="text-sm text-red-600">{submitError}</p>
        ) : null}
      </form>

      <div className="mt-6 border-t pt-4">
        <h3 className="mb-2 text-sm font-semibold">Generated Simulations</h3>

        {loadingSimulations ? <p className="text-sm">Loading...</p> : null}
        {simulationsError ? (
          <p className="text-sm text-red-600">{simulationsError.message}</p>
        ) : null}
        {!loadingSimulations && simulations.length === 0 ? (
          <p className="text-sm text-gray-500">No simulations generated yet.</p>
        ) : null}

        <div className="flex flex-col gap-2">
          {simulations.map((simulation) => (
            <div
              className="flex flex-col gap-3 rounded-lg border px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
              key={simulation.id}
            >
              <div>
                <p className="font-medium">{simulation.title}</p>
                <p className="text-gray-500">
                  {simulation.events.length} events
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  className="rounded-lg border px-3 py-2 hover:bg-gray-50"
                  href={`/admin/simulations/${simulation.id}`}
                >
                  View
                </Link>
                <button
                  className="rounded-lg border px-3 py-2 hover:bg-gray-50"
                  onClick={() => editSimulation(simulation)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleting}
                  onClick={() => handleDelete(simulation.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
