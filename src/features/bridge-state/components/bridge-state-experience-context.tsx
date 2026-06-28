"use client";

import { createContext, ReactNode, useContext } from "react";

import { CurrentBridgeState } from "../bridge-state.types";

const BridgeStateExperienceContext =
  createContext<CurrentBridgeState | null>(null);

interface BridgeStateExperienceProviderProps {
  children: ReactNode;
  state: CurrentBridgeState;
}

export function BridgeStateExperienceProvider({
  children,
  state,
}: BridgeStateExperienceProviderProps) {
  return (
    <BridgeStateExperienceContext.Provider value={state}>
      {children}
    </BridgeStateExperienceContext.Provider>
  );
}

export function useBridgeStateExperience() {
  const state = useContext(BridgeStateExperienceContext);

  if (!state) {
    throw new Error(
      "useBridgeStateExperience must be used within BridgeStateExperienceProvider."
    );
  }

  return state;
}
