import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { SIMULATIONS_COLLECTION } from "@/src/lib/firebase/collections";
import { db } from "@/src/lib/firebase/db";
import { logError } from "@/src/lib/errors";
import { SimulationRepository } from "../simulation.repository";
import { Simulation, SimulationEvent } from "../simulation.types";

type SimulationDocument = {
  title?: string;
  createdBy?: string;
  events?: SimulationEvent[];
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
};

const toDate = (value: Date | Timestamp | null | undefined) => {
  if (!value) return new Date();

  return value instanceof Date ? value : value.toDate();
};

const normalizeEvent = (event: SimulationEvent): SimulationEvent => ({
  ...event,
  estimatedWaitStartRemainingMinutes:
    event.estimatedWaitStartRemainingMinutes ?? event.estimatedWaitMinutes,
  estimatedWaitEndRemainingMinutes:
    event.estimatedWaitEndRemainingMinutes ??
    event.estimatedWaitStartRemainingMinutes ??
    event.estimatedWaitMinutes,
});

const normalizeSimulation = (
  id: string,
  data: SimulationDocument
): Simulation => ({
  id,
  title: data.title ?? "Untitled simulation",
  createdBy: data.createdBy ?? "",
  events: (data.events ?? []).map(normalizeEvent),
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
});

export const firebaseSimulationRepository: SimulationRepository = {
  async createSimulation(payload) {
    try {
      const docRef = await addDoc(collection(db, SIMULATIONS_COLLECTION), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      logError(
        "FirebaseSimulationRepo",
        "Failed to create simulation.",
        error
      );
      throw error;
    }
  },

  async updateSimulation(simulationId, payload) {
    try {
      await updateDoc(doc(db, SIMULATIONS_COLLECTION, simulationId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logError(
        "FirebaseSimulationRepo",
        "Failed to update simulation.",
        error
      );
      throw error;
    }
  },

  async deleteSimulation(simulationId) {
    try {
      await deleteDoc(doc(db, SIMULATIONS_COLLECTION, simulationId));
    } catch (error) {
      logError(
        "FirebaseSimulationRepo",
        "Failed to delete simulation.",
        error
      );
      throw error;
    }
  },

  async getSimulation(simulationId) {
    try {
      const snap = await getDoc(doc(db, SIMULATIONS_COLLECTION, simulationId));

      if (!snap.exists()) {
        return null;
      }

      return normalizeSimulation(
        snap.id,
        snap.data() as SimulationDocument
      );
    } catch (error) {
      logError(
        "FirebaseSimulationRepo",
        "Failed to fetch simulation.",
        error
      );
      throw error;
    }
  },

  async listSimulationsForUser(userId) {
    try {
      const snap = await getDocs(
        query(
          collection(db, SIMULATIONS_COLLECTION),
          orderBy("createdAt", "desc")
        )
      );

      return snap.docs
        .map((simulationDoc) =>
          normalizeSimulation(
            simulationDoc.id,
            simulationDoc.data() as SimulationDocument
          )
        )
        .filter((simulation) => simulation.createdBy === userId);
    } catch (error) {
      logError(
        "FirebaseSimulationRepo",
        "Failed to list simulations.",
        error
      );
      throw error;
    }
  },
};
