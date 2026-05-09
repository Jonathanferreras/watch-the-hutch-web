import { db } from "@/src/lib/firebase/db";
import {
  BRIDGE_STATE_COLLECTION,
  EVENTS_COLLECTION,
} from "@/src/lib/firebase/collections";
import { CURRENT_BRIDGE_STATE_ID } from "./bridge-state.types";
import {
  BridgeStateEventCreate,
  bridgeStateEventCreateSchema,
  CurrentBridgeStateSchema,
  currentBridgeStateSchema,
} from "./bridge-state.schema";

type BridgeStateTransactionContext = {
  currentState: CurrentBridgeStateSchema | null;
  saveCurrentState: (state: CurrentBridgeStateSchema) => void;
  saveEventAndCurrentState: (
    event: BridgeStateEventCreate,
    state: CurrentBridgeStateSchema,
  ) => string;
};

const getCurrentBridgeState =
  async (): Promise<CurrentBridgeStateSchema | null> => {
    const bridgeState = await db
      .collection(BRIDGE_STATE_COLLECTION)
      .doc(CURRENT_BRIDGE_STATE_ID)
      .get();

    if (!bridgeState.exists) {
      return null;
    }

    return currentBridgeStateSchema.parse(bridgeState.data());
  };

const runBridgeStateTransaction = async <Result>(
  handler: (context: BridgeStateTransactionContext) => Result,
): Promise<Result> => {
  return db.runTransaction(async (transaction) => {
    const currentBridgeStateRef = db
      .collection(BRIDGE_STATE_COLLECTION)
      .doc(CURRENT_BRIDGE_STATE_ID);
    const currentBridgeStateSnapshot = await transaction.get(
      currentBridgeStateRef,
    );
    const currentBridgeState = currentBridgeStateSnapshot.exists
      ? currentBridgeStateSchema.parse(currentBridgeStateSnapshot.data())
      : null;

    return handler({
      currentState: currentBridgeState,
      saveCurrentState: (state) => {
        transaction.set(
          currentBridgeStateRef,
          currentBridgeStateSchema.parse(state),
          { merge: true },
        );
      },
      saveEventAndCurrentState: (event, state) => {
        const eventRef = db.collection(EVENTS_COLLECTION).doc();

        transaction.set(eventRef, bridgeStateEventCreateSchema.parse(event));
        transaction.set(
          currentBridgeStateRef,
          currentBridgeStateSchema.parse(state),
          { merge: true },
        );

        return eventRef.id;
      },
    });
  });
};

const bridgeStateRepository = {
  getCurrentBridgeState,
  runBridgeStateTransaction,
};

export default bridgeStateRepository;
