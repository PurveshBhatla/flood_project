'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, PhoneCall, HelpCircle } from 'lucide-react';
import EmergencyAIAssistant from '@/components/emergency/emergency-ai-assistant';

export default function SafetyPage() {
  return (
    <div className="py-12 space-y-12">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center space-y-4">
        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Emergency Preparedness & AI Safety</span>
        <h1 className="text-4xl font-extrabold tracking-tight">Flood Safety & Emergency AI Assistant</h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-3xl mx-auto">
          Ask our AI assistant what to do during floods or access critical actions to protect your family before, during, and after inundation events.
        </p>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-5xl space-y-12">
        {/* Emergency AI Assistant Widget */}
        <EmergencyAIAssistant locationName="Monitored Flood Area" />

        {/* Guidelines Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-center">Standard Flood Response Guidelines</h2>

          {/* BEFORE */}
          <div className="p-8 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
            <h3 className="text-xl font-bold text-brand-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> 1. BEFORE FLOODING (Preparation)
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>• Build an emergency survival kit: 3-day supply of bottled water, non-perishable food, flashlight, first aid kit, and battery radio.</li>
              <li>• Save emergency hotlines (112, 108, 1070) in your mobile phone.</li>
              <li>• Identify local elevated shelter zones and practice evacuation routes with family members.</li>
              <li>• Install check valves in sewer traps to prevent flood backflow.</li>
            </ul>
          </div>

          {/* DURING */}
          <div className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4 shadow-sm">
            <h3 className="text-xl font-bold text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> 2. DURING FLOODING (Response)
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>• Move immediately to higher ground. Do not wait for mandatory evacuation orders if water starts rising.</li>
              <li>• Turn Off Main Power & Gas Utilities if instructing authorities advise or if home flooding starts.</li>
              <li>• <strong>NEVER WALK OR DRIVE THROUGH FLOOD WATERS</strong>. 6 inches of swift water knocks down adults; 2 feet floats vehicles.</li>
              <li>• Stay off bridges over fast-moving water.</li>
            </ul>
          </div>

          {/* AFTER */}
          <div className="p-8 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
            <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> 3. AFTER FLOODING (Recovery)
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>• Return home only after local disaster emergency officials declare the area safe.</li>
              <li>• Avoid standing water which may be contaminated or electrically charged by downed power cables.</li>
              <li>• Boil drinking water until local public health agencies announce supply safety tests.</li>
              <li>• Take photos of damaged property for insurance claims.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
