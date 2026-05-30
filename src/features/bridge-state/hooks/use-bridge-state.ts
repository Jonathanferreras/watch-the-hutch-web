import { useEffect, useState } from "react";

import { bridgeStateService } from "../bridge-state.service";
import { CurrentBridgeState } from "../bridge-state.types";
import { toError } from "@/src/lib/errors";

export const useBridgeState = () => {
  const [data, setData] = useState<CurrentBridgeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
  }, []);


  return {
    data,
    loading,
    error,
  };
};
