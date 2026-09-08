'use client';

import React, { useState, useEffect } from 'react';
import EmergencyAIAssistant from '@/components/emergency/emergency-ai-assistant';
import RescueResourcesCard from '@/components/dashboard/rescue-resources-card';
import MapWrapper from '@/components/map/map-wrapper';
import {
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Activity,
  HeartHandshake,
  Locate
} from 'lucide-react';

export default function EmergencyPage() {
  const [activeLocation, setActiveLocation] = useState<any>({
    name: 'Mithi River Basin, Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    riskLevel: 'HIGH',
  });
  const [resourceData, setResourceData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/resources/available?lat=19.076&lng=72.8777')
      .then((res) => res.json())
      .then((d) => setResourceData(d))
      .catch(() => {});
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8 max-w-7xl">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-background border border-red-900/40 text-white space-y-3 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-extrabold tracking-wider uppercase">
              <ShieldAlert className="h-3.5 w-3.5 text-red-400 animate-pulse" />
              Citizen Emergency & SOS Command
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Flood Emergency AI Assistant & SOS Dispatch
            </h1>
            <p className="text-sm text-slate-300">
              Immediate safety-first protocols, location-aware shelter guidance, and emergency hotline dispatch.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs space-y-1 shrink-0">
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider block">
              Emergency Hotlines
            </span>
            <div className="flex items-center gap-3 font-extrabold">
              <span className="text-red-400">🚨 112 National</span>
              <span className="text-amber-400">🚒 1070 NDRF</span>
              <span className="text-emerald-400">🚑 108 Ambulance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Assistant + Map/Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Emergency AI Assistant (Col Span 2) */}
        <div className="lg:col-span-2">
          <EmergencyAIAssistant
            locationName={activeLocation.name}
            latitude={activeLocation.latitude}
            longitude={activeLocation.longitude}
            riskLevel={activeLocation.riskLevel}
          />
        </div>

        {/* Right Column: Live Map & Rescue Resources (Col Span 1) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" /> Interactive Safe Zone Map
            </h3>
            <p className="text-xs text-muted-foreground">
              Locate open shelters and high-ground refuges directly on the map.
            </p>

            <div className="h-80 w-full rounded-2xl overflow-hidden border border-border shadow-inner">
              <MapWrapper />
            </div>
          </div>

          {/* Rescue Resources Card */}
          <RescueResourcesCard data={resourceData} />
        </div>
      </div>
    </div>
  );
}
