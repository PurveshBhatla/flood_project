'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Plus, Trash2, Home, Search, Check } from 'lucide-react';
import { getRiskLevelColor } from '@/lib/utils';

export default function LocationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [locations, setLocations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) loadLocations();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddLocation = async (place: any, isHome = false) => {
    setLoadingAdd(true);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: place.display_name.split(',')[0],
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
          city: place.display_name.split(',')[1]?.trim() || '',
          country: place.display_name.split(',').pop()?.trim() || '',
          isHome,
        }),
      });

      if (res.ok) {
        setSearchQuery('');
        setSearchResults([]);
        loadLocations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleUseGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          handleAddLocation(
            {
              display_name: data.display_name || 'My Geolocation',
              lat,
              lon: lng,
            },
            true
          );
        } catch {
          handleAddLocation(
            {
              display_name: `Current Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
              lat,
              lon: lng,
            },
            true
          );
        }
      });
    }
  };

  const handleSetHome = async (id: string) => {
    try {
      await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHome: true }),
      });
      loadLocations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this monitored location?')) return;
    try {
      await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      loadLocations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitored Locations</h1>
          <p className="text-xs text-muted-foreground">Manage places you want FloodVision to continuously monitor for flood risk.</p>
        </div>

        <button
          onClick={handleUseGeolocation}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors w-fit"
        >
          <Navigation className="h-4 w-4" /> Add Current Geolocation
        </button>
      </div>

      {/* Add New Location Search Form */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Search & Add New Location</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, district, or river basin..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loadingSearch}
            className="px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow transition-colors"
          >
            {loadingSearch ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground">Search Results:</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {searchResults.slice(0, 5).map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/60 text-xs">
                  <span className="truncate max-w-md font-medium">{result.display_name}</span>
                  <button
                    onClick={() => handleAddLocation(result)}
                    disabled={loadingAdd}
                    className="px-3 py-1.5 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shrink-0 ml-2"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Locations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => {
          const latestRisk = loc.floodRisks?.[0];
          const riskColor = latestRisk ? getRiskLevelColor(latestRisk.riskLevel) : getRiskLevelColor('LOW');

          return (
            <div key={loc.id} className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-sm relative">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-bold text-base flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand-600" />
                    {loc.name}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {loc.latitude.toFixed(3)}°N, {loc.longitude.toFixed(3)}°E
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {loc.isHome ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                      <Home className="h-3 w-3" /> HOME
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetHome(loc.id)}
                      className="px-2 py-0.5 rounded border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Make Home
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {latestRisk && (
                <div className={`p-3 rounded-xl border ${riskColor.border} ${riskColor.bg} flex items-center justify-between text-xs`}>
                  <div>
                    <span className="font-semibold block">Risk Index: {latestRisk.riskScore}/100</span>
                    <span className="text-[10px] text-muted-foreground">Rainfall: {latestRisk.rainfall}mm</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${riskColor.badge}`}>
                    {latestRisk.riskLevel}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
