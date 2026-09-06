'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Activity, Droplets } from 'lucide-react';

export default function AdminStationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stations, setStations] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch('/api/flood/stations')
      .then((res) => res.json())
      .then((d) => setStations(d.stations || []));
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-600" /> River Gauge Telemetry Stations
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Real-time water level thresholds and telemetry station monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stations.map((stn) => (
          <div key={stn.id} className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">{stn.name}</h3>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase text-white ${
                  stn.status === 'CRITICAL' ? 'bg-red-500' : stn.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              >
                {stn.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <div>Water Level: <strong className="text-foreground">{stn.waterLevel}m</strong></div>
              <div>Warning: <strong className="text-foreground">{stn.warningLevel}m</strong></div>
              <div>Critical: <strong className="text-foreground">{stn.criticalLevel}m</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
