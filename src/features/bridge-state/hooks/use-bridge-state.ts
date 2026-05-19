"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBridgeState } from "@/src/features/bridge-state/bridge-state.queries";

export const useBridgeState = () => {
  return useQuery({
    queryKey: ["bridge-state"],
    queryFn: fetchBridgeState,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
};
