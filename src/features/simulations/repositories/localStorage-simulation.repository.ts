import { SimulationRepository } from "../simulation.repository";
import {
  CreateSimulationPayload,
  Simulation,
  SimulationEvent,
} from "../simulation.types";

const STORAGE_KEY = "simulations";

type StoredSimulation = Omit<Simulation, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

const toSimulation = (simulation: StoredSimulation): Simulation => ({
  ...simulation,
  events: simulation.events.map(normalizeEvent),
  createdAt: new Date(simulation.createdAt),
  updatedAt: new Date(simulation.updatedAt),
});

const normalizeEvent = (event: SimulationEvent): SimulationEvent => ({
  ...event,
  estimatedWaitStartRemainingMinutes:
    event.estimatedWaitStartRemainingMinutes ?? event.estimatedWaitMinutes,
  estimatedWaitEndRemainingMinutes:
    event.estimatedWaitEndRemainingMinutes ??
    event.estimatedWaitStartRemainingMinutes ??
    event.estimatedWaitMinutes,
});

const read = (): Simulation[] => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as StoredSimulation[];

  return parsed.map(toSimulation);
};

const write = (simulations: Simulation[]) => {
  const storedSimulations: StoredSimulation[] = simulations.map(
    (simulation) => ({
      ...simulation,
      createdAt: simulation.createdAt.toISOString(),
      updatedAt: simulation.updatedAt.toISOString(),
    })
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSimulations));
};

export const localStorageSimulationRepository: SimulationRepository = {
  async createSimulation(payload: CreateSimulationPayload) {
    const now = new Date();
    const simulation: Simulation = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    write([simulation, ...read()]);

    return simulation.id;
  },

  async updateSimulation(simulationId, payload) {
    const now = new Date();
    const simulations = read().map((simulation) => {
      if (simulation.id !== simulationId) {
        return simulation;
      }

      return {
        ...simulation,
        ...payload,
        updatedAt: now,
      };
    });

    write(simulations);
  },

  async deleteSimulation(simulationId) {
    write(read().filter((simulation) => simulation.id !== simulationId));
  },

  async getSimulation(simulationId) {
    return (
      read().find((simulation) => simulation.id === simulationId) ?? null
    );
  },

  async listSimulationsForUser(userId) {
    return read()
      .filter((simulation) => simulation.createdBy === userId)
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
  },
};
