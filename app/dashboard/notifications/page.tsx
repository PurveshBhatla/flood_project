'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Bell, Check, AlertTriangle, ShieldAlert, CheckCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-600" /> Notifications Center
          </h1>
          <p className="text-xs text-muted-foreground">Emergency warnings and flood updates matching your saved locations.</p>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl space-y-2">
            <CheckCheck className="h-10 w-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base">All Caught Up!</h3>
            <p className="text-xs text-muted-foreground">No active unread flood alerts for your registered locations.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border ${
                n.read ? 'bg-card border-border opacity-75' : 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-500/40 shadow-sm'
              } space-y-2 relative transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-foreground flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    {n.alert?.title || 'System Alert'}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Affected Zone: <strong>{n.alert?.affectedArea || 'Global'}</strong> • {formatDate(n.createdAt)}
                  </span>
                </div>

                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="px-2.5 py-1 bg-brand-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-brand-700"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark Read
                  </button>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {n.alert?.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
