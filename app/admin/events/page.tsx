'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Database, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminEventsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch('/api/flood/events')
      .then((res) => res.json())
      .then((d) => setEvents(d.events || []));
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6 text-brand-600" /> Historical Flood Event Records
        </h1>
        <p className="text-xs text-muted-foreground">Historical disaster training logs and impact metrics.</p>
      </div>

      <div className="space-y-4">
        {events.map((e) => (
          <div key={e.id} className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">{e.location}</span>
              <span className="px-2 py-0.5 rounded bg-red-500 text-white font-bold text-[10px] uppercase">
                {e.severity}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{e.description}</p>
            <div className="text-[11px] font-medium text-brand-600">Impact: {e.impact}</div>
            <span className="text-[10px] text-muted-foreground block">Event Date: {formatDate(e.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
