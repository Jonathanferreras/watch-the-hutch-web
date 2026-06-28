import {
  BridgePosition,
  BridgeTraffic,
  CurrentBridgeState,
} from "../bridge-state/bridge-state.types";

export type SimulationEvent = {
  id: string;
  label: string;
  durationSeconds: number;
  position: BridgePosition;
  northBoundTraffic: BridgeTraffic;
  southBoundTraffic: BridgeTraffic;
  estimatedWaitMinutes: number | null;
  estimatedWaitStartRemainingMinutes: number | null;
  estimatedWaitEndRemainingMinutes: number | null;
};

export type Simulation = {
  id: string;
  title: string;
  createdBy: string;
  events: SimulationEvent[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSimulationPayload = {
  title: string;
  createdBy: string;
  events: SimulationEvent[];
};

export type UpdateSimulationPayload = {
  title: string;
  events: SimulationEvent[];
};

export type SimulationFrame = CurrentBridgeState & {
  simulationEventId: string;
  simulationEventLabel: string;
  simulationElapsedSeconds: number;
  simulationEventElapsedSeconds: number;
};
