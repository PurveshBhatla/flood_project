'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DemoScenarioService, DemoScenarioData } from '../services/demo-scenario.service';

interface FloodSimulationContextType {
  isSimulatedAlert: boolean;
  demoData: DemoScenarioData | null;
  enableDemoMode: () => void;
  resetToLive: () => void;
  toggleSimulation: () => void;
}

const FloodSimulationContext = createContext<FloodSimulationContextType>({
  isSimulatedAlert: false,
  demoData: null,
  enableDemoMode: () => {},
  resetToLive: () => {},
  toggleSimulation: () => {},
});

export function FloodSimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulatedAlert, setIsSimulatedAlert] = useState(false);
  const [demoData, setDemoData] = useState<DemoScenarioData | null>(null);

  const enableDemoMode = useCallback(() => {
    const scenario = DemoScenarioService.getHighFloodScenario();
    setDemoData(scenario);
    setIsSimulatedAlert(true);
  }, []);

  const resetToLive = useCallback(() => {
    setIsSimulatedAlert(false);
    setDemoData(null);
  }, []);

  const toggleSimulation = useCallback(() => {
    if (isSimulatedAlert) {
      resetToLive();
    } else {
      enableDemoMode();
    }
  }, [isSimulatedAlert, enableDemoMode, resetToLive]);

  return (
    <FloodSimulationContext.Provider
      value={{
        isSimulatedAlert,
        demoData,
        enableDemoMode,
        resetToLive,
        toggleSimulation,
      }}
    >
      {children}
    </FloodSimulationContext.Provider>
  );
}

export function useFloodSimulationContext() {
  return useContext(FloodSimulationContext);
}
