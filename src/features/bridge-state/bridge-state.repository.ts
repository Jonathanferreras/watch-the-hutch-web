import { db } from "@/src/lib/firebase/db";
import {
  BRIDGE_STATE_COLLECTION,
  EVENTS_COLLECTION,
} from "@/src/lib/firebase/collections";
import { CurrentBridgeState, BridgeStateEvent } from "./bridge-state.types";

const BRIDGE_STATE_ID = "current";

export async function getCurrentBridgeState(): Promise<CurrentBridgeState | null> {
  const bridgeState = await db
    .collection(BRIDGE_STATE_COLLECTION)
    .doc(BRIDGE_STATE_ID)
    .get();

  if (!bridgeState.exists) {
    return null;
  }

  return bridgeState.data() as CurrentBridgeState;
}

export async function saveCurrentBridgeState(
  state: CurrentBridgeState,
): Promise<void> {
  await db
    .collection(BRIDGE_STATE_COLLECTION)
    .doc(BRIDGE_STATE_ID)
    .set(state, { merge: true });
}

export async function saveBridgeStateEvent(
  event: BridgeStateEvent,
): Promise<string> {
  const savedEvent = await db.collection(EVENTS_COLLECTION).add(event);

  return savedEvent.id;
}
