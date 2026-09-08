'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import {
  getDepthColor,
  getRiskLevelColor,
  classifyRainfallIntensity,
  formatDate,
  haversineDistance,
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
  ShieldAlert,
  Tent,
  Navigation,
  Locate,
  Compass,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

// Custom Map Pins
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

const shelterIcon = (color: string, isNearest: boolean = false) =>
  L.divIcon({
    className: 'custom-shelter-pin',
    html: `
      <div style="
        background-color: ${color};
        width: ${isNearest ? '36px' : '30px'};
        height: ${isNearest ? '36px' : '30px'};
        border-radius: 50%;
        border: ${isNearest ? '3px solid #ffffff' : '2px solid #ffffff'};
        box-shadow: ${
          isNearest
            ? '0 0 0 5px rgba(16, 185, 129, 0.5), 0 4px 14px rgba(0,0,0,0.6)'
            : '0 4px 10px rgba(0,0,0,0.4)'
        };
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isNearest ? '18px' : '15px'};
      ">
        🏠
      </div>
    `,
    iconSize: [isNearest ? 36 : 30, isNearest ? 36 : 30],
    iconAnchor: [isNearest ? 18 : 15, isNearest ? 18 : 15],
  });

const userLocationIcon = (isGps: boolean) =>
  L.divIcon({
    className: 'custom-user-pin',
    html: `
      <div style="
        background-color: ${isGps ? '#06b6d4' : '#3b82f6'};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 16px ${isGps ? '#06b6d4' : '#3b82f6'};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const originIcon = () =>
  L.divIcon({
    className: 'custom-origin-pin',
    html: `
      <div style="
        background-color: #ef4444;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.6);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        🚨 Point A (Origin / Citizen)
      </div>
    `,
    iconSize: [160, 30],
    iconAnchor: [80, 15],
  });

const reliefCenterIcon = () =>
  L.divIcon({
    className: 'custom-relief-pin',
    html: `
      <div style="
        background-color: #10b981;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        🏰 Point B (Safe Relief Center)
      </div>
    `,
    iconSize: [180, 30],
    iconAnchor: [90, 15],
  });

// Simulated Dynamic Flood Reroute Coordinates
const floodedRouteCoords: [number, number][] = [
  [19.070, 72.872],
  [19.073, 72.875],
  [19.076, 72.8777],
  [19.079, 72.880],
  [19.082, 72.883],
];

const safeRouteCoords: [number, number][] = [
  [19.070, 72.872],
  [19.068, 72.866],
  [19.075, 72.863],
  [19.083, 72.868],
  [19.085, 72.875],
  [19.082, 72.883],
];


const citizenReportIcon = () =>
  L.divIcon({
    className: 'custom-citizen-pin',
    html: `
      <div style="
        background-color: #f59e0b;
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.8), 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        📢
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

function MapRecenter({ center, zoom = 6 }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

import { useFloodSimulationContext } from '@/lib/context/flood-simulation-context';
import { useCitizenReports } from '@/lib/context/citizen-report-context';

export default function FloodMap() {
  const { isSimulatedAlert, demoData } = useFloodSimulationContext();
  const { reports: citizenReports, openReportModal } = useCitizenReports();

  // Default to India-wide view
  const [center, setCenter] = useState<[number, number]>([22.5937, 78.9629]);
  const [zoomLevel, setZoomLevel] = useState<number>(5);


  useEffect(() => {
    if (isSimulatedAlert) {
      setCenter([19.076, 72.8777]);
      setZoomLevel(15);
    }
  }, [isSimulatedAlert]);

  const [forecastMinutes, setForecastMinutes] = useState(90);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedRainfallArea, setSelectedRainfallArea] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);

  // User Location & Location Selection State
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedMapPoint, setSelectedMapPoint] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  // Safe Shelters Feature State
  const [showShelterPanel, setShowShelterPanel] = useState(true);
  const [shelterSummary, setShelterSummary] = useState<any>(null);
  const [loadingShelters, setLoadingShelters] = useState(false);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);

  // Judge Demo Simulation Mode
  const [isSimulating, setIsSimulating] = useState(false);

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
    shelters: true,
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

  // Active location reference for shelter distance calculations
  const activeLocation = useMemo<[number, number]>(() => {
    if (userLocation) return userLocation;
    if (selectedMapPoint) return selectedMapPoint;
    return center;
  }, [userLocation, selectedMapPoint, center]);

  const activeLocationType = useMemo(() => {
    if (userLocation) return 'GPS';
    if (selectedMapPoint) return 'MAP_CLICK';
    return 'MAP_CENTER';
  }, [userLocation, selectedMapPoint]);

  // Fetch Rescue Resources / Shelters around active location
  const fetchShelters = async (lat: number, lng: number) => {
    setLoadingShelters(true);
    try {
      const res = await fetch(`/api/resources/available?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const data = await res.json();
      setShelterSummary(data);
    } catch (err) {
      console.error('Shelters fetch error:', err);
    } finally {
      setLoadingShelters(false);
    }
  };

  useEffect(() => {
    fetchShelters(activeLocation[0], activeLocation[1]);
  }, [activeLocation[0], activeLocation[1]]);

  // Calculate Safe Shelters with Haversine distance and flood-risk validation
  const processedShelters = useMemo(() => {
    if (!shelterSummary || !shelterSummary.resources) return [];

    const rawShelters = shelterSummary.resources.filter((r: any) => r.type === 'SHELTER');
    const [refLat, refLng] = activeLocation;

    return rawShelters
      .map((shelter: any) => {
        const distKm = haversineDistance(refLat, refLng, shelter.latitude, shelter.longitude);

        let hasFloodRisk = false;

        if (rainfallData?.cells) {
          const nearbyExtremeRain = rainfallData.cells.some(
            (c) =>
              c.rainfallMmPerHour >= 45.0 &&
              haversineDistance(shelter.latitude, shelter.longitude, c.lat, c.lng) < 12
          );
          if (nearbyExtremeRain) hasFloodRisk = true;
        }

        if (geoJsonData?.features) {
          const nearbyHighFlood = geoJsonData.features.some((f: any) => {
            if (f.properties?.depthCm >= 25.0) {
              const coords = f.geometry?.coordinates?.[0];
              if (coords && coords.length >= 2) {
                const fDist = haversineDistance(
                  shelter.latitude,
                  shelter.longitude,
                  coords[1],
                  coords[0]
                );
                return fDist < 1.5;
              }
            }
            return false;
          });
          if (nearbyHighFlood) hasFloodRisk = true;
        }

        let safetyCategory: 'SAFE' | 'LIMITED' | 'FULL' | 'FLOOD_RISK' = 'SAFE';
        let safetyBadge = '🟢 AVAILABLE';
        let badgeClass = 'bg-emerald-500 text-white';
        let markerColor = '#10b981';
        let isSafe = true;

        if (hasFloodRisk) {
          safetyCategory = 'FLOOD_RISK';
          safetyBadge = '⚠️ UNSAFE (FLOOD RISK)';
          badgeClass = 'bg-red-600 text-white';
          markerColor = '#dc2626';
          isSafe = false;
        } else if (shelter.count === 0 || shelter.status === 'UNAVAILABLE') {
          safetyCategory = 'FULL';
          safetyBadge = '🔴 FULL / UNAVAILABLE';
          badgeClass = 'bg-slate-600 text-white';
          markerColor = '#64748b';
          isSafe = false;
        } else if (shelter.status === 'LIMITED' || shelter.count < 30) {
          safetyCategory = 'LIMITED';
          safetyBadge = '🟡 LIMITED CAPACITY';
          badgeClass = 'bg-amber-500 text-white';
          markerColor = '#f59e0b';
          isSafe = true;
        }

        return {
          ...shelter,
          distanceKm: distKm,
          hasFloodRisk,
          safetyCategory,
          safetyBadge,
          badgeClass,
          markerColor,
          isSafe,
        };
      })
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);
  }, [shelterSummary, activeLocation, rainfallData, geoJsonData]);

  const safeShelters = useMemo(() => {
    return processedShelters.filter((s: any) => s.isSafe);
  }, [processedShelters]);

  const nearestSafeShelters = useMemo(() => {
    return safeShelters.slice(0, 3);
  }, [safeShelters]);

  // Handle Browser Geolocation ("Use My Location")
  const handleGetLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setLocatingUser(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setSelectedMapPoint(null);
          setCenter([latitude, longitude]);
          setZoomLevel(13);
          setLocatingUser(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setLocatingUser(false);
          alert(
            'GPS location permission denied or unavailable. Click anywhere on the map to set a location manually.'
          );
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Browser geolocation is not supported on this device. Click on the map to set a location manually.');
    }
  };

  const handleMapClickSelect = (lat: number, lng: number) => {
    setSelectedMapPoint([lat, lng]);
    setUserLocation(null);
  };

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
        setSelectedMapPoint([lat, lng]);
        setUserLocation(null);
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

  const handleFocusShelter = (shelter: any) => {
    setSelectedShelterId(shelter.id);
    setCenter([shelter.latitude, shelter.longitude]);
    setZoomLevel(14);
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-border bg-background">
      {/* ⚠️ IMMEDIATE FLASH BANNER FOR MAP OVERRIDE */}
      {isSimulatedAlert && (
        <div className="absolute top-1.5 left-4 right-4 z-[450] p-3 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow-2xl border-2 border-red-400 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-300 shrink-0" />
            <span>
              ⚠️ SIH26085 EARLY WARNING: Critical runoff accumulation detected in low-lying sector. Drainage threshold breached. Evacuation route A-1 recommended.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] uppercase font-black tracking-wider shrink-0 hidden sm:inline-block">
            RED ALERT (+2H)
          </span>
        </div>
      )}

      {/* Top Floating Header & Controls */}
      <div className={`absolute ${isSimulatedAlert ? 'top-16' : 'top-4'} left-4 right-4 z-[400] flex flex-col md:flex-row gap-2 max-w-6xl transition-all`}>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center bg-background/95 backdrop-blur-md border border-border shadow-lg rounded-xl px-3 py-1.5"
        >
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Indian city, district, or address (e.g. Guwahati, Wayanad, Mumbai, Odisha)..."
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

        {/* 📢 Prominent "Report Flood / Jal-Bharo (Citizen Desk)" Map Control Button */}
        <button
          onClick={openReportModal}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-300 shadow-xl transition-all shrink-0 animate-pulse cursor-pointer"
        >
          <span className="text-base">📢</span>
          <span>Report Flood / Jal-Bharo (Citizen Desk)</span>
        </button>

        {/* 🏠 Prominent "Nearest Safe Shelters" Map Control Button */}
        <button
          onClick={() => {
            const nextState = !showShelterPanel;
            setShowShelterPanel(nextState);
            if (nextState) {
              setLayers((prev) => ({ ...prev, shelters: true }));
              if (processedShelters.length > 0) {
                const topShelter = processedShelters[0];
                setCenter([topShelter.latitude, topShelter.longitude]);
                setZoomLevel(13);
              }
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all shadow-lg shrink-0 border ${
            showShelterPanel
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 ring-2 ring-emerald-500/40'
              : 'bg-background/95 backdrop-blur-md border-border hover:bg-muted text-foreground'
          }`}
        >
          <span className="text-base">🏠</span>
          <span>Nearest Safe Shelters</span>
        </button>


        {/* Use My Location Button */}
        <button
          onClick={handleGetLocation}
          disabled={locatingUser}
          className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow transition-colors shrink-0"
          title="Detect current location with Browser Geolocation API"
        >
          <Locate className={`h-4 w-4 ${locatingUser ? 'animate-spin' : ''}`} />
          {locatingUser ? 'Locating...' : 'Use My Location'}
        </button>

        {/* Map Reset View to India Overview */}
        <button
          onClick={() => {
            setCenter([22.5937, 78.9629]);
            setZoomLevel(5);
            setSelectedRainfallArea(null);
            setSelectedMapPoint(null);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-background/95 backdrop-blur-md border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl shadow transition-colors shrink-0"
        >
          <MapPin className="h-4 w-4 text-emerald-500" />
          India Overview
        </button>

        {/* Map Layer Toggle Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-background/95 backdrop-blur-md border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl shadow transition-colors"
          >
            <Layers className="h-4 w-4 text-brand-600" />
            Layers
          </button>

          {showLayerMenu && (
            <div className="absolute top-11 right-0 w-60 bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-2xl z-[500] space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block border-b border-border pb-1">
                Map Layer Overlay Toggles
              </span>
              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                <span className="flex items-center gap-2 font-medium">
                  <span className="text-sm">🏠</span> Safe Relief Shelters
                </span>
                <input
                  type="checkbox"
                  checked={layers.shelters}
                  onChange={(e) => setLayers({ ...layers, shelters: e.target.checked })}
                  className="rounded accent-brand-600"
                />
              </label>

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

        {/* Judge Demo Simulation Launcher */}
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

      {/* 🏠 NEAREST SAFE SHELTERS PANEL */}
      {showShelterPanel && (
        <div className="absolute top-16 right-4 z-[400] w-72 sm:w-96 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏠</span>
              <span className="font-extrabold text-xs uppercase tracking-wider text-foreground">
                NEAREST SAFE SHELTERS
              </span>
            </div>
            <button
              onClick={() => setShowShelterPanel(false)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-2.5 max-h-[26rem] overflow-y-auto text-xs">
            {/* Reference Location Row */}
            <div className="p-2 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Navigation className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                <span>
                  Reference:{' '}
                  <strong className="text-foreground">
                    {activeLocationType === 'GPS'
                      ? 'Your GPS Location'
                      : activeLocationType === 'MAP_CLICK'
                      ? `Selected Point (${activeLocation[0].toFixed(3)}, ${activeLocation[1].toFixed(3)})`
                      : 'Map Center'}
                  </strong>
                </span>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={locatingUser}
                className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[10px] transition-colors"
              >
                {locatingUser ? 'Locating...' : 'Use My Location'}
              </button>
            </div>

            {loadingShelters ? (
              <div className="p-4 text-center text-muted-foreground text-xs space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-brand-600" />
                <p>Calculating nearest safe shelters...</p>
              </div>
            ) : nearestSafeShelters.length > 0 ? (
              <>
                {nearestSafeShelters.map((shelter: any, idx: number) => {
                  const isTopRank = idx === 0;
                  const isSelected = selectedShelterId === shelter.id;

                  return (
                    <button
                      key={shelter.id}
                      onClick={() => handleFocusShelter(shelter)}
                      className={`w-full text-left p-3 rounded-xl border transition-all space-y-2 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                          : isTopRank
                          ? 'bg-card border-emerald-500/60 shadow-sm hover:border-emerald-500'
                          : 'bg-card border-border hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-foreground text-xs leading-snug flex items-center gap-1.5">
                            🏠 {shelter.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {shelter.address || shelter.locationName}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold shrink-0 ${shelter.badgeClass}`}>
                          {shelter.status === 'AVAILABLE'
                            ? '🟢 AVAILABLE'
                            : shelter.status === 'LIMITED'
                            ? '🟡 LIMITED'
                            : '🔴 FULL'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <div>
                          Distance:{' '}
                          <strong className="text-brand-600 dark:text-brand-400 font-extrabold">
                            {shelter.distanceKm < 1
                              ? `${Math.round(shelter.distanceKm * 1000)} m`
                              : `${shelter.distanceKm.toFixed(1)} km`}
                          </strong>
                        </div>
                        <div>
                          Available:{' '}
                          <strong className="text-foreground font-extrabold">
                            {shelter.availableSpaces ?? shelter.count} spaces available
                          </strong>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-center space-y-1.5">
                <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
                <span className="font-extrabold text-xs block">No nearby safe shelter found.</span>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Click anywhere on the map to set a location and calculate nearest safe shelters.
                </p>
              </div>
            )}

            {/* Bottom Demo Warning Label */}
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold text-center uppercase tracking-wide">
              ⚠ DEMO SHELTER DATA
            </div>
          </div>
        </div>
      )}

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

      {/* RAINFALL DETAIL CARD (FLOATING ON MAP SELECTION) */}
      {selectedRainfallArea && (
        <div className="absolute bottom-28 left-4 z-[400] w-full max-w-sm bg-background/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-blue-500 tracking-wider flex items-center gap-1">
                <CloudRain className="h-3.5 w-3.5" /> Live Rainfall Detail
              </span>
              <h3 className="font-extrabold text-base text-foreground">
                {selectedRainfallArea.locationName || selectedRainfallArea.name}
              </h3>
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
            <div>
              Coordinates: <strong className="text-foreground">{selectedRainfallArea.lat.toFixed(4)}, {selectedRainfallArea.lng.toFixed(4)}</strong>
            </div>
            <div>
              Data Source: <strong className="text-foreground">{rainfallData.mode === 'live' ? 'LIVE RADAR / WEATHER API' : 'DEMO DETERMINISTIC STREAM'}</strong>
            </div>
            <div>
              Last Updated: <strong className="text-foreground">{formatDate(selectedRainfallArea.timestamp || new Date())}</strong>
            </div>
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
        <MapEventsHandler onMapClick={handleMapClickSelect} />

        {/* USER LOCATION / MAP CLICKED REFERENCE MARKER */}
        {(userLocation || selectedMapPoint) && (
          <Marker
            position={userLocation || selectedMapPoint!}
            icon={userLocationIcon(!!userLocation)}
          >
            <Popup>
              <div className="p-1.5 space-y-1 text-xs min-w-[180px]">
                <div className="flex items-center gap-1.5 font-extrabold text-cyan-600 dark:text-cyan-400">
                  <Locate className="h-4 w-4" />
                  <span>{userLocation ? 'Your GPS Location' : 'Selected Location'}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Lat: {(userLocation || selectedMapPoint!)[0].toFixed(4)}, Lng:{' '}
                  {(userLocation || selectedMapPoint!)[1].toFixed(4)}
                </p>
                <p className="text-[10px] text-foreground font-semibold pt-1 border-t border-border/60">
                  Calculating nearest safe shelters from this point.
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 🏠 SAFE RELIEF SHELTER MARKERS ON MAP */}
        {layers.shelters &&
          processedShelters.map((shelter: any) => {
            const isTopNearest = nearestSafeShelters[0]?.id === shelter.id;

            return (
              <Marker
                key={`shelter-${shelter.id}`}
                position={[shelter.latitude, shelter.longitude]}
                icon={shelterIcon(shelter.markerColor, isTopNearest)}
                eventHandlers={{
                  click: () => setSelectedShelterId(shelter.id),
                }}
              >
                <Popup>
                  <div className="p-2 space-y-2 text-xs min-w-[240px]">
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <span className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                        🏠 {shelter.name}
                      </span>
                    </div>

                    {isTopNearest && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500 text-white w-full justify-center">
                        <ShieldCheck className="h-3 w-3" /> #1 Nearest Recommended Safe Shelter
                      </span>
                    )}

                    <div className="space-y-1.5 text-muted-foreground text-[11px]">
                      <div>
                        Address: <strong className="text-foreground">{shelter.address || shelter.locationName}</strong>
                      </div>
                      <div>
                        Calculated Distance:{' '}
                        <strong className="text-brand-600 dark:text-brand-400 font-extrabold text-xs">
                          {shelter.distanceKm < 1
                            ? `${Math.round(shelter.distanceKm * 1000)} m`
                            : `${shelter.distanceKm.toFixed(1)} km`}
                        </strong>
                      </div>
                      <div>
                        Capacity: <strong className="text-foreground">{shelter.capacity || shelter.totalCapacity || 250}</strong>
                      </div>
                      <div>
                        Available Spaces: <strong className="text-foreground">{shelter.availableSpaces ?? shelter.count}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span>Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${shelter.badgeClass}`}>
                          {shelter.status === 'AVAILABLE'
                            ? '🟢 AVAILABLE'
                            : shelter.status === 'LIMITED'
                            ? '🟡 LIMITED'
                            : '🔴 FULL'}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-border flex items-center justify-between text-[10px] text-amber-500 font-extrabold uppercase">
                        <span>Data: DEMO SHELTER DATA</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold text-center flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Get Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

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
                        <div>
                          Location: <strong className="text-foreground">{cell.locationName}</strong>
                        </div>
                        <div>
                          Coordinates: <strong className="text-foreground">{cell.lat.toFixed(4)}, {cell.lng.toFixed(4)}</strong>
                        </div>
                        <div>
                          Rainfall Rate:{' '}
                          <strong className={`font-extrabold ${classification.textClass}`}>
                            {cell.rainfallMmPerHour} mm/hr
                          </strong>
                        </div>
                        <div>
                          Intensity Level: <strong className="text-foreground">{classification.label} ({classification.rangeLabel})</strong>
                        </div>
                        <div>
                          Last updated: <strong className="text-foreground">{formatDate(cell.timestamp)}</strong>
                        </div>
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
                  <p>
                    Water Level: <strong>{stn.waterLevel}m</strong>
                  </p>
                  <p>
                    Warning Limit: <strong>{stn.warningLevel}m</strong>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 🔴 RED ALERT SIMULATION MAP OVERLAYS & POPUP */}
        {isSimulatedAlert && (
          <React.Fragment>
            {/* Primary Hotspot Red Circle Overlay (Flooded Depression Zone) */}
            <Circle
              center={[19.076, 72.8777]}
              radius={450}
              pathOptions={{
                color: '#dc2626',
                fillColor: '#ef4444',
                fillOpacity: 0.65,
                weight: 4,
              }}
            />
            <Circle
              center={[19.076, 72.8777]}
              radius={850}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '8, 8',
              }}
            />

            {/* Drain Node #D-14 Warning Marker & Popup */}
            <Marker position={[19.076, 72.8777]} icon={customIcon('#dc2626')}>
              <Popup autoPan={true}>
                <div className="p-2.5 space-y-1.5 text-xs min-w-[250px]">
                  <div className="flex items-center justify-between border-b border-red-500/40 pb-1">
                    <span className="font-extrabold text-red-600 flex items-center gap-1 text-sm">
                      🚨 CRITICAL OVERFLOW NODE
                    </span>
                    <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[9px] rounded uppercase">
                      142% OVERLOAD
                    </span>
                  </div>
                  <p className="font-black text-sm text-foreground">
                    Drain Node #D-14 Overflowing | Water Depth: 0.8m
                  </p>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    Zone 4 - Central Market / Railway Underpass
                  </p>
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/40 text-[11px] text-red-600 font-bold leading-snug">
                    ⚠️ 78.4 mm/hr Cloudburst Warning. Inundation depth predicted 0.65m–0.90m in 45-75 mins. Use Evacuation Route A-1.
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* 🔀 INTERACTIVE FLOOD-SAFE DYNAMIC ROUTING POLYLINES & MARKERS */}

            {/* Polyline 1: Blocked / Flooded Path (Red / Dashed) */}
            <Polyline
              positions={floodedRouteCoords}
              pathOptions={{
                color: '#ef4444',
                weight: 6,
                opacity: 0.85,
                dashArray: '10, 10',
              }}
            >
              <Popup>
                <div className="p-2 space-y-1 text-xs font-bold text-red-600">
                  <span>❌ Inundated Corridor (0.8m Water Depth - Impassable / Hazard)</span>
                </div>
              </Popup>
            </Polyline>

            {/* Polyline 2: Recommended Safe Evacuation Path (Green / Solid Glowing Line) */}
            <Polyline
              positions={safeRouteCoords}
              pathOptions={{
                color: '#10b981',
                weight: 8,
                opacity: 1.0,
              }}
            >
              <Popup>
                <div className="p-2 space-y-1 text-xs font-bold text-emerald-600">
                  <span>✅ Recommended Flood-Safe Route (Elevated Corridor + Safe Drainage)</span>
                </div>
              </Popup>
            </Polyline>

            {/* Point A: Origin / Trapped Citizen Marker */}
            <Marker position={[19.070, 72.872]} icon={originIcon()}>
              <Popup>
                <div className="p-2 text-xs font-extrabold text-foreground">
                  📍 Point A: Citizen Origin / Hazard Zone (Elev: 4m)
                </div>
              </Popup>
            </Marker>

            {/* Point B: Emergency Relief Center / High Ground Marker */}
            <Marker position={[19.082, 72.883]} icon={reliefCenterIcon()}>
              <Popup>
                <div className="p-2 text-xs font-extrabold text-emerald-600">
                  🏰 Point B: Emergency Relief Center / High Ground (Elev: 22m)
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        )}

        {/* 📢 CITIZEN VERIFIED INCIDENT MARKERS ON MAP */}
        {citizenReports.map((report) => (
          <Marker
            key={`cit-marker-${report.id}`}
            position={[report.latitude, report.longitude]}
            icon={citizenReportIcon()}
          >
            <Popup autoPan={true}>
              <div className="p-2.5 space-y-2 text-xs min-w-[240px] max-w-[280px]">
                <div className="flex items-center justify-between border-b border-amber-500/40 pb-1">
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                    📢 Citizen Verified Incident
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase">
                    GROUND-TRUTH
                  </span>
                </div>

                {/* Uploaded Image Preview if present */}
                {report.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <img
                      src={report.imageUrl}
                      alt="Citizen Flood Report"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1 text-[11px]">
                  <h4 className="font-extrabold text-foreground text-xs leading-snug">
                    {report.streetName}
                  </h4>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-muted-foreground">Water Depth:</span>
                    <strong className="text-red-600 dark:text-red-400 font-extrabold text-xs">
                      {report.waterDepth} ({report.waterDepthCategory})
                    </strong>
                  </div>

                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-600 font-bold">
                    {report.aiEstimate}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {report.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-bold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/40">
                    <span>{report.timestamp}</span>
                    <strong className="text-emerald-600 font-extrabold">{report.status}</strong>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 🔀 AI DYNAMIC FLOOD REROUTE NAVIGATION CARD (FLOATING PANEL OVERLAY) */}
      {isSimulatedAlert && (
        <div className="absolute bottom-28 right-4 z-[400] w-full max-w-sm sm:max-w-md bg-background/95 backdrop-blur-md border-2 border-emerald-500/60 rounded-2xl p-4 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-extrabold text-base">
                🔀
              </span>
              <div>
                <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                  AI Dynamic Flood Reroute Active
                </h3>
                <span className="text-[10px] text-muted-foreground font-semibold block">
                  Real-Time Hazard Avoidance Matrix
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
              LIVE REROUTING
            </span>
          </div>

          {/* Route Comparison Mini-Table / Cards */}
          <div className="space-y-2 text-xs">
            {/* Blocked Route */}
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/40 space-y-1">
              <div className="flex items-center justify-between font-extrabold text-red-600 dark:text-red-400">
                <span>❌ Blocked Inundated Route</span>
                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-black">
                  HAZARD
                </span>
              </div>
              <p className="text-[11px] font-bold text-foreground">
                Shortest (1.8 km) — <span className="text-red-600 font-extrabold">⚠️ 85% Inundation Risk — DO NOT ENTER</span>
              </p>
              <span className="text-[10px] text-muted-foreground block">
                Traverses Zone 4 Railway Underpass (0.8m Water Depth)
              </span>
            </div>

            {/* Safe Route */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/50 space-y-1 shadow-sm">
              <div className="flex items-center justify-between font-extrabold text-emerald-600 dark:text-emerald-400">
                <span>✅ Recommended Safe Evacuation Route</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black">
                  OPTIMAL
                </span>
              </div>
              <p className="text-[11px] font-bold text-foreground">
                Elevated Alt (2.7 km) — <span className="text-emerald-600 font-extrabold">✅ Safe / 0% Inundation Risk</span> — <strong>ETA: 6 mins</strong>
              </p>
              <span className="text-[10px] text-muted-foreground block">
                Contour-safe elevated ridge bypass to Emergency Relief Center
              </span>
            </div>
          </div>

          {/* Key Algorithm Label */}
          <div className="pt-2 border-t border-border flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="font-extrabold text-brand-600 shrink-0">Algorithm:</span>
            <span className="font-medium leading-snug">
              Coupled Routing: Dijkstra / A* weighted by DEM Slope & Drainage Surcharge Risk
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

