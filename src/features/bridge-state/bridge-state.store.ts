type BridgeDataSource = "live" | "local";

const STORAGE_KEY = "bridge-data-source";

let currentSource: BridgeDataSource =
    (typeof window !== "undefined" &&
        (localStorage.getItem(STORAGE_KEY) as BridgeDataSource)) ||
    "live";

let listeners: ((mode: BridgeDataSource) => void)[] = [];

if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY) {
            const nextSource = (event.newValue as BridgeDataSource) || "live";
            currentSource = nextSource;
            listeners.forEach((l) => l(nextSource));
        }
    });
}

export function getBridgeDataSource(): BridgeDataSource {
    return currentSource;
}

export function setBridgeDataSource(mode: BridgeDataSource) {
    currentSource = mode;
    localStorage.setItem(STORAGE_KEY, mode);

    listeners.forEach((l) => l(mode));
}

export function subscribeToDataSource(
    callback: (mode: BridgeDataSource) => void
) {
    listeners.push(callback);

    return () => {
        listeners = listeners.filter((l) => l !== callback);
    };
}