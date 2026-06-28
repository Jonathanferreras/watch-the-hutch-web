import { useEffect, useState } from "react";

import { toError } from "@/src/lib/errors";
import { useBridgeDataSource } from "../../bridge-state/hooks/use-bridge-data-source";
import { simulationService } from "../simulation.service";
import { Simulation } from "../simulation.types";

export function useSimulation(simulationId: string | null) {
  const source = useBridgeDataSource();
  const [result, setResult] = useState<{
    simulationId: string | null;
    source: string;
    data: Simulation | null;
    error: Error | null;
  }>({
    simulationId: null,
    source,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!simulationId) {
      return;
    }

    let cancelled = false;

    simulationService
      .getSimulation(simulationId)
      .then((simulation) => {
        if (cancelled) return;
        setResult({
          simulationId,
          source,
          data: simulation,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          simulationId,
          source,
          data: null,
          error: toError(error, "Unable to load simulation."),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [simulationId, source]);

  return {
    data: simulationId ? result.data : null,
    loading: Boolean(
      simulationId &&
        (result.simulationId !== simulationId || result.source !== source)
    ),
    error: simulationId ? result.error : null,
  };
}
