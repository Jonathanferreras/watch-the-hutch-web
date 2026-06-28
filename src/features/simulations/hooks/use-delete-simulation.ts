import { useState } from "react";

import { toError } from "@/src/lib/errors";
import { simulationService } from "../simulation.service";

export function useDeleteSimulation() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteSimulation = async (simulationId: string) => {
    try {
      setDeleting(true);
      setError(null);

      await simulationService.deleteSimulation(simulationId);
    } catch (error) {
      const nextError = toError(error, "Unable to delete simulation.");
      setError(nextError);
      throw nextError;
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleteSimulation,
    deleting,
    error,
  };
}
