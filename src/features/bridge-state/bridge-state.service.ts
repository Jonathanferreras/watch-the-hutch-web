import { collection, doc, getDoc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";

import { db } from "@/src/lib/firebase/db";
import {
  BRIDGE_STATE_COLLECTION,
  EVENTS_COLLECTION,
} from "@/src/lib/firebase/collections";
import { CURRENT_BRIDGE_STATE_ID, CurrentBridgeStatePayload } from "./bridge-state.types";
import { logError } from "@/src/lib/errors";

const getCurrentBridgeState = async () => {
  try {
    const docRef = doc(db, BRIDGE_STATE_COLLECTION, CURRENT_BRIDGE_STATE_ID);
    const bridgeStateSnap = await getDoc(docRef);

    if (!bridgeStateSnap.exists()) {
      return null;
    }

    return bridgeStateSnap.data();
  } catch (error) {
    logError("Bridge State Service", "Failed to authenticate user.", error);
    throw error;
  }
};

const subscribeToBridgeState = (
  callback: (state: any | null) => void,
  onError?: (error: Error) => void
) => {
  const docRef = doc(db, BRIDGE_STATE_COLLECTION, CURRENT_BRIDGE_STATE_ID);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
      } else {
        const data = docSnap.data()
        const updatedAt = data.updatedAt
          ? data.updatedAt.toDate().toDateString()
          : null

        callback({ ...data, updatedAt });
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

const updateCurrentBridgeState = async (update: CurrentBridgeStatePayload) => {
  try {
    const batch = writeBatch(db);
    const currentBridgeStateRef = doc(db, BRIDGE_STATE_COLLECTION, CURRENT_BRIDGE_STATE_ID);
    const eventsRef = doc(collection(db, EVENTS_COLLECTION));

    batch.update(currentBridgeStateRef, {
      ...update,
      id: CURRENT_BRIDGE_STATE_ID,
      updatedAt: serverTimestamp()
    });

    batch.set(eventsRef, {
      id: eventsRef.id,
      sourceId: update.sourceId,
      sourceType: update.sourceType,

      position: update.position,
      positionConfidence: update.positionConfidence,

      traffic: update.traffic,
      trafficConfidence: update.trafficConfidence,

      occurredAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    logError("Bridge State Service", "Failed to authenticate user.", error);
    throw error;
  }
};

// TODO: Implement with firebase client sdk
const addBridgeStateEvent = async (newEvent: any) => { };
const toggleAcceptsDeviceUpdates = async (acceptsDeviceUpdates: boolean) => { };

export const bridgeStateService = {
  getCurrentBridgeState,
  subscribeToBridgeState,
  updateCurrentBridgeState
};
