import {
    CURRENT_BRIDGE_STATE_ID,
    CurrentBridgeState,
    CurrentBridgeStatePayload,
} from "../bridge-state.types";

import { BridgeStateRepository } from "../bridge-state.repository";

const STORAGE_KEY = "bridge-state";

/**
 * Ensure listeners are truly global (even across module reloads)
 */
const globalStore =
    (globalThis as any).__bridgeStateStore ||
    ((globalThis as any).__bridgeStateStore = {
        listeners: [] as ((
            state: CurrentBridgeState | null
        ) => void)[],
    });

function emit(state: CurrentBridgeState | null) {
    globalStore.listeners.forEach((cb: (state: CurrentBridgeState | null) => void) => cb(state));
}

function read(): CurrentBridgeState | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
        ...parsed,
        updatedAt: new Date(parsed.updatedAt),
    };
}

function write(state: CurrentBridgeState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    emit(state);
}

/**
 * Listen to storage changes (covers edge cases + multi-tab)
 */
if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY) {
            emit(read());
        }
    });
}

export const localStorageBridgeStateRepository: BridgeStateRepository = {
    async getCurrentBridgeState() {
        return read();
    },

    subscribeToBridgeState(callback) {
        globalStore.listeners.push(callback);

        callback(read());

        return () => {
            globalStore.listeners = globalStore.listeners.filter(
                (l: (state: CurrentBridgeState | null) => void) => l !== callback
            );
        };
    },

    async updateCurrentBridgeState(update: CurrentBridgeStatePayload) {
        const current = read();

        const next: CurrentBridgeState = {
            id: CURRENT_BRIDGE_STATE_ID,
            ...(current || {}), // handles null safely
            ...update,
            updatedAt: new Date(),
        };

        write(next);
    },
};