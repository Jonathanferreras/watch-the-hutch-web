import { useState } from "react";

import { toError } from "@/src/lib/errors";
import { simulationService } from "../simulation.service";
import { SimulationEvent } from "../simulation.types";

export function useUpdateSimulation() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateSimulation = async (
    simulationId: string,
    title: string,
    events: SimulationEvent[]
  ) => {
    try {
      setUpdating(true);
      setError(null);

      await simulationService.updateSimulation(simulationId, {
        title,
        events,
      });
    } catch (error) {
      const nextError = toError(error, "Unable to update simulation.");
      setError(nextError);
      throw nextError;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateSimulation,
    updating,
    error,
  };
}
