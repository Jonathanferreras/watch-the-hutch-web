import repository from "./bridge-state.repository";
import { CURRENT_BRIDGE_STATE_ID } from "./bridge-state.types";
import {
  bridgeStateDeviceUpdatesToggleSchema,
  bridgeStateEventCreateSchema,
  CreateBridgeStateEventInput,
  createBridgeStateEventSchema,
  currentBridgeStateSchema,
  CurrentBridgeStateSchema,
} from "./bridge-state.schema";

type ValidationIssue = {
  path: string;
  message: string;
};

class BridgeStateValidationError extends Error {
  issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[]) {
    super(message);
    this.name = "BridgeStateValidationError";
    this.issues = issues;
  }
}

const logError = (message: string, error: unknown) => {
  console.error(`[BridgeStateService] ${message}`, error);
};

const validationIssues = (
  error: { issues: { path: PropertyKey[]; message: string }[] },
): ValidationIssue[] =>
  error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

const parseBridgeStateEventPayload = (
  payload: unknown,
): CreateBridgeStateEventInput => {
  const parsed = createBridgeStateEventSchema.safeParse(payload);

  if (!parsed.success) {
    throw new BridgeStateValidationError(
      "Invalid bridge state event payload.",
      validationIssues(parsed.error),
    );
  }

  return parsed.data;
};

const parseDeviceUpdatesTogglePayload = (payload: unknown): boolean => {
  const parsed = bridgeStateDeviceUpdatesToggleSchema.safeParse(payload);

  if (!parsed.success) {
    throw new BridgeStateValidationError(
      "Invalid device update toggle payload.",
      validationIssues(parsed.error),
    );
  }

  return parsed.data.acceptsDeviceUpdates;
};

const isValidationError = (
  error: unknown,
): error is BridgeStateValidationError =>
  error instanceof BridgeStateValidationError;

const getCurrentBridgeState =
  async (): Promise<CurrentBridgeStateSchema | null> => {
    try {
      return await repository.getCurrentBridgeState();
    } catch (error) {
      logError("Failed to retrieve current bridge state.", error);
      throw error;
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
    throw error;
  }
};

const addBridgeStateEventFromPayload = async (payload: unknown) =>
  addBridgeStateEvent(parseBridgeStateEventPayload(payload));

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
    throw error;
  }
};

const updateCurrentBridgeStateFromPayload = async (payload: unknown) =>
  updateCurrentBridgeState(parseBridgeStateEventPayload(payload));

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
    throw error;
  }
};

const toggleAcceptsDeviceUpdatesFromPayload = async (payload: unknown) =>
  toggleAcceptsDeviceUpdates(parseDeviceUpdatesTogglePayload(payload));

const bridgeStateService = {
  getCurrentBridgeState,
  addBridgeStateEvent,
  addBridgeStateEventFromPayload,
  updateCurrentBridgeState,
  updateCurrentBridgeStateFromPayload,
  toggleAcceptsDeviceUpdates,
  toggleAcceptsDeviceUpdatesFromPayload,
  isValidationError,
};

export default bridgeStateService;
