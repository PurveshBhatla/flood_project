import React from 'react';
import { Database, Cpu, Activity, MapPin, Bell, Layers } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="py-16 space-y-16">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Hydrological Intelligence Pipeline</span>
        <h1 className="text-4xl font-extrabold tracking-tight">How FloodVision Generates Predictions</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Detailed architectural breakdown of the 6-stage telemetry processing, AI model evaluation, and early warning dispatch pipeline.
        </p>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-4xl space-y-8">
        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0 font-bold">1</div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Data Harvesting & Telemetry Collection</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fetches real-time precipitation, temperature, wind speed, and humidity via Open-Meteo REST APIs while polling river gauge telemetry sensors for water levels (meters).
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0 font-bold">2</div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">FastAPI Microservice ML Modeling</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sends telemetry vectors to the Python FastAPI microservice (`/ml-service/predict`). Evaluates a physics-guided weighted hydrological equation combining water level, rain volume, rain intensity, soil moisture, and historical risk index.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0 font-bold">3</div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Risk Scoring & Classification</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Produces a risk score (0-100), probability decimal, and risk category: LOW (0-34), MODERATE (35-54), HIGH (55-74), or CRITICAL (75-100).
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0 font-bold">4</div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">GIS Map Inundation Overlay</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Updates Leaflet map overlays with color-coded risk circles, monitoring station status pins, and active warning perimeters.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0 font-bold">5</div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Automated Notification Dispatch</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Triggers in-app alerts and Server-Sent Events (SSE) stream messages to all users monitoring affected location radii.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
