import React from 'react';
import Link from 'next/link';
import {
  Waves,
  Droplets,
  Cpu,
  Layers,
  Activity,
  MapPin,
  Route,
  Bell,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Database,
  Radio,
  FileCode2
} from 'lucide-react';

export default function SihDemoPage() {
  return (
    <div className="py-16 space-y-16">
      {/* Header */}
      <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider">
          <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
          SIH26085 Scientific Architecture
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">How FloodVision Solves SIH26085</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          End-to-end breakdown of the physics-guided hydrological nowcasting, Manning hydraulics, surface water routing, GIS street-level depth prediction, and flood-safe routing engine.
        </p>
      </div>

      {/* Interactive Pipeline Steps */}
      <div className="container mx-auto px-4 md:px-8 max-w-5xl space-y-6">
        {/* Step 1 */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-extrabold text-xl shrink-0">
            1
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Rainfall Radar & 0–3 Hour Nowcast</h3>
              <span className="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-600 text-xs font-semibold">
                RainfallNowcastService
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ingests precipitation data from radar / Open-Meteo REST APIs and generates a 0–3 hour precipitation timeline forecast across 30-minute intervals (<code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">T=0, 30, 60, 90, 120, 150, 180 min</code>).
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-extrabold text-xl shrink-0">
            2
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Terrain DEM & Slope Topography</h3>
              <span className="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-600 text-xs font-semibold">
                TerrainService
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Evaluates Digital Elevation Model (DEM) grids, calculating slope percentages, downhill flow vectors, and identifying low-elevation sink depressions where standing water accumulates.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-extrabold text-xl shrink-0">
            3
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Surface Runoff Coefficients</h3>
              <span className="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-600 text-xs font-semibold">
                RunoffService
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Assigns land surface runoff coefficients: Road (<code className="bg-muted px-1.5 py-0.5 rounded">C=0.85</code>), Concrete (<code className="bg-muted px-1.5 py-0.5 rounded">C=0.92</code>), Soil (<code className="bg-muted px-1.5 py-0.5 rounded">C=0.45</code>), and Park (<code className="bg-muted px-1.5 py-0.5 rounded">C=0.25</code>) to calculate gross effective surface runoff.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-extrabold text-xl shrink-0">
            4
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Drainage Hydraulics & Manning Equation</h3>
              <span className="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-600 text-xs font-semibold">
                HydraulicService
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Models drainage network conduits using Manning's equation (<code className="bg-muted px-1.5 py-0.5 rounded">Q = (1/n) A R^(2/3) S^(1/2)</code>). When incoming surface runoff exceeds 100% pipe capacity, overloaded conduits surcharge and spill excess volume back onto connecting streets.
            </p>
          </div>
        </div>

        {/* Step 5 */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-extrabold text-xl shrink-0">
            5
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Surface Water Routing & Street Depth Prediction</h3>
              <span className="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-600 text-xs font-semibold">
                SurfaceWaterRoutingService
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Simulates 2D surface accumulation, mapping predicted street water depth (cm) and risk categories: Green (0–5 cm), Yellow (5–15 cm), Orange (15–30 cm), Red (30–60 cm), Dark Red (60+ cm).
            </p>
          </div>
        </div>

        {/* Step 6 */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-extrabold text-xl shrink-0">
            6
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">GIS Visualization & Flood-Safe Routing</h3>
              <span className="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-600 text-xs font-semibold">
                SafeRoutingService
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Renders color-coded street layers on Leaflet GIS maps and computes optimal **Fastest vs Safest Route** options by penalizing flooded road segments with depths over 15 cm.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button to Map Command Center */}
      <div className="text-center pt-4">
        <Link
          href="/map"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
        >
          Launch Interactive GIS Command Center <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
