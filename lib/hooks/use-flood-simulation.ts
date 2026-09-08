import { useState, useCallback } from 'react';
import { DemoScenarioService, DemoScenarioData } from '../services/demo-scenario.service';

export function useFloodSimulation() {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoData, setDemoData] = useState<DemoScenarioData | null>(null);

  const enableDemoMode = useCallback(() => {
    const scenario = DemoScenarioService.getHighFloodScenario();
    setDemoData(scenario);
    setIsDemoActive(true);
  }, []);

  const resetToLive = useCallback(() => {
    setIsDemoActive(false);
    setDemoData(null);
  }, []);

  const toggleDemoMode = useCallback(() => {
    if (isDemoActive) {
      resetToLive();
    } else {
      enableDemoMode();
    }
  }, [isDemoActive, enableDemoMode, resetToLive]);

  return {
    isDemoActive,
    demoData,
    enableDemoMode,
    resetToLive,
    toggleDemoMode,
  };
}
