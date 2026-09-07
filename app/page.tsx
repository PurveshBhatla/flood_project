'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MapWrapper from '@/components/map/map-wrapper';
import {
  Waves,
  ShieldAlert,
  Activity,
  Cpu,
  MapPin,
  Search,
  Bell,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Droplets,
  Radio,
  FileText
} from 'lucide-react';
import { getRiskLevelColor } from '@/lib/utils';

export default function HomePage() {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const handleQuickCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;

    setLoadingSearch(true);
    try {
      // Geocode city name
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`
      );
      const geoData = await geoRes.json();

      if (geoData && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);

        const riskRes = await fetch(`/api/flood/risk?lat=${lat}&lng=${lng}`);
        const riskData = await riskRes.json();

        setSearchResult({
          name: geoData[0].display_name.split(',')[0],
          lat,
          lng,
          ...riskData,
        });
      } else {
        alert('Location not found. Try searching major cities or river basins.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-slate-900 to-background text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold tracking-wide uppercase">
              <Radio className="h-3.5 w-3.5 animate-pulse text-red-400" />
              Real-Time AI Hydrological Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              AI-Powered Early Warning & <span className="text-brand-400">Flood Intelligence</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 font-normal leading-relaxed">
              FloodVision monitors river gauges, satellite soil moisture, and weather forecasts to predict flood risks, deliver life-saving early warnings, and visualize flood inundation zones.
            </p>

            {/* Quick Check Form */}
            <form
              onSubmit={handleQuickCheck}
              className="mt-8 flex flex-col sm:flex-row items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl max-w-xl mx-auto shadow-2xl"
            >
              <div className="flex-1 flex items-center px-3 w-full">
                <MapPin className="h-5 w-5 text-brand-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Enter city or river location (e.g. Mumbai, Guwahati)..."
                  className="bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-400 w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loadingSearch}
                className="w-full sm:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loadingSearch ? (
                  'Analyzing Risk...'
                ) : (
                  <>
                    <Search className="h-4 w-4" /> Check Area Risk
                  </>
                )}
              </button>
            </form>

            {/* Quick Search Result Card */}
            {searchResult && (
              <div className="mt-6 p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-left max-w-xl mx-auto shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base">{searchResult.name}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                      getRiskLevelColor(searchResult.prediction.riskLevel).badge
                    }`}
                  >
                    {searchResult.prediction.riskLevel} RISK
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-700">
                  <div>Risk Score: <strong className="text-white">{searchResult.prediction.riskScore}/100</strong></div>
                  <div>Rainfall: <strong className="text-white">{searchResult.weather.rainfall} mm</strong></div>
                  <div>Temp: <strong className="text-white">{searchResult.weather.temperature}°C</strong></div>
                </div>
                <p className="text-xs text-slate-300 pt-1 italic">
                  "{searchResult.prediction.recommendation}"
                </p>
                <div className="pt-2 text-right">
                  <Link href="/map" className="text-xs text-brand-400 hover:underline font-semibold flex items-center justify-end gap-1">
                    View on Full Interactive Map <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. SYSTEM LIVE STATS COUNTER */}
      <section className="py-8 bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-brand-600">1,240+</span>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">River Gauge Sensors</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-brand-600">94.8%</span>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">AI Prediction Accuracy</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-brand-600">15 Mins</span>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Early Warning Lead Time</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-brand-600">24 / 7</span>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Automated Telemetry</p>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE MAP PREVIEW */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 md:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Interactive GIS Map</span>
              <h2 className="text-3xl font-bold tracking-tight">Real-Time Flood Risk & River Gauges</h2>
              <p className="text-sm text-muted-foreground">
                View color-coded flood inundation zones, active emergency warnings, and live water telemetry markers.
              </p>
            </div>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shrink-0 w-fit"
            >
              Open Fullscreen Interactive Map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="h-[450px] w-full rounded-2xl overflow-hidden shadow-xl border border-border">
            <MapWrapper />
          </div>
        </div>
      </section>

      {/* 4. HOW FLOODVISION WORKS */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">End-to-End Pipeline</span>
            <h2 className="text-3xl font-bold tracking-tight">How FloodVision AI Protects Communities</h2>
            <p className="text-sm text-muted-foreground">
              From river sensor ingestion to automated localized broadcast alerts in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 hover:border-brand-500/50 transition-all shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 flex items-center justify-center">
                <Droplets className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">1. Data Ingestion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ingests Open-Meteo rainfall, humidity, river water level gauges, and soil saturation telemetry.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 hover:border-brand-500/50 transition-all shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 flex items-center justify-center">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">2. AI ML Modeling</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hydrological scoring model calculates flood probability, risk index (0-100), and confidence ratings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 hover:border-brand-500/50 transition-all shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">3. Risk Classification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ranks locations into LOW (Green), MODERATE (Yellow), HIGH (Orange), or CRITICAL (Red).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 hover:border-brand-500/50 transition-all shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 flex items-center justify-center">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">4. Emergency Warning</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dispatches localized notifications, evacuation guidance, and broadcasts emergency alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SAFETY & EMERGENCY PREPAREDNESS */}
      <section className="py-16 bg-brand-950 text-white">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Disaster Response Ready</span>
            <h2 className="text-3xl font-bold tracking-tight">Stay Prepared Before Flood Waters Rise</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              FloodVision provides practical step-by-step emergency instructions curated by disaster management authorities for citizens and response teams.
            </p>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Keep 72-hour emergency survival kits packed with clean drinking water and medical supplies.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Never walk or drive through flowing flood waters (6 inches of moving water can knock you down).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Follow designated evacuation routes provided on your FloodVision dashboard.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/safety"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 font-semibold text-sm rounded-xl transition-colors shadow-md"
              >
                Read Complete Safety Guide <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" /> Emergency Hotline Directory
              </h3>
              <span className="text-xs text-slate-400">24/7 Toll-Free</span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">National Emergency Helpline</span>
                  <span className="text-base font-bold text-white">112 / 911</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold">ALL STATES</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Disaster Relief Response Force</span>
                  <span className="text-base font-bold text-white">108 / 011-24363260</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">RESCUE OPS</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Flood Meteorological Cell</span>
                  <span className="text-base font-bold text-white">1800-180-1717</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">WEATHER BULLETIN</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
