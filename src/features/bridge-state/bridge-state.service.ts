import { getBridgeStateRepository } from "./bridge-state.repository";
import {
  CurrentBridgeState,
  CurrentBridgeStatePayload,
} from "./bridge-state.types";

const getCurrentBridgeState = async () => {
  return getBridgeStateRepository().getCurrentBridgeState();
};

const subscribeToBridgeState = (
  callback: (state: CurrentBridgeState | null) => void,
  onError?: (error: Error) => void
) => {
  return getBridgeStateRepository().subscribeToBridgeState(
    callback,
    onError
  );
};

const updateCurrentBridgeState = async (
  update: CurrentBridgeStatePayload
) => {
  return getBridgeStateRepository().updateCurrentBridgeState(
    update
  );
};

export const bridgeStateService = {
  getCurrentBridgeState,
  subscribeToBridgeState,
  updateCurrentBridgeState,
};