import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { db } from "@/src/lib/firebase/db";
import {
  BRIDGE_STATE_COLLECTION,
  EVENTS_COLLECTION,
} from "@/src/lib/firebase/collections";
import { CURRENT_BRIDGE_STATE_ID } from "./bridge-state.types";
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
        callback({ ...data, updatedAt: data.updatedAt.toDate().toDateString() });
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

// TODO: Implement with firebase client sdk
const addBridgeStateEvent = async (newEvent: any) => { };

const updateCurrentBridgeState = async (update: any) => { };

const toggleAcceptsDeviceUpdates = async (acceptsDeviceUpdates: boolean) => { };

export const bridgeStateService = {
  getCurrentBridgeState,
  subscribeToBridgeState
};
