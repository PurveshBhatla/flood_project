'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MapWrapper from '@/components/map/map-wrapper';
import { RiskTrendChart } from '@/components/charts/risk-trend-chart';
import { getRiskLevelColor } from '@/lib/utils';
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
  Database
} from 'lucide-react';

import RainfallGlobe from '@/components/3d/rainfall-globe';
import RescueResourcesCard from '@/components/dashboard/rescue-resources-card';
import RainfallForecastCard from '@/components/dashboard/rainfall-forecast-card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  const riskColors = prediction ? getRiskLevelColor(prediction.riskLevel) : getRiskLevelColor('LOW');

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Welcome back, {user.name}</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-600" />
            Monitored: <span className="text-foreground">{selectedLocation?.name || 'Loading Location...'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {locations.length > 0 && (
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
        <div className={`p-6 rounded-2xl border ${riskColors.border} ${riskColors.bg} space-y-4 shadow-sm md:col-span-2 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-600" /> SIH26085 Flood Risk Index & Nowcast
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskColors.badge}`}>
              {prediction?.riskLevel || 'LOW'} RISK
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className={`text-5xl font-extrabold ${riskColors.text}`}>
              {prediction?.riskScore ?? '--'}/100
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Probability: {((prediction?.probability ?? 0) * 100).toFixed(0)}% (Lead Time: 0–3 Hours)
            </span>
          </div>

          <p className="text-xs text-foreground font-medium leading-relaxed bg-background/60 p-3 rounded-xl border border-border">
            💡 <strong>AI Recommendation:</strong> {prediction?.recommendation || 'Continuous monitoring active.'}
          </p>
        </div>

        {/* Max Depth Widget */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Max Street Depth</span>
            <Droplets className="h-4 w-4 text-brand-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {prediction?.predictedDepthCm ?? 34.0} <span className="text-sm font-normal text-muted-foreground">cm</span>
          </div>
          <p className="text-xs text-muted-foreground">Flooded Streets: <strong>18 segments</strong></p>
        </div>

        {/* Drainage Load Widget */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Drainage Utilization</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            144.0%
          </div>
          <div className="text-xs text-red-500 font-bold">
            Status: SURCHARGED OVERFLOW
          </div>
        </div>
      </div>

      {/* RESCUE RESOURCES AVAILABLE DASHBOARD FEATURE */}
      <RescueResourcesCard data={resourceData} />

      {/* RAINFALL FORECAST & EARLY RAIN ALERT FEATURE */}
      <RainfallForecastCard
        forecast={weather?.forecast}
        locationName={selectedLocation?.name}
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
                {alerts.length} Active
              </span>
            </div>

            <div className="h-[380px] w-full rounded-xl overflow-hidden border border-border">
              <MapWrapper />
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
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
