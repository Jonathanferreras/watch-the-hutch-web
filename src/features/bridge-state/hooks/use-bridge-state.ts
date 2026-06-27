import { useEffect, useState } from "react";

import { bridgeStateService } from "../bridge-state.service";
import { CurrentBridgeState } from "../bridge-state.types";
import { toError } from "@/src/lib/errors";
import { useBridgeDataSource } from "./use-bridge-data-source";

export const useBridgeState = () => {
  const source = useBridgeDataSource();

  const [data, setData] = useState<CurrentBridgeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [prevSource, setPrevSource] = useState(source);

  if (source !== prevSource) {
    setPrevSource(source);
    setLoading(true);
    setData(null);
    setError(null);
  }

  useEffect(() => {
    const unsubscribe = bridgeStateService.subscribeToBridgeState(
      (state) => {
        setData(state);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(toError(err, "Bridge state fetch error."));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [source]);

  return {
    data,
    loading,
    error,
  };
};