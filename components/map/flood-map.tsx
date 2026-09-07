'use client';

import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  getDepthColor,
  getRiskLevelColor,
  classifyRainfallIntensity,
  formatDate,
  RAINFALL_THRESHOLDS
} from '@/lib/utils';
import {
  Search,
  Layers,
  CloudRain,
  Play,
  Pause,
  Route,
  Info,
  Sliders,
  CheckCircle2,
  X,
  RefreshCw,
  Check
} from 'lucide-react';

const customIcon = (color: string) =>
  L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 7px; height: 7px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function FloodMap() {
  const [center, setCenter] = useState<[number, number]>([19.076, 72.8777]);
  const [forecastMinutes, setForecastMinutes] = useState(90);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Judge Demo Simulation Mode
  const [isSimulating, setIsSimulating] = useState(false);

  // Routing State
  const [showRoutingDrawer, setShowRoutingDrawer] = useState(false);
  const [routeResult, setRouteResult] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Layer Control Menu State
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [layers, setLayers] = useState({
    streetRisk: true,
    waterDepth: true,
    rainfall: true,
    drainage: true,
    terrain: true,
    stations: true,
    safeRoute: true,
  });

  // Live Rainfall Layer State
  const [rainfallData, setRainfallData] = useState<{
    mode: 'live' | 'demo';
    updatedAt: string;
    areas: Array<{
      lat: number;
      lng: number;
      rainfallMmPerHour: number;
      category: 'LOW' | 'MODERATE' | 'EXTREME';
      locationName: string;
      timestamp: string;
    }>;
  }>({
    mode: 'demo',
    updatedAt: new Date().toISOString(),
    areas: [],
  });

  const [lastRainFetchTime, setLastRainFetchTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const timelineSteps = [0, 30, 60, 90, 120, 150, 180];

  // Configurable Refresh Interval for Live Rainfall Layer
  const rainRefreshInterval = parseInt(
    process.env.NEXT_PUBLIC_RAIN_REFRESH_INTERVAL || '30000',
    10
  );

  const fetchRainfallData = async () => {
    try {
      const res = await fetch(`/api/rainfall/current?lat=${center[0]}&lng=${center[1]}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.areas) {
        setRainfallData(data);
        setLastRainFetchTime(Date.now());
      }
    } catch (err) {
      console.error('Rainfall layer fetch error:', err);
    }
  };

  // Fetch live rainfall on load & auto-refresh cleanly without flickering map canvas
  useEffect(() => {
    fetchRainfallData();
    const timer = setInterval(() => {
      fetchRainfallData();
    }, rainRefreshInterval);
    return () => clearInterval(timer);
  }, [center]);

  // Second ticker for legend "Last updated: X s ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRainFetchTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRainFetchTime]);

  // Fetch Street Risk GeoJSON when forecastMinutes or center changes
  const fetchStreetGeoJson = async (min: number) => {
    try {
      const res = await fetch(`/api/flood/street-risk?lat=${center[0]}&lng=${center[1]}&forecastMin=${min}`);
      const data = await res.json();
      setGeoJsonData(data);
    } catch (err) {
      console.error('GeoJSON fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStreetGeoJson(forecastMinutes);
  }, [forecastMinutes, center]);

  useEffect(() => {
    fetch('/api/flood/stations')
      .then((res) => res.json())
      .then((d) => setStations(d.stations || []))
      .catch(() => {});

    fetch('/api/alerts')
      .then((res) => res.json())
      .then((d) => setAlerts(d.alerts || []))
      .catch(() => {});
  }, []);

  // Judge Demo Simulation Auto-Play Loop
  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      timer = setInterval(() => {
        setForecastMinutes((prev) => {
          const nextIndex = timelineSteps.indexOf(prev) + 1;
          if (nextIndex >= timelineSteps.length) {
            setIsSimulating(false);
            return 0;
          }
          return timelineSteps[nextIndex];
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isSimulating]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCenter([lat, lng]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleCalculateRoute = async () => {
    setLoadingRoute(true);
    try {
      const res = await fetch('/api/routes/safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: center[0] - 0.02, lng: center[1] - 0.02 },
          destination: { lat: center[0] + 0.02, lng: center[1] + 0.02 },
          forecastMinutes,
        }),
      });
      const data = await res.json();
      setRouteResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-border bg-background">
      {/* Top Floating Header & Controls */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col md:flex-row gap-2 max-w-5xl">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-background/95 backdrop-blur-md border border-border shadow-lg rounded-xl px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search urban street, district, or river basin..."
            className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loadingSearch}
            className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors ml-2"
          >
            {loadingSearch ? 'Locating...' : 'Search'}
          </button>
        </form>

        {/* Map Layer Toggle Menu */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-background/95 backdrop-blur-md border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl shadow transition-colors"
          >
            <Layers className="h-4 w-4 text-brand-600" />
            Map Layers
          </button>

          {showLayerMenu && (
            <div className="absolute top-11 right-0 w-56 bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-2xl z-[500] space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block border-b border-border pb-1">
                Map Layer Overlay Toggles
              </span>
              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                <span className="flex items-center gap-2 font-medium">
                  <CloudRain className="h-3.5 w-3.5 text-blue-500" /> Live Rainfall Layer
                </span>
                <input
                  type="checkbox"
                  checked={layers.rainfall}
                  onChange={(e) => setLayers({ ...layers, rainfall: e.target.checked })}
                  className="rounded accent-brand-600"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                <span className="flex items-center gap-2 font-medium">
                  <Sliders className="h-3.5 w-3.5 text-red-500" /> Street Flood Inundation
                </span>
                <input
                  type="checkbox"
                  checked={layers.streetRisk}
                  onChange={(e) => setLayers({ ...layers, streetRisk: e.target.checked })}
                  className="rounded accent-brand-600"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> River Stations
                </span>
                <input
                  type="checkbox"
                  checked={layers.stations}
                  onChange={(e) => setLayers({ ...layers, stations: e.target.checked })}
                  className="rounded accent-brand-600"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                <span className="flex items-center gap-2 font-medium">
                  <Route className="h-3.5 w-3.5 text-brand-600" /> Safe Route Overlay
                </span>
                <input
                  type="checkbox"
                  checked={layers.safeRoute}
                  onChange={(e) => setLayers({ ...layers, safeRoute: e.target.checked })}
                  className="rounded accent-brand-600"
                />
              </label>
            </div>
          )}
        </div>

        {/* Judge Demo Scenario Launcher */}
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${
            isSimulating
              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isSimulating ? 'SIMULATING 0-3H FLOOD...' : 'START 3-HOUR FLOOD SCENARIO'}
        </button>

        {/* Safe Routing Drawer Toggle */}
        <button
          onClick={() => {
            setShowRoutingDrawer(!showRoutingDrawer);
            if (!routeResult) handleCalculateRoute();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-background/95 backdrop-blur-md border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl shadow transition-colors"
        >
          <Route className="h-4 w-4 text-brand-600" />
          Safe Routing Engine
        </button>
      </div>

      {/* 0–3 HOUR FORECAST TIMELINE SLIDER CONTROL */}
      <div className="absolute bottom-6 left-4 right-4 z-[400] max-w-2xl mx-auto bg-background/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-brand-600" /> 0–3 Hour Flood Nowcast Timeline
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-extrabold text-xs">
              T + {forecastMinutes} MIN
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded">
              DEMO / SIMULATED NOWCAST
            </span>
          </div>
        </div>

        {/* Slider input */}
        <input
          type="range"
          min="0"
          max="180"
          step="30"
          value={forecastMinutes}
          onChange={(e) => setForecastMinutes(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
        />

        {/* Step Labels */}
        <div className="flex justify-between text-[11px] font-bold text-muted-foreground px-1">
          {timelineSteps.map((step) => (
            <button
              key={step}
              onClick={() => setForecastMinutes(step)}
              className={`hover:text-brand-600 transition-colors ${
                forecastMinutes === step ? 'text-brand-600 font-extrabold scale-110' : ''
              }`}
            >
              {step === 0 ? 'NOW' : `${step}m`}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE RAINFALL LEGEND PANEL */}
      {layers.rainfall && (
        <div className="absolute top-20 right-4 z-[400] bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl space-y-2 text-xs hidden sm:block w-52">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="font-extrabold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <CloudRain className="h-3.5 w-3.5 text-blue-500" /> Live Rainfall
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase ${
                rainfallData.mode === 'live'
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
              }`}
            >
              {rainfallData.mode === 'live' ? 'LIVE DATA' : 'DEMO DATA'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10b981]"></span> Green (Low)
              </span>
              <span className="font-bold text-muted-foreground">0–10 mm/h</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> Yellow (Moderate)
              </span>
              <span className="font-bold text-muted-foreground">10–25 mm/h</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span> Red (Extreme)
              </span>
              <span className="font-bold text-muted-foreground">25+ mm/h</span>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground border-t border-border/60 pt-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin-slow" /> Last updated:
            </span>
            <span className="font-extrabold text-foreground">
              {secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`}
            </span>
          </div>
        </div>
      )}

      {/* FLOOD DEPTH LEGEND PANEL */}
      <div className="absolute top-64 right-4 z-[400] bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl space-y-1.5 text-xs hidden md:block w-52">
        <span className="font-extrabold text-foreground block text-[11px] uppercase tracking-wider mb-1">
          Street Flood Depth
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
          <span className="text-muted-foreground text-[11px]">0–5 cm: Green (Low)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
          <span className="text-muted-foreground text-[11px]">5–15 cm: Yellow (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
          <span className="text-muted-foreground text-[11px]">15–30 cm: Orange (High)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
          <span className="text-muted-foreground text-[11px]">30–60 cm: Red (Critical)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#7f1d1d] animate-pulse"></span>
          <span className="text-muted-foreground text-[11px]">60+ cm: Dark Red (Emergency)</span>
        </div>
      </div>

      {/* STREET FORECAST DETAILED DRAWER (OPENED ON STREET CLICK) */}
      {selectedStreet && (
        <div className="absolute top-20 left-4 z-[400] w-full max-w-md bg-background/95 backdrop-blur-md border border-border rounded-2xl p-5 shadow-2xl space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Street Flood Forecast</span>
              <h3 className="font-extrabold text-lg text-foreground">{selectedStreet.streetName}</h3>
            </div>
            <button
              onClick={() => setSelectedStreet(null)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Forecast Summary Pill */}
          <div className={`p-3.5 rounded-xl border ${getDepthColor(selectedStreet.depthCm).bg} ${getDepthColor(selectedStreet.depthCm).hex} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm">{selectedStreet.riskLevel} RISK</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${getDepthColor(selectedStreet.depthCm).badge}`}>
                {selectedStreet.depthCm} cm Depth
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-foreground/80 pt-1">
              <span>Probability: <strong>{(selectedStreet.probability * 100).toFixed(0)}%</strong></span>
              <span>Recommendation: <strong>{selectedStreet.recommendation}</strong></span>
            </div>
          </div>

          {/* Hydrology & Terrain */}
          <div className="p-3 rounded-xl bg-card border border-border space-y-2 text-xs">
            <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider">Hydrology & Terrain</span>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>Rainfall Nowcast: <strong className="text-foreground">{selectedStreet.hydrology?.rainfallMmHr} mm/h</strong></div>
              <div>Surface Runoff: <strong className="text-foreground">{selectedStreet.hydrology?.runoffMmHr} mm/h</strong></div>
              <div>Terrain Elevation: <strong className="text-foreground">{selectedStreet.hydrology?.elevationMeters}m</strong></div>
              <div>Slope: <strong className="text-foreground">{selectedStreet.hydrology?.slopePercent}%</strong></div>
            </div>
          </div>

          {/* Drainage Hydraulics */}
          <div className="p-3 rounded-xl bg-card border border-border space-y-2 text-xs">
            <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider">Drainage Hydraulics (Manning Model)</span>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>Drain Capacity: <strong className="text-foreground">{selectedStreet.drainage?.capacityM3s} m³/s</strong></div>
              <div>Incoming Load: <strong className="text-foreground">{selectedStreet.drainage?.incomingFlowM3s?.toFixed(1)} m³/s</strong></div>
              <div>Utilization: <strong className="text-foreground">{selectedStreet.drainage?.utilizationPercent}%</strong></div>
              <div>Surcharge Status: <strong className={selectedStreet.drainage?.isSurcharged ? 'text-red-500 font-bold' : 'text-emerald-500'}>
                {selectedStreet.drainage?.isSurcharged ? 'SURCHARGED OVERFLOW' : 'NORMAL'}
              </strong></div>
            </div>
          </div>

          {/* Scientific Explanation */}
          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-brand-600" /> Scientific Inundation Reason:
            </span>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              {selectedStreet.scientificExplanation}
            </p>
          </div>
        </div>
      )}

      {/* SAFE ROUTING DRAWER */}
      {showRoutingDrawer && (
        <div className="absolute top-20 left-4 z-[400] w-full max-w-md bg-background/95 backdrop-blur-md border border-border rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Route className="h-5 w-5 text-brand-600" /> Safe Routing Engine
            </h3>
            <button onClick={() => setShowRoutingDrawer(false)} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadingRoute ? (
            <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
              Computing flood-penalized shortest path algorithms...
            </div>
          ) : routeResult ? (
            <div className="space-y-3">
              {/* Safest Route Option */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> {routeResult.safestRoute.title}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                    RECOMMENDED
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Distance: <strong>{routeResult.safestRoute.distanceKm} km</strong></span>
                  <span>Est Time: <strong>{routeResult.safestRoute.durationMin} min</strong></span>
                  <span>Max Depth: <strong className="text-emerald-600">{routeResult.safestRoute.maxFloodDepthCm} cm</strong></span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {routeResult.safestRoute.recommendation}
                </p>
              </div>

              {/* Fastest Route Option */}
              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{routeResult.fastestRoute.title}</span>
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">
                    DIRECT
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Distance: <strong>{routeResult.fastestRoute.distanceKm} km</strong></span>
                  <span>Est Time: <strong>{routeResult.fastestRoute.durationMin} min</strong></span>
                  <span>Max Depth: <strong className="text-red-500">{routeResult.fastestRoute.maxFloodDepthCm} cm</strong></span>
                </div>
                <p className="text-[11px] text-amber-600 font-medium">
                  {routeResult.fastestRoute.recommendation}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* LEAFLET MAP CANVAS */}
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={center} />

        {/* LIVE RAINFALL ALERT LAYER OVERLAY */}
        {layers.rainfall &&
          rainfallData.areas?.map((area, idx) => {
            const classification = classifyRainfallIntensity(area.rainfallMmPerHour);
            return (
              <Circle
                key={`rain-${idx}-${area.lat}-${area.lng}`}
                center={[area.lat, area.lng]}
                radius={1300}
                pathOptions={{
                  color: classification.hex,
                  fillColor: classification.hex,
                  fillOpacity: 0.35,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-2 space-y-2 text-xs min-w-[210px]">
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <span className="font-extrabold text-foreground flex items-center gap-1.5 text-xs">
                        <CloudRain className="h-4 w-4 text-blue-500" /> Live Rainfall Alert
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${classification.badgeClass}`}>
                        {classification.category}
                      </span>
                    </div>

                    <div className="space-y-1 text-muted-foreground text-[11px]">
                      <div>Location: <strong className="text-foreground">{area.locationName}</strong></div>
                      <div>Coordinates: <strong className="text-foreground">{area.lat.toFixed(4)}, {area.lng.toFixed(4)}</strong></div>
                      <div>Rainfall Rate: <strong className={`font-extrabold ${classification.textClass}`}>{area.rainfallMmPerHour} mm/hr</strong></div>
                      <div>Intensity Level: <strong className="text-foreground">{classification.label} ({classification.rangeLabel})</strong></div>
                      <div>Last updated: <strong className="text-foreground">{formatDate(area.timestamp)}</strong></div>
                    </div>

                    <div className="pt-1 border-t border-border/60 text-[10px] text-brand-600 dark:text-brand-400 font-medium italic">
                      This rainfall is contributing to flood-risk calculations.
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

        {/* STREET-LEVEL RISK POLYLINES */}
        {layers.streetRisk &&
          geoJsonData?.features?.map((feature: any, idx: number) => {
            const props = feature.properties;
            const colors = getDepthColor(props.depthCm);
            const latLngs: [number, number][] = feature.geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]]
            );

            return (
              <React.Fragment key={idx}>
                <Polyline
                  positions={latLngs}
                  pathOptions={{
                    color: colors.hex,
                    weight: 8,
                    opacity: 0.85,
                  }}
                  eventHandlers={{
                    click: () => setSelectedStreet(props),
                  }}
                />

                {/* Depth Circle Hotspot */}
                {props.depthCm > 5.0 && (
                  <Circle
                    center={latLngs[Math.floor(latLngs.length / 2)]}
                    radius={300}
                    pathOptions={{ color: colors.hex, fillColor: colors.hex, fillOpacity: 0.4 }}
                  />
                )}
              </React.Fragment>
            );
          })}

        {/* SAFE ROUTE POLYLINES */}
        {layers.safeRoute && routeResult && (
          <>
            <Polyline
              positions={routeResult.safestRoute.coordinates}
              pathOptions={{ color: '#10b981', weight: 6, dashArray: '10, 10' }}
            />
            <Polyline
              positions={routeResult.fastestRoute.coordinates}
              pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.5 }}
            />
          </>
        )}

        {/* RIVER MONITORING STATIONS */}
        {layers.stations &&
          stations.map((stn) => (
            <Marker
              key={stn.id}
              position={[stn.latitude, stn.longitude]}
              icon={customIcon(stn.status === 'CRITICAL' ? '#ef4444' : '#10b981')}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <span className="font-bold text-sm block">{stn.name}</span>
                  <p>Water Level: <strong>{stn.waterLevel}m</strong></p>
                  <p>Warning Limit: <strong>{stn.warningLevel}m</strong></p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
