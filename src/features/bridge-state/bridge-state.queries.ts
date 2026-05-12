import { CurrentBridgeStateSchema } from "./bridge-state.schema";

export const fetchBridgeState = async (): Promise<CurrentBridgeStateSchema> => {
  const requestOptions = { method: "GET" };
  const response = await fetch("/api/bridge-state", requestOptions);

  if (!response.ok) {
    throw new Error("Failed to fetch bridge state.");
  }

  const { currentState } = await response.json();

  return currentState;
};
