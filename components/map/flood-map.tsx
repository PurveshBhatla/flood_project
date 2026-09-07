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
  MapPin,
  Flame,
  AlertTriangle,
  ChevronRight,
  ShieldAlert
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

function MapRecenter({ center, zoom = 6 }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function FloodMap() {
  // Default to India-wide view
  const [center, setCenter] = useState<[number, number]>([22.5937, 78.9629]);
  const [zoomLevel, setZoomLevel] = useState<number>(5);
  const [forecastMinutes, setForecastMinutes] = useState(90);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedRainfallArea, setSelectedRainfallArea] = useState<any>(null);
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

  // Hotspots Drawer State
  const [showHotspotPanel, setShowHotspotPanel] = useState(true);

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

  // India-Wide Live Rainfall Layer State
  const [rainfallData, setRainfallData] = useState<{
    mode: 'live' | 'demo';
    updatedAt: string;
    cells: Array<{
      id: string;
      lat: number;
      lng: number;
      rainfallMmPerHour: number;
      category: 'LOW' | 'MODERATE' | 'HEAVY' | 'EXTREME';
      color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
      region: string;
      state: string;
      locationName: string;
      timestamp: string;
    }>;
    hotspots: Array<{
      id: string;
      name: string;
      state: string;
      lat: number;
      lng: number;
      rainfallMmPerHour: number;
      category: 'LOW' | 'MODERATE' | 'HEAVY' | 'EXTREME';
      color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
      severity: 'HEAVY' | 'EXTREME';
      timestamp: string;
    }>;
    hasHeavyRainfall: boolean;
  }>({
    mode: 'demo',
    updatedAt: new Date().toISOString(),
    cells: [],
    hotspots: [],
    hasHeavyRainfall: false,
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
      const res = await fetch(`/api/rainfall/current`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.cells) {
        setRainfallData(data);
        setLastRainFetchTime(Date.now());
      }
    } catch (err) {
      console.error('Rainfall layer fetch error:', err);
    }
  };

  useEffect(() => {
    fetchRainfallData();
    const timer = setInterval(() => {
      fetchRainfallData();
    }, rainRefreshInterval);
    return () => clearInterval(timer);
  }, []);

  // Second ticker for legend "Last updated: X s ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRainFetchTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRainFetchTime]);

  // Fetch Street Risk GeoJSON when forecastMinutes or center changes
  const fetchStreetGeoJson = async (lat: number, lng: number, min: number) => {
    try {
      const res = await fetch(`/api/flood/street-risk?lat=${lat}&lng=${lng}&forecastMin=${min}`);
      const data = await res.json();
      setGeoJsonData(data);
    } catch (err) {
      console.error('GeoJSON fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStreetGeoJson(center[0], center[1], forecastMinutes);
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCenter([lat, lng]);
        setZoomLevel(11);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleFocusHotspot = (spot: any) => {
    setCenter([spot.lat, spot.lng]);
    setZoomLevel(11);
    setSelectedRainfallArea(spot);
    fetchStreetGeoJson(spot.lat, spot.lng, forecastMinutes);
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
            placeholder="Search any Indian state, district, or city (e.g. Guwahati, Wayanad, Mumbai, Odisha)..."
            className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loadingSearch}
            className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors ml-2 shrink-0"
          >
            {loadingSearch ? 'Locating...' : 'Search'}
          </button>
        </form>

        {/* Map Reset View to India Overview */}
        <button
          onClick={() => {
            setCenter([22.5937, 78.9629]);
            setZoomLevel(5);
            setSelectedRainfallArea(null);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-background/95 backdrop-blur-md border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl shadow transition-colors"
        >
          <MapPin className="h-4 w-4 text-emerald-500" />
          India Overview
        </button>

        {/* Map Layer Toggle Menu */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-background/95 backdrop-blur-md border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl shadow transition-colors"
          >
            <Layers className="h-4 w-4 text-brand-600" />
            Layers
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
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-md shrink-0 ${
            isSimulating
              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isSimulating ? 'SIMULATING 0-3H FLOOD...' : 'SIMULATE FLOOD NOWCAST'}
        </button>
      </div>

      {/* 🔴 LIVE RAINFALL HOTSPOTS DRAWER PANEL (FLOATING TOP-LEFT) */}
      <div className="absolute top-16 left-4 z-[400] w-72 sm:w-80 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden hidden md:block">
        <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-foreground">
              🔴 Live Rainfall Hotspots
            </span>
          </div>
          <button
            onClick={() => setShowHotspotPanel(!showHotspotPanel)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-0.5 rounded bg-muted/60"
          >
            {showHotspotPanel ? 'Hide' : 'Show'}
          </button>
        </div>

        {showHotspotPanel && (
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto text-xs">
            {rainfallData.hotspots && rainfallData.hotspots.length > 0 ? (
              <>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center justify-between pb-1">
                  <span>Detected Heavy Rain Regions ({rainfallData.hotspots.length})</span>
                  <span className="text-red-500 font-extrabold">RANKED BY INTENSITY</span>
                </div>

                {rainfallData.hotspots.map((spot, idx) => {
                  const classification = classifyRainfallIntensity(spot.rainfallMmPerHour);
                  return (
                    <button
                      key={spot.id}
                      onClick={() => handleFocusHotspot(spot)}
                      className="w-full text-left p-2.5 rounded-xl bg-card hover:bg-muted/80 border border-border/80 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-extrabold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-foreground group-hover:text-brand-600 transition-colors">
                            {spot.name}, {spot.state}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground pl-6 flex items-center gap-1.5">
                          <span>Rainfall Rate:</span>
                          <strong className={classification.textClass}>
                            {spot.rainfallMmPerHour} mm/hr
                          </strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${classification.badgeClass}`}>
                          {classification.category}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center space-y-1">
                <span className="font-extrabold text-xs block flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> NO SIGNIFICANT HEAVY RAINFALL DETECTED
                </span>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  All monitored regions across India are currently reporting light to moderate rainfall (0–25 mm/h).
                </p>
              </div>
            )}
          </div>
        )}
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
        <div className="absolute top-16 right-4 z-[400] bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl space-y-2 text-xs hidden sm:block w-56">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="font-extrabold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <CloudRain className="h-3.5 w-3.5 text-blue-500" /> Live Rainfall Layer
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase ${
                rainfallData.mode === 'live'
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
              }`}
            >
              {rainfallData.mode === 'live' ? '● LIVE DATA' : '● DEMO DATA'}
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
                <span className="w-3 h-3 rounded-full bg-[#f97316]"></span> Orange (Heavy)
              </span>
              <span className="font-bold text-muted-foreground">25–50 mm/h</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ef4444] animate-pulse"></span> Red (Very Heavy)
              </span>
              <span className="font-bold text-muted-foreground">50+ mm/h</span>
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

      {/* RAINFALL DETAIL CARD (FLOATING ON MAP SELECTION) */}
      {selectedRainfallArea && (
        <div className="absolute bottom-28 left-4 z-[400] w-full max-w-sm bg-background/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-blue-500 tracking-wider flex items-center gap-1">
                <CloudRain className="h-3.5 w-3.5" /> Live Rainfall Detail
              </span>
              <h3 className="font-extrabold text-base text-foreground">{selectedRainfallArea.locationName || selectedRainfallArea.name}</h3>
            </div>
            <button
              onClick={() => setSelectedRainfallArea(null)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Intensity Pill */}
          {(() => {
            const classification = classifyRainfallIntensity(selectedRainfallArea.rainfallMmPerHour);
            return (
              <div className={`p-3 rounded-xl border ${classification.bgClass} ${classification.textClass} space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">{classification.category} INTENSITY</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${classification.badgeClass}`}>
                    {selectedRainfallArea.rainfallMmPerHour} mm/hr
                  </span>
                </div>
                <div className="text-xs text-foreground/80 pt-1">
                  Threshold Range: <strong>{classification.rangeLabel}</strong>
                </div>
              </div>
            );
          })()}

          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Coordinates: <strong className="text-foreground">{selectedRainfallArea.lat.toFixed(4)}, {selectedRainfallArea.lng.toFixed(4)}</strong></div>
            <div>Data Source: <strong className="text-foreground">{rainfallData.mode === 'live' ? 'LIVE RADAR / WEATHER API' : 'DEMO DETERMINISTIC STREAM'}</strong></div>
            <div>Last Updated: <strong className="text-foreground">{formatDate(selectedRainfallArea.timestamp || new Date())}</strong></div>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground leading-relaxed italic">
            This rainfall data feeds directly into the FloodVision runoff, Manning drainage capacity, and street-level inundation prediction engine.
          </div>
        </div>
      )}

      {/* LEAFLET MAP CANVAS */}
      <MapContainer
        center={center}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={center} zoom={zoomLevel} />

        {/* INDIA-WIDE SPATIAL RAINFALL GRID OVERLAYS */}
        {layers.rainfall &&
          rainfallData.cells?.map((cell, idx) => {
            const classification = classifyRainfallIntensity(cell.rainfallMmPerHour);
            const isHeavy = cell.rainfallMmPerHour >= 25.0;

            return (
              <React.Fragment key={`cell-${idx}-${cell.id}`}>
                {/* Main Spatial Coverage Ring */}
                <Circle
                  center={[cell.lat, cell.lng]}
                  radius={isHeavy ? 35000 : 25000}
                  pathOptions={{
                    color: classification.hex,
                    fillColor: classification.hex,
                    fillOpacity: isHeavy ? 0.45 : 0.25,
                    weight: isHeavy ? 3 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => setSelectedRainfallArea(cell),
                  }}
                >
                  <Popup>
                    <div className="p-2 space-y-2 text-xs min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-border pb-1">
                        <span className="font-extrabold text-foreground flex items-center gap-1.5 text-xs">
                          <CloudRain className="h-4 w-4 text-blue-500" /> Live Rainfall Monitor
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${classification.badgeClass}`}>
                          {classification.category}
                        </span>
                      </div>

                      <div className="space-y-1 text-muted-foreground text-[11px]">
                        <div>Location: <strong className="text-foreground">{cell.locationName}</strong></div>
                        <div>Coordinates: <strong className="text-foreground">{cell.lat.toFixed(4)}, {cell.lng.toFixed(4)}</strong></div>
                        <div>Rainfall Rate: <strong className={`font-extrabold ${classification.textClass}`}>{cell.rainfallMmPerHour} mm/hr</strong></div>
                        <div>Intensity Level: <strong className="text-foreground">{classification.label} ({classification.rangeLabel})</strong></div>
                        <div>Last updated: <strong className="text-foreground">{formatDate(cell.timestamp)}</strong></div>
                      </div>

                      <div className="pt-1 border-t border-border/60 text-[10px] text-brand-600 dark:text-brand-400 font-medium italic">
                        This rainfall is contributing to flood-risk calculations.
                      </div>
                    </div>
                  </Popup>
                </Circle>

                {/* Outer Pulsing Emphasis Ring for Heavy/Extreme Cells */}
                {isHeavy && (
                  <Circle
                    center={[cell.lat, cell.lng]}
                    radius={55000}
                    pathOptions={{
                      color: classification.hex,
                      fillColor: classification.hex,
                      fillOpacity: 0.12,
                      weight: 1,
                      dashArray: '8, 8',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}

        {/* STREET-LEVEL RISK POLYLINES (WHEN ZOOMED INTO A DISTRICT) */}
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
