'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MapWrapper from '@/components/map/map-wrapper';
import { RiskTrendChart } from '@/components/charts/risk-trend-chart';
import { getRiskLevelColor } from '@/lib/utils';
import { useFloodSimulation } from '@/lib/hooks/use-flood-simulation';
import { useCitizenReports } from '@/lib/context/citizen-report-context';
import {
  Waves,
  MapPin,
  ShieldAlert,
  Droplets,
  Thermometer,
  Wind,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  Activity,
  ArrowUpRight,
  Route,
  Database,
  Flame,
  Radio,
  RotateCcw,
  Zap,
  Sliders,
  Megaphone
} from 'lucide-react';

import RainfallGlobe from '@/components/3d/rainfall-globe';
import RescueResourcesCard from '@/components/dashboard/rescue-resources-card';
import RainfallForecastCard from '@/components/dashboard/rainfall-forecast-card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDemoActive, demoData, toggleDemoMode, resetToLive } = useFloodSimulation();
  const { openReportModal } = useCitizenReports();


  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rainfallData, setRainfallData] = useState<any>(null);
  const [resourceData, setResourceData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      // Fetch Live Rainfall for 3D Globe Monitor
      const rainRes = await fetch('/api/rainfall/current');
      if (rainRes.ok) {
        const rainJson = await rainRes.json();
        setRainfallData(rainJson);
      }

      // Fetch Available Rescue Resources Summary
      const resRes = await fetch('/api/resources/available');
      if (resRes.ok) {
        const resJson = await resRes.json();
        setResourceData(resJson);
      }

      const locRes = await fetch('/api/locations');
      const locData = await locRes.json();
      const locList = locData.locations || [];
      setLocations(locList);

      const activeLoc = locList.find((l: any) => l.isHome) || locList[0] || {
        id: 'default',
        name: 'Mithi River Basin, Mumbai',
        latitude: 19.076,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
      };

      setSelectedLocation(activeLoc);

      const riskRes = await fetch(`/api/flood/risk?lat=${activeLoc.latitude}&lng=${activeLoc.longitude}`);
      const riskData = await riskRes.json();

      setWeather(riskData.weather);
      setPrediction(riskData.prediction);

      const alertRes = await fetch('/api/alerts');
      const alertData = await alertRes.json();
      setAlerts(alertData.alerts || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleSelectLocation = async (loc: any) => {
    setSelectedLocation(loc);
    setLoadingData(true);
    try {
      const riskRes = await fetch(`/api/flood/risk?lat=${loc.latitude}&lng=${loc.longitude}`);
      const riskData = await riskRes.json();
      setWeather(riskData.weather);
      setPrediction(riskData.prediction);
    } finally {
      setLoadingData(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-brand-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Authenticating FloodVision Dashboard...</p>
        </div>
      </div>
    );
  }

  // Active state merged with Demo Simulation state if active
  const activeLocationObj = isDemoActive
    ? demoData!.selectedLocation
    : selectedLocation;

  const activePrediction = isDemoActive
    ? demoData!.prediction
    : prediction;

  const activeTelemetry = isDemoActive
    ? demoData!.telemetry
    : {
        drainageUtilization: 144.0,
        drainageStatus: 'SURCHARGED OVERFLOW',
        rainfallMmHr: weather?.rainfall || 12.4,
        soilSaturationPercent: 78,
        waterSensorLevelMeter: 0.8,
        temperature: weather?.temperature || 24.5,
        humidity: weather?.humidity || 75,
        windSpeed: weather?.windSpeed || 14.2,
      };

  const activeForecast = isDemoActive
    ? demoData!.forecast
    : weather?.forecast;

  const activeRiskColors = isDemoActive
    ? {
        bg: 'bg-red-500/10',
        text: 'text-red-600 dark:text-red-400 font-extrabold',
        border: 'border-red-600 border-2 shadow-[0_0_25px_rgba(239,68,68,0.45)] animate-pulse',
        badge: 'bg-red-600 text-white font-extrabold shadow-lg',
        hex: '#ef4444',
      }
    : activePrediction
    ? getRiskLevelColor(activePrediction.riskLevel)
    : getRiskLevelColor('LOW');

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* ⚡ SIMULATION / DEMO MODE TOGGLE HEADER BANNER */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
              isDemoActive ? 'bg-red-600 text-white animate-pulse' : 'bg-brand-600 text-white'
            }`}
          >
            {isDemoActive ? <Flame className="h-6 w-6" /> : <Radio className="h-6 w-6" />}
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              SIH 2026 Telemetry Control Panel
            </span>
            <h2 className="font-extrabold text-base flex items-center gap-2">
              Mode:{' '}
              <span className={isDemoActive ? 'text-red-400 font-black' : 'text-emerald-400 font-extrabold'}>
                {isDemoActive ? 'Demo Simulation (+2h High Flood Alert)' : 'Live Telemetry Stream'}
              </span>
            </h2>
          </div>
        </div>

        {/* Toggle Mode Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDemoMode}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
              isDemoActive
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-400/50'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
            }`}
          >
            <Zap className="h-4 w-4" />
            {isDemoActive ? 'SIMULATION ACTIVE (+2H)' : 'TRIGGER DEMO HIGH FLOOD (+2H)'}
          </button>

          {isDemoActive && (
            <button
              onClick={resetToLive}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to Live
            </button>
          )}
        </div>
      </div>

      {/* PERSISTENT DEMO ALERT BANNER (WHEN DEMO MODE IS ACTIVE) */}
      {isDemoActive && (
        <div className="p-4 rounded-2xl bg-red-600 text-white border-2 border-red-400 shadow-2xl space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/40 border border-white/20 tracking-wider">
              ● DEMO MODE: Simulated Severe Nowcast (+2 Hours)
            </span>
            <button
              onClick={resetToLive}
              className="text-xs text-white/90 hover:text-white font-bold underline flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Switch back to Live Telemetry
            </button>
          </div>
          <div className="text-sm font-extrabold leading-snug">
            {activePrediction?.nowcastBannerText ||
              '⚠️ CRITICAL NOWCAST (+2h): Inundation expected in 45-90 mins due to 68mm/hr localized cloudburst exceeding drainage throughput by 135%.'}
          </div>
          <div className="text-xs font-medium text-white/90 pt-1 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
            <span>
              Target Zone: <strong>{activeLocationObj?.name}</strong> ({activeLocationObj?.ward})
            </span>
            <Link
              href="/emergency"
              className="px-3 py-1 bg-white text-red-700 hover:bg-slate-100 rounded-lg text-xs font-black transition-colors shadow"
            >
              🚨 Open Emergency AI & SOS Protocol
            </Link>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Welcome back, {user.name}</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-600" />
            Monitored:{' '}
            <span className="text-foreground">
              {activeLocationObj?.name || 'Loading Location...'}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isDemoActive && locations.length > 0 && (
            <select
              value={selectedLocation?.id}
              onChange={(e) => {
                const found = locations.find((l) => l.id === e.target.value);
                if (found) handleSelectLocation(found);
              }}
              className="bg-background border border-input text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.isHome ? '(Home)' : ''}
                </option>
              ))}
            </select>
          )}

          {isDemoActive && (
            <span className="px-3 py-2 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-black uppercase">
              WARD DEMO LOCK ACTIVE
            </span>
          )}

          <button
            onClick={openReportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer animate-pulse"
          >
            <Megaphone className="h-4 w-4 text-slate-950" /> 📢 Report Flood (Citizen Desk)
          </button>

          <Link
            href="/dashboard/locations"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Locations
          </Link>
        </div>
      </div>

      {/* 3D ROTATING EARTH WITH LIVE RAINFALL ZONES */}
      <RainfallGlobe rainfallData={rainfallData} />

      {/* SIH26085 KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Risk Gauge */}
        <div className={`p-6 rounded-2xl border ${activeRiskColors.border} ${activeRiskColors.bg} space-y-4 shadow-sm md:col-span-2 relative overflow-hidden transition-all`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-600" /> SIH26085 Flood Risk Index & Nowcast
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${activeRiskColors.badge}`}>
              {isDemoActive ? '94 / 100 — CRITICAL RED ALERT' : `${activePrediction?.riskLevel || 'LOW'} RISK`}
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className={`text-3xl md:text-5xl font-black ${activeRiskColors.text}`}>
              {isDemoActive ? '94 / 100 — CRITICAL RED ALERT' : `${activePrediction?.riskScore ?? '--'}/100`}
            </span>
            <span className="text-xs text-muted-foreground font-medium block">
              Probability: {((activePrediction?.probability ?? 0) * 100).toFixed(0)}% (Lead Time: 0–3 Hours)
            </span>
          </div>

          <p className="text-xs text-foreground font-medium leading-relaxed bg-background/60 p-3 rounded-xl border border-border">
            💡 <strong>AI Recommendation:</strong> {activePrediction?.recommendation || 'Continuous monitoring active.'}
          </p>
        </div>

        {/* Max Depth Widget */}
        <div className={`p-6 rounded-2xl border space-y-3 shadow-sm ${isDemoActive ? 'bg-red-500/10 border-red-500/40 ring-2 ring-red-500/30' : 'bg-card border-border'}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Inundation</span>
            <Droplets className="h-4 w-4 text-brand-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {isDemoActive ? '0.65m - 0.90m' : `${activePrediction?.predictedDepthCm ?? 34.0} cm`}
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            {isDemoActive
              ? '0.65m - 0.90m Depth Predicted in 45-75 mins'
              : `Est. Water Depth: 0.45m – 0.75m (${activePrediction?.floodedStreetsCount || 18} segments)`}
          </p>
        </div>

        {/* Drainage Load Widget */}
        <div className={`p-6 rounded-2xl border space-y-3 shadow-sm ${isDemoActive ? 'bg-red-500/10 border-red-500/40 ring-2 ring-red-500/30' : 'bg-card border-border'}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Drainage Utilization</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {isDemoActive ? '142%' : `${activeTelemetry.drainageUtilization.toFixed(1)}%`}
          </div>
          <div className="text-xs text-red-500 font-extrabold">
            Status: {isDemoActive ? '142% Overcapacity (Drain Blockage / Surcharge)' : activeTelemetry.drainageStatus}
          </div>
        </div>
      </div>

      {/* ADDITIONAL TELEMETRY METRICS GRID (SOIL MOISTURE, SENSOR LEVEL, CLOUDBURST) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className={`p-4 rounded-xl border space-y-1 shadow-sm ${isDemoActive ? 'bg-red-500/10 border-red-500/40' : 'bg-card border-border'}`}>
          <span className="text-muted-foreground font-semibold block text-[11px] uppercase">Rainfall Intensity</span>
          <strong className="text-base font-extrabold text-red-600 dark:text-red-400 block">
            {isDemoActive ? '78.4 mm/hr (Cloudburst Warning)' : `${activeTelemetry.rainfallMmHr} mm/hr`}
          </strong>
          <span className="text-[10px] text-muted-foreground">Open-Meteo Telemetry</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-1 shadow-sm">
          <span className="text-muted-foreground font-semibold block text-[11px] uppercase">Soil Saturation</span>
          <strong className="text-lg font-extrabold text-amber-500 block">
            {activeTelemetry.soilSaturationPercent}%
          </strong>
          <span className="text-[10px] text-muted-foreground">Near Saturation Point</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-1 shadow-sm">
          <span className="text-muted-foreground font-semibold block text-[11px] uppercase">Sensor Level</span>
          <strong className="text-lg font-extrabold text-red-500 block">
            +{activeTelemetry.waterSensorLevelMeter}m
          </strong>
          <span className="text-[10px] text-muted-foreground">Above Baseline Limit</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-1 shadow-sm">
          <span className="text-muted-foreground font-semibold block text-[11px] uppercase">Temp & Wind</span>
          <strong className="text-lg font-extrabold text-foreground block">
            {activeTelemetry.temperature}°C / {activeTelemetry.windSpeed} km/h
          </strong>
          <span className="text-[10px] text-muted-foreground">Humidity {activeTelemetry.humidity}%</span>
        </div>
      </div>

      {/* RESCUE RESOURCES AVAILABLE DASHBOARD FEATURE */}
      <RescueResourcesCard data={resourceData} />

      {/* RAINFALL FORECAST & EARLY RAIN ALERT FEATURE */}
      <RainfallForecastCard
        forecast={activeForecast}
        locationName={activeLocationObj?.name}
      />

      {/* Middle Row: Recharts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">24-Hour Hydrological Forecast & Depth Trend</h3>
              <p className="text-xs text-muted-foreground">Coupled Manning Hydraulics & Surface Runoff Curve</p>
            </div>
            <span className="text-xs text-brand-600 font-medium">Recharts Analytics</span>
          </div>

          <RiskTrendChart />
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" /> Emergency Alerts
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
                {isDemoActive ? '1 CRITICAL DEMO' : `${alerts.length} Active`}
              </span>
            </div>

            <div className="h-[380px] w-full rounded-xl overflow-hidden border border-border">
              <MapWrapper />
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {isDemoActive ? (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-red-600 dark:text-red-400">
                      RED ALERT: Zone 4 Railway Underpass
                    </span>
                    <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                      CRITICAL
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Severe cloudburst nowcast (+2h). Drainage overflow at 135%. Avoid Underpass. Evacuation Route A-2 active.
                  </p>
                </div>
              ) : alerts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No active flood alerts.</p>
              ) : (
                alerts.map((alt) => (
                  <div key={alt.id} className="p-3 rounded-xl bg-muted/50 border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-red-600 dark:text-red-400">{alt.title}</span>
                      <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{alt.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/map"
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors mt-2 shadow"
          >
            Launch GIS Command Center & Safe Routing <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
