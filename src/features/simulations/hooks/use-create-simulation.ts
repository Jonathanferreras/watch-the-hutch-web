import { useState } from "react";

import { toError } from "@/src/lib/errors";
import { useAuthContext } from "../../auth/components/auth-provider";
import { simulationService } from "../simulation.service";
import { SimulationEvent } from "../simulation.types";

export function useCreateSimulation() {
  const { user } = useAuthContext();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createSimulation = async (title: string, events: SimulationEvent[]) => {
    if (!user?.uid) {
      throw new Error("You must be logged in to create simulations.");
    }

    try {
      setCreating(true);
      setError(null);

      return await simulationService.createSimulation({
        title,
        events,
        createdBy: user.uid,
      });
    } catch (error) {
      const nextError = toError(error, "Unable to create simulation.");
      setError(nextError);
      throw nextError;
    } finally {
      setCreating(false);
    }
  };

  return {
    createSimulation,
    creating,
    error,
  };
}
