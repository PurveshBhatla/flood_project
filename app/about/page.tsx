import React from 'react';
import { Waves, Shield, Cpu, Database, Activity, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-16 space-y-16">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">About FloodVision</span>
        <h1 className="text-4xl font-extrabold tracking-tight">Mission & Technology Architecture</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          FloodVision is an advanced environmental intelligence platform engineered to mitigate climate disaster risks by delivering AI-driven flood predictions, real-time river gauge monitoring, and emergency response tools.
        </p>
      </div>

      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <Target className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold">The Problem</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Flash floods and monsoon inundations cause severe loss of life and billions in property damage due to delayed alerts and unintegrated river data streams.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold">The Solution</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            FloodVision unifies satellite precipitation data, river gauge telemetry, and machine learning scoring models to issue early warnings up to 24 hours in advance.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold">Community Protection</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Empowers residents and emergency managers with interactive GIS heatmaps, customizable location alerts, and automated multi-channel emergency broadcasts.
          </p>
        </div>
      </div>
    </div>
  );
}
