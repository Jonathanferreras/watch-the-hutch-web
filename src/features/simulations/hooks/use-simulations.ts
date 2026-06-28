import { useCallback, useEffect, useState } from "react";

import { toError } from "@/src/lib/errors";
import { useAuthContext } from "../../auth/components/auth-provider";
import { useBridgeDataSource } from "../../bridge-state/hooks/use-bridge-data-source";
import { simulationService } from "../simulation.service";
import { Simulation } from "../simulation.types";

export function useSimulations() {
  const { user } = useAuthContext();
  const source = useBridgeDataSource();
  const userId = user?.uid ?? null;
  const [result, setResult] = useState<{
    userId: string | null;
    source: string;
    data: Simulation[];
    error: Error | null;
  }>({
    userId: null,
    source,
    data: [],
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      setResult({
        userId: null,
        source,
        data: [],
        error: null,
      });
      return;
    }

    try {
      const simulations = await simulationService.listSimulationsForUser(userId);
      setResult({
        userId,
        source,
        data: simulations,
        error: null,
      });
    } catch (error) {
      setResult({
        userId,
        source,
        data: [],
        error: toError(error, "Unable to load simulations."),
      });
    }
  }, [source, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    simulationService
      .listSimulationsForUser(userId)
      .then((simulations) => {
        if (cancelled) return;
        setResult({
          userId,
          source,
          data: simulations,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          userId,
          source,
          data: [],
          error: toError(error, "Unable to load simulations."),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [source, userId]);

  return {
    data: userId ? result.data : [],
    loading: Boolean(
      userId && (result.userId !== userId || result.source !== source)
    ),
    error: userId ? result.error : null,
    refresh,
  };
}
