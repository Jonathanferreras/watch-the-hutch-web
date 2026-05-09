import repository from "./bridge-state.repository";
import { CURRENT_BRIDGE_STATE_ID } from "./bridge-state.types";
import {
  bridgeStateEventCreateSchema,
  CreateBridgeStateEventInput,
  createBridgeStateEventSchema,
  currentBridgeStateSchema,
  CurrentBridgeStateSchema,
} from "./bridge-state.schema";

const logError = (message: string, error: unknown) => {
  console.error(`[BridgeStateService] ${message}`, error);
};

const getCurrentBridgeState =
  async (): Promise<CurrentBridgeStateSchema | null> => {
    try {
      return await repository.getCurrentBridgeState();
    } catch (error) {
      logError("Failed to retrieve current bridge state.", error);
      return null;
    }
  };

const addBridgeStateEvent = async (
  input: CreateBridgeStateEventInput,
): Promise<{
  eventId: string | null;
  currentState: CurrentBridgeStateSchema | null;
}> => {
  try {
    const parsed = createBridgeStateEventSchema.parse(input);
    const result = await repository.runBridgeStateTransaction(
      ({ currentState, saveEventAndCurrentState }) => {
        if (
          parsed.sourceType === "device" &&
          currentState?.acceptsDeviceUpdates === false
        ) {
          return {
            eventId: null,
            currentState,
          };
        }

        const now = new Date();
        const event = bridgeStateEventCreateSchema.parse({
          ...parsed,
          createdAt: now,
        });
        const nextState = currentBridgeStateSchema.parse({
          id: CURRENT_BRIDGE_STATE_ID,
          sourceId: event.sourceId,
          sourceType: event.sourceType,
          position: event.position,
          positionConfidence: event.positionConfidence,
          traffic: event.traffic,
          trafficConfidence: event.trafficConfidence,
          acceptsDeviceUpdates:
            event.sourceType === "admin"
              ? false
              : (currentState?.acceptsDeviceUpdates ?? true),
          updatedAt: now,
        });
        const eventId = saveEventAndCurrentState(event, nextState);

        return {
          eventId,
          currentState: nextState,
        };
      },
    );

    if (parsed.sourceType === "device" && !result.eventId) {
      console.info(
        "[BridgeStateService] Ignored device bridge state event because device updates are disabled.",
      );
    }

    return result;
  } catch (error) {
    logError("Failed to add bridge state event.", error);

    return {
      eventId: null,
      currentState: null,
    };
  }
};

const updateCurrentBridgeState = async (
  input: CreateBridgeStateEventInput,
): Promise<CurrentBridgeStateSchema | null> => {
  try {
    const { currentState } = await addBridgeStateEvent(input);

    if (!currentState) {
      throw new Error("Bridge state update did not return a current state.");
    }

    return currentState;
  } catch (error) {
    logError("Failed to update current bridge state.", error);
    return null;
  }
};

const toggleAcceptsDeviceUpdates = async (
  acceptsDeviceUpdates: boolean,
): Promise<CurrentBridgeStateSchema | null> => {
  try {
    const nextState = await repository.runBridgeStateTransaction(
      ({ currentState, saveCurrentState }) => {
        if (!currentState) {
          throw new Error(
            "Cannot toggle device updates because no current bridge state exists.",
          );
        }

        const state = currentBridgeStateSchema.parse({
          ...currentState,
          acceptsDeviceUpdates,
          updatedAt: new Date(),
        });

        saveCurrentState(state);

        return state;
      },
    );

    console.info(
      `[BridgeStateService] Device updates ${
        acceptsDeviceUpdates ? "enabled" : "disabled"
      } by admin.`,
    );

    return nextState;
  } catch (error) {
    logError("Failed to toggle device update permissions.", error);
    return null;
  }
};

const bridgeStateService = {
  getCurrentBridgeState,
  addBridgeStateEvent,
  updateCurrentBridgeState,
  toggleAcceptsDeviceUpdates,
};

export default bridgeStateService;
