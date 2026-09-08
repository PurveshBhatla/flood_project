import { useFloodSimulationContext } from '../context/flood-simulation-context';

export function useFloodSimulation() {
  const ctx = useFloodSimulationContext();
  return {
    isDemoActive: ctx.isSimulatedAlert,
    isSimulatedAlert: ctx.isSimulatedAlert,
    demoData: ctx.demoData,
    enableDemoMode: ctx.enableDemoMode,
    resetToLive: ctx.resetToLive,
    toggleDemoMode: ctx.toggleSimulation,
    toggleSimulation: ctx.toggleSimulation,
  };
}

