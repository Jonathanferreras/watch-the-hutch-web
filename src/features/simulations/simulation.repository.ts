import { getBridgeDataSource } from "../bridge-state/bridge-state.store";
import {
  CreateSimulationPayload,
  Simulation,
  UpdateSimulationPayload,
} from "./simulation.types";
import { firebaseSimulationRepository } from "./repositories/firebase-simulation.repository";
import { localStorageSimulationRepository } from "./repositories/localStorage-simulation.repository";

export interface SimulationRepository {
  createSimulation(payload: CreateSimulationPayload): Promise<string>;

  updateSimulation(
    simulationId: string,
    payload: UpdateSimulationPayload
  ): Promise<void>;

  deleteSimulation(simulationId: string): Promise<void>;

  getSimulation(simulationId: string): Promise<Simulation | null>;

  listSimulationsForUser(userId: string): Promise<Simulation[]>;
}

export function getSimulationRepository(): SimulationRepository {
  const source = getBridgeDataSource();

  if (source === "local") {
    return localStorageSimulationRepository;
  }

  return firebaseSimulationRepository;
}
