"use client";

import { useParams } from "next/navigation";

import { SimulationPlayback } from "@/src/features/simulations/components/simulation-playback";
import { useSimulation } from "@/src/features/simulations/hooks/use-simulation";

export default function SimulationPage() {
  const params = useParams<{ simulationId: string }>();
  const simulationId = params.simulationId;
  const { data, loading, error } = useSimulation(simulationId);

  if (loading) {
    return <p className="pt-20 text-center">Loading simulation...</p>;
  }

  if (error) {
    return (
      <p className="pt-20 text-center text-red-600">
        Failed to load simulation.
      </p>
    );
  }

  if (!data) {
    return <p className="pt-20 text-center">Simulation not found.</p>;
  }

  return <SimulationPlayback simulation={data} />;
}
