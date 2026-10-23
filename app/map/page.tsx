'use client';

import React from 'react';
import Link from 'next/link';
import MapWrapper from '@/components/map/map-wrapper';
import { PlusCircle, Info, ShieldCheck, MapPin } from 'lucide-react';

export default function FullMapPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] relative flex flex-col overflow-hidden bg-background">
      {/* Map Sub-Header Information Strip */}
      <div className="bg-card/95 border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-extrabold text-foreground">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span>FloodWatch Live Waterlogging Intelligence Map</span>
          </div>

          <span className="hidden md:inline-block text-muted-foreground">•</span>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>OpenStreetMap Tiles (Zero Paid Keys Required)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mild (&lt;15cm)</span>
            <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate (15-45cm)</span>
            <span className="flex items-center gap-1 text-orange-600"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High (45-90cm)</span>
            <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Severe (&gt;90cm)</span>
          </div>

          <Link
            href="/report"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Report Incident
          </Link>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="flex-1 relative w-full h-full p-2">
        <MapWrapper />
      </div>
    </div>
  );
}
