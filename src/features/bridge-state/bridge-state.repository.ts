import { getBridgeDataSource } from "./bridge-state.store";
import { CurrentBridgeState, CurrentBridgeStatePayload } from "./bridge-state.types";
import { firebaseBridgeStateRepository } from "./repositories/firebase-bridge-state.repository";
import { localStorageBridgeStateRepository } from "./repositories/localStorage-bridge-state.repository";

export interface BridgeStateRepository {
    getCurrentBridgeState(): Promise<CurrentBridgeState | null>;

    subscribeToBridgeState(
        callback: (state: CurrentBridgeState | null) => void,
        onError?: (error: Error) => void
    ): () => void;

    updateCurrentBridgeState(
        update: CurrentBridgeStatePayload
    ): Promise<void>;
}

export function getBridgeStateRepository(): BridgeStateRepository {
    const source = getBridgeDataSource();

    if (source === "local") {
        return localStorageBridgeStateRepository;
    }

    return firebaseBridgeStateRepository;
}