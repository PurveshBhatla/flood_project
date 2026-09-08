'use client';

import React from 'react';
import { useFloodSimulationContext } from '@/lib/context/flood-simulation-context';
import { Zap, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function FloatingSimulationSwitch() {
  const { isSimulatedAlert, toggleSimulation, resetToLive } = useFloodSimulationContext();

  return (
    <div className="fixed top-20 right-4 md:right-8 z-[9999] flex flex-col items-end gap-2 pointer-events-auto max-w-sm animate-fade-in">
      {/* High-Contrast Floating Toggle Switch */}
      <button
        id="floating-demo-simulation-toggle"
        onClick={toggleSimulation}
        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-2xl backdrop-blur-md border-2 cursor-pointer ${
          isSimulatedAlert
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/30'
            : 'bg-red-600 hover:bg-red-700 text-white border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.5)] ring-4 ring-red-500/30'
        }`}
      >
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSimulatedAlert ? 'bg-emerald-300' : 'bg-red-300'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              isSimulatedAlert ? 'bg-emerald-200' : 'bg-red-200'
            }`}
          />
        </span>
        {isSimulatedAlert ? (
          <span className="flex items-center gap-1.5 font-black text-sm">
            <RotateCcw className="h-4 w-4" /> [ 🟢 RESET TO LIVE TELEMETRY ]
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-black text-sm">
            <Zap className="h-4 w-4" /> [ 🔴 TRIGGER +2H FLOOD SIMULATION (DEMO) ]
          </span>
        )}
      </button>

      {/* Persistent Amber/Red Badge When Active */}
      {isSimulatedAlert && (
        <div className="px-3.5 py-2 rounded-xl bg-slate-900/95 text-red-400 border-2 border-red-500 shadow-2xl text-[11px] font-extrabold flex items-center gap-2 text-right animate-pulse">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <span>SIMULATION ACTIVE: Extreme Cloudburst Nowcast (+2 Hours Scenario)</span>
        </div>
      )}
    </div>
  );
}
