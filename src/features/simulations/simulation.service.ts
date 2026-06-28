import { getSimulationRepository } from "./simulation.repository";
import {
  CreateSimulationPayload,
  UpdateSimulationPayload,
} from "./simulation.types";

const createSimulation = async (payload: CreateSimulationPayload) => {
  return getSimulationRepository().createSimulation(payload);
};

const updateSimulation = async (
  simulationId: string,
  payload: UpdateSimulationPayload
) => {
  return getSimulationRepository().updateSimulation(simulationId, payload);
};

const deleteSimulation = async (simulationId: string) => {
  return getSimulationRepository().deleteSimulation(simulationId);
};

const getSimulation = async (simulationId: string) => {
  return getSimulationRepository().getSimulation(simulationId);
};

const listSimulationsForUser = async (userId: string) => {
  return getSimulationRepository().listSimulationsForUser(userId);
};

export const simulationService = {
  createSimulation,
  updateSimulation,
  deleteSimulation,
  getSimulation,
  listSimulationsForUser,
};
