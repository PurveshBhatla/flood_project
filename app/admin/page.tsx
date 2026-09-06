'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AlertStatsChart } from '@/components/charts/alert-stats-chart';
import {
  ShieldAlert,
  Users,
  Radio,
  Activity,
  Plus,
  Server,
  AlertTriangle,
  Settings,
  Database,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastArea, setBroadcastArea] = useState('');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('WARNING');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadAdminData = async () => {
    try {
      const statsRes = await fetch('/api/admin/statistics');
      const statsData = await statsRes.json();
      setStats(statsData);

      const healthRes = await fetch('/api/admin/system-status');
      const healthData = await healthRes.json();
      setSystemHealth(healthData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user]);

  const handleTriggerEmergencyBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    setBroadcastMsg('');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          description: broadcastDesc,
          severity: broadcastSeverity,
          latitude: 19.076,
          longitude: 72.8777,
          affectedArea: broadcastArea,
          expiresInHours: 48,
        }),
      });

      if (res.ok) {
        setBroadcastMsg('Emergency Broadcast dispatched to all registered users!');
        setBroadcastTitle('');
        setBroadcastArea('');
        setBroadcastDesc('');
        loadAdminData();
      }
    } catch {
      setBroadcastMsg('Failed to dispatch alert.');
    } finally {
      setBroadcasting(false);
    }
  };

  if (authLoading || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Admin Command Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">FloodVision System Management</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="px-3.5 py-2 bg-card hover:bg-muted border border-border text-xs font-semibold rounded-xl"
          >
            Manage Users ({stats?.totalUsers ?? 0})
          </Link>
          <Link
            href="/admin/alerts"
            className="px-3.5 py-2 bg-amber-500 text-white hover:bg-amber-600 text-xs font-semibold rounded-xl shadow"
          >
            Manage Alerts ({stats?.totalAlerts ?? 0})
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Total Users</span>
            <Users className="h-4 w-4 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold">{stats?.totalUsers ?? '--'}</div>
          <span className="text-[11px] text-muted-foreground">Registered Accounts</span>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Active Alerts</span>
            <Radio className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-3xl font-extrabold text-red-600">{stats?.activeAlerts ?? '--'}</div>
          <span className="text-[11px] text-muted-foreground">Broadcast Warnings</span>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">River Telemetry</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold">{stats?.totalStations ?? '--'}</div>
          <span className="text-[11px] text-muted-foreground">Gauge Stations Active</span>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">ML Microservice</span>
            <Server className="h-4 w-4 text-brand-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {systemHealth?.services?.mlMicroservice?.status || 'ONLINE'}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Latency: {systemHealth?.services?.mlMicroservice?.latencyMs ?? 14}ms
          </span>
        </div>
      </div>

      {/* Middle Row: Emergency Broadcast Trigger & Recharts Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Broadcast Form */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="font-bold text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Trigger Emergency Flood Broadcast
            </h3>
            <span className="text-[11px] bg-red-500/10 text-red-600 font-bold px-2 py-0.5 rounded">
              IMMEDIATE DISPATCH
            </span>
          </div>

          {broadcastMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
              {broadcastMsg}
            </div>
          )}

          <form onSubmit={handleTriggerEmergencyBroadcast} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Alert Title</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. CRITICAL: Flash Flood Watch"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Severity</label>
                <select
                  value={broadcastSeverity}
                  onChange={(e) => setBroadcastSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-bold text-red-600"
                >
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="DANGER">DANGER</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Affected Area / District</label>
              <input
                type="text"
                required
                value={broadcastArea}
                onChange={(e) => setBroadcastArea(e.target.value)}
                placeholder="e.g. Kamrup Metro, Assam"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Description & Instructions</label>
              <textarea
                required
                rows={3}
                value={broadcastDesc}
                onChange={(e) => setBroadcastDesc(e.target.value)}
                placeholder="Enter emergency advice and evacuation instructions..."
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              {broadcasting ? 'Broadcasting Alert...' : <><Radio className="h-4 w-4" /> Issue Immediate Warning</>}
            </button>
          </form>
        </div>

        {/* Recharts Analytics Chart */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Regional Risk Level Distribution</h3>
            <span className="text-xs text-muted-foreground">Recharts Analytics</span>
          </div>

          <AlertStatsChart distribution={stats?.riskDistribution} />
        </div>
      </div>
    </div>
  );
}
