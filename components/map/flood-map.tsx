'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import { Search, Navigation, Layers, AlertTriangle, Droplets, ShieldCheck, Thermometer } from 'lucide-react';
import { getRiskLevelColor } from '@/lib/utils';

// Fix Leaflet marker icons path in Next.js
const customIcon = (color: string) =>
  L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  waterLevel: number;
  warningLevel: number;
  criticalLevel: number;
  status: string;
}

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  affectedArea: string;
}

interface FloodMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  stations?: Station[];
  alerts?: AlertItem[];
  interactive?: boolean;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function FloodMap({
  initialCenter = [19.076, 72.8777],
  initialZoom = 6,
  stations = [],
  alerts = [],
  interactive = true,
}: FloodMapProps) {
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationInfo, setSelectedLocationInfo] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [layers, setLayers] = useState({
    stations: true,
    alerts: true,
    heatmap: true,
  });

  const presetLocations = [
    { name: 'Mumbai, MH', lat: 19.076, lng: 72.8777 },
    { name: 'Kochi, Kerala', lat: 10.1076, lng: 76.3516 },
    { name: 'Guwahati, Assam', lat: 26.1445, lng: 91.7362 },
    { name: 'Houston, Texas', lat: 29.7604, lng: -95.3698 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  ];

  const handleSelectPreset = async (lat: number, lng: number) => {
    setCenter([lat, lng]);
    fetchLocationRisk(lat, lng);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCenter([lat, lng]);
        await fetchLocationRisk(lat, lng);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleUseGeolocation = () => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCenter([lat, lng]);
          fetchLocationRisk(lat, lng);
          setLoadingLocation(false);
        },
        () => {
          setLoadingLocation(false);
        }
      );
    }
  };

  const fetchLocationRisk = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/flood/risk?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setSelectedLocationInfo({
        lat,
        lng,
        ...data,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-border">
      {/* Search & Location Bar */}
      {interactive && (
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col md:flex-row gap-2 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-background/95 backdrop-blur-md border border-border shadow-md rounded-xl px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or river basin..."
              className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loadingLocation}
              className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors ml-2"
            >
              {loadingLocation ? 'Locating...' : 'Search'}
            </button>
          </form>

          <button
            onClick={handleUseGeolocation}
            className="flex items-center gap-1.5 px-3 py-2 bg-background/95 backdrop-blur-md border border-border shadow-md hover:bg-muted text-foreground text-xs font-medium rounded-xl transition-colors"
          >
            <Navigation className="h-4 w-4 text-brand-600" />
            Find Me
          </button>
        </div>
      )}

      {/* Preset Location Quick Chips */}
      {interactive && (
        <div className="absolute top-20 left-4 z-[400] hidden md:flex items-center gap-1.5 overflow-x-auto max-w-[calc(100%-2rem)] py-1">
          {presetLocations.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleSelectPreset(loc.lat, loc.lng)}
              className="px-2.5 py-1 bg-background/90 backdrop-blur-md border border-border hover:border-brand-500 rounded-full text-xs font-medium text-foreground transition-all shadow-sm shrink-0"
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-6 left-4 z-[400] bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg space-y-1.5 text-xs">
        <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider mb-1">
          Risk Index Legend
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-muted-foreground">0-34: Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-muted-foreground">35-54: Moderate Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-muted-foreground">55-74: High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-muted-foreground">75+: Critical Emergency</span>
        </div>
      </div>

      {/* Map Component */}
      <MapContainer
        center={center}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={center} />

        {/* River Monitoring Stations */}
        {layers.stations &&
          stations.map((stn) => {
            const isCritical = stn.status === 'CRITICAL' || stn.waterLevel >= stn.criticalLevel;
            const color = isCritical ? '#ef4444' : stn.waterLevel >= stn.warningLevel ? '#f59e0b' : '#10b981';

            return (
              <React.Fragment key={stn.id}>
                <Marker position={[stn.latitude, stn.longitude]} icon={customIcon(color)}>
                  <Popup>
                    <div className="p-1 space-y-2 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{stn.name}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                          style={{ backgroundColor: color }}
                        >
                          {stn.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-700">
                        <p>💧 Water Level: <strong>{stn.waterLevel}m</strong></p>
                        <p>⚠️ Warning Threshold: <strong>{stn.warningLevel}m</strong></p>
                        <p>🔴 Critical Limit: <strong>{stn.criticalLevel}m</strong></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {isCritical && (
                  <Circle
                    center={[stn.latitude, stn.longitude]}
                    radius={15000}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 }}
                  />
                )}
              </React.Fragment>
            );
          })}

        {/* Flood Alerts Overlays */}
        {layers.alerts &&
          alerts.map((alt) => {
            const color =
              alt.severity === 'CRITICAL'
                ? '#ef4444'
                : alt.severity === 'DANGER'
                ? '#f97316'
                : '#f59e0b';

            return (
              <React.Fragment key={alt.id}>
                <Circle
                  center={[alt.latitude, alt.longitude]}
                  radius={alt.radiusKm * 1000}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.25 }}
                />
                <Marker position={[alt.latitude, alt.longitude]} icon={customIcon(color)}>
                  <Popup>
                    <div className="p-1 space-y-1.5 max-w-[240px]">
                      <span className="font-bold text-sm text-red-600 block">{alt.title}</span>
                      <p className="text-xs text-slate-600">{alt.description}</p>
                      <p className="text-[11px] font-semibold text-slate-800">
                        📍 Area: {alt.affectedArea}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
      </MapContainer>
    </div>
  );
}
