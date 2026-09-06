'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Radio, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminAlertsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [alertsList, setAlertsList] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlertsList(data.alerts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') loadAlerts();
  }, [user]);

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Revoke and delete this flood alert?')) return;
    try {
      await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="h-6 w-6 text-red-500" /> Active Emergency Alerts Directory
          </h1>
          <p className="text-xs text-muted-foreground">Manage active flood warnings, radius parameters, and emergency broadcasts.</p>
        </div>
      </div>

      <div className="space-y-4">
        {alertsList.map((a) => (
          <div key={a.id} className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-sm relative">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  {a.title}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Affected Zone: <strong>{a.affectedArea}</strong> • Lat/Lng: ({a.latitude.toFixed(2)}, {a.longitude.toFixed(2)}) • Radius: {a.radiusKm}km
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-red-500 text-white font-bold text-[10px] uppercase">
                  {a.severity}
                </span>
                <button
                  onClick={() => handleDeleteAlert(a.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>
            <span className="text-[10px] text-muted-foreground block">Expires: {formatDate(a.expiresAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
