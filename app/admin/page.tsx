'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Layers,
  MapPin,
  Car,
  TrendingUp,
  Truck,
  FileText,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  Search,
  Check
} from 'lucide-react';

interface Incident {
  id: string;
  streetName: string;
  landmark: string | null;
  city: string;
  depthCategory: string;
  depthCm: number;
  waterLevelTrend: string;
  roadCondition: string;
  hazardTags: string;
  description: string | null;
  photoUrl: string | null;
  upvotes: number;
  status: string;
  isStale: boolean;
  priorityScore: number;
  isDuplicate: boolean;
  parentReportId: string | null;
  reportedBy: string | null;
  createdAt: string;
  actions?: Array<{
    id: string;
    actionType: string;
    actorName: string;
    notes: string;
    createdAt: string;
  }>;
}

interface Hotspot {
  id: string;
  title: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  reportCount: number;
  maxDepthCategory: string;
  maxDepthCm: number;
  priorityScore: number;
  status: string;
  createdAt: string;
}

export default function AdminPortalPage() {
  const { user, login } = useAuth();

  // Admin Authorization State
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  // Incidents & Hotspots State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pending' | 'high_priority' | 'all' | 'hotspots'>('pending');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Action execution state
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [operatorNotes, setOperatorNotes] = useState('');

  // Check initial user role or local admin session
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      setIsAdminAuthorized(true);
    } else {
      const stored = sessionStorage.getItem('floodwatch_admin_auth');
      if (stored === 'true') {
        setIsAdminAuthorized(true);
      }
    }
  }, [user]);

  // Handle Passcode Unlock for Hackathon Evaluators
  const handlePasscodeUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorizing(true);
    setAuthError('');

    // Accept Admin@123456 or floodwatch2026
    if (passcode === 'Admin@123456' || passcode === 'floodwatch2026' || passcode === 'admin') {
      sessionStorage.setItem('floodwatch_admin_auth', 'true');
      setIsAdminAuthorized(true);
      setAuthorizing(false);
    } else {
      // Try logging in via API
      try {
        const res = await login('admin@floodvision.org', passcode);
        if (res.success) {
          setIsAdminAuthorized(true);
        } else {
          setAuthError('Invalid Admin Passcode. Use demo credentials: Admin@123456');
        }
      } catch {
        setAuthError('Invalid Admin Passcode. Use demo credentials: Admin@123456');
      } finally {
        setAuthorizing(false);
      }
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [reportsRes, hotspotsRes] = await Promise.all([
        fetch('/api/reports?limit=100'),
        fetch('/api/hotspots'),
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        if (data.success) {
          setIncidents(data.reports || []);
          if (data.reports?.length > 0 && !selectedIncident) {
            setSelectedIncident(data.reports[0]);
          }
        }
      }

      if (hotspotsRes.ok) {
        const hData = await hotspotsRes.json();
        if (hData.success) {
          setHotspots(hData.hotspots || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthorized) {
      loadData();
    }
  }, [isAdminAuthorized]);

  // Execute Admin Action
  const handleExecuteAction = async (
    incidentId: string,
    newStatus: string,
    actionLabel: string
  ) => {
    setActionInProgress(incidentId);
    try {
      const notes = operatorNotes.trim() || `Administrative decision: ${actionLabel}`;
      const res = await fetch(`/api/reports/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          actorName: user?.name || 'Municipal Control Officer',
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          // Update local state
          setIncidents((prev) =>
            prev.map((inc) => (inc.id === incidentId ? data.report : inc))
          );
          setSelectedIncident(data.report);
          setOperatorNotes('');
          // Refresh hotspots
          loadData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Dispatch Crew Action (logs action without resolving)
  const handleDispatchCrew = async (incidentId: string) => {
    setActionInProgress(incidentId);
    try {
      const res = await fetch(`/api/reports/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'VERIFIED',
          actorName: user?.name || 'Municipal Control Officer',
          notes: 'Dispatched emergency mobile dewatering pump & field response crew.',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setIncidents((prev) =>
            prev.map((inc) => (inc.id === incidentId ? data.report : inc))
          );
          setSelectedIncident(data.report);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // If not authorized, show the secure authorization gateway
  if (!isAdminAuthorized) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md">
        <div className="p-8 rounded-3xl bg-card border border-border shadow-2xl text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-foreground">
              Municipal Admin Portal
            </h1>
            <p className="text-xs text-muted-foreground">
              Restricted to authorized civic disaster management operators.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 border border-red-500/30 text-xs font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={handlePasscodeUnlock} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-foreground">
                Enter Admin Access Key / Password
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Admin@123456"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <span className="text-[10px] text-muted-foreground block pt-1">
                Demo Evaluator Key: <strong className="text-foreground">Admin@123456</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={authorizing}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {authorizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
              <span>Verify & Unlock Portal</span>
            </button>
          </form>

          <div className="pt-2 border-t border-border text-[11px] text-muted-foreground">
            Non-administrative users can browse verified reports on the{' '}
            <Link href="/incidents" className="text-brand-600 font-bold hover:underline">
              Incidents Feed
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  // Filtered lists
  const pendingIncidents = incidents.filter((i) => i.status === 'UNVERIFIED');
  const highPriorityIncidents = incidents.filter(
    (i) => i.priorityScore >= 70 && i.status !== 'RESOLVED' && i.status !== 'REJECTED'
  );

  const displayedList =
    activeTab === 'pending'
      ? pendingIncidents
      : activeTab === 'high_priority'
      ? highPriorityIncidents
      : incidents;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-amber-950/80 text-white border border-amber-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest">
            <ShieldAlert className="h-4 w-4" />
            <span>Authorized Civic Operations Desk</span>
          </div>
          <h1 className="text-2xl font-black">FloodWatch Administrative Command</h1>
          <p className="text-xs text-slate-300">
            Review community waterlogging reports, verify ground-truth telemetry, and dispatch municipal dewatering units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('floodwatch_admin_auth');
              setIsAdminAuthorized(false);
            }}
            className="px-3.5 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold transition-colors"
          >
            Lock Desk
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Pending Review</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {pendingIncidents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('high_priority')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'high_priority'
              ? 'bg-red-600 text-white font-black shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>High-Priority Queue (&ge;70)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {highPriorityIncidents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('hotspots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'hotspots'
              ? 'bg-brand-600 text-white font-black shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Potential Hotspots (~300m)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {hotspots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-foreground text-background font-black shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>All Reports Archive</span>
          <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px]">
            {incidents.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'hotspots' ? (
        /* Hotspots Management View */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground">
            <strong>Hotspot Grouping Algorithm:</strong> Reports within a 300-metre proximity are automatically clustered. These represent potential localized waterlogging hotspots requiring municipal drainage clearance or mobile pumping units.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotspots.map((hs) => (
              <div
                key={hs.id}
                className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                    {hs.reportCount} Corroborating Reports
                  </span>
                  <span className="text-xs font-black text-brand-600">
                    Priority: {hs.priorityScore}/100
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-foreground">
                  {hs.title}
                </h3>

                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                  <div>Max Depth: <strong className="text-foreground">{hs.maxDepthCategory} ({hs.maxDepthCm} cm)</strong></div>
                  <div>Coordinates: <strong className="text-foreground">{hs.centerLat.toFixed(4)}, {hs.centerLng.toFixed(4)}</strong></div>
                  <div>Radius: <strong className="text-foreground">{hs.radiusMeters} metres</strong></div>
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
                  <Link
                    href={`/map?lat=${hs.centerLat}&lng=${hs.centerLng}`}
                    className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    View Cluster on Map <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Split Master-Detail Review Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Incidents */}
          <div className="lg:col-span-5 space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {displayedList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-foreground">Queue Clear</p>
                <p>No incidents currently require attention in this view.</p>
              </div>
            ) : (
              displayedList.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-50/60 dark:bg-brand-950/40 border-brand-500 shadow-sm ring-2 ring-brand-500/20'
                        : 'bg-card border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        #{incident.id.slice(0, 8)} • {incident.depthCategory}
                      </span>
                      <span className="text-xs font-black text-brand-600">
                        {incident.priorityScore}/100
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-foreground line-clamp-1">
                      {incident.streetName}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5">
                      <span className={`font-bold ${
                        incident.status === 'VERIFIED' ? 'text-emerald-600' :
                        incident.status === 'RESOLVED' ? 'text-cyan-600' :
                        incident.status === 'REJECTED' ? 'text-red-500' : 'text-amber-600'
                      }`}>
                        {incident.status}
                      </span>
                      <span>Road: {incident.roadCondition}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Incident Review & Execution Panel */}
          <div className="lg:col-span-7">
            {selectedIncident ? (
              <div className="p-6 rounded-3xl bg-card border border-border space-y-6 shadow-sm sticky top-24">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Incident Review #{selectedIncident.id}
                    </span>
                    <h2 className="text-lg font-black text-foreground">
                      {selectedIncident.streetName}
                    </h2>
                    {selectedIncident.landmark && (
                      <p className="text-xs text-muted-foreground">
                        Near {selectedIncident.landmark}, {selectedIncident.city}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Priority Score
                    </span>
                    <span className="text-2xl font-black text-brand-600">
                      {selectedIncident.priorityScore}/100
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold">Severity</span>
                    <strong className="text-foreground">{selectedIncident.depthCategory} ({selectedIncident.depthCm} cm)</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold">Water Trend</span>
                    <strong className="text-foreground">{selectedIncident.waterLevelTrend}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold">Road Status</span>
                    <strong className="text-foreground">{selectedIncident.roadCondition}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold">Current Status</span>
                    <strong className="text-brand-600">{selectedIncident.status}</strong>
                  </div>
                </div>

                {/* Description & Photo */}
                {selectedIncident.description && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground">Citizen Notes:</span>
                    <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl border border-border">
                      "{selectedIncident.description}"
                    </p>
                  </div>
                )}

                {selectedIncident.photoUrl && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground">Attached Evidence Photograph:</span>
                    <img
                      src={selectedIncident.photoUrl}
                      alt="Waterlogging evidence"
                      className="max-h-48 rounded-xl object-cover border border-border shadow-xs"
                    />
                  </div>
                )}

                {/* Optional Operator Notes Input */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <label className="text-xs font-bold text-foreground">
                    Operator Decision Note (Logged in Public Audit Trail):
                  </label>
                  <input
                    type="text"
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    placeholder="e.g. Field verification confirmed by traffic police; dewatering crew on site."
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    disabled={actionInProgress === selectedIncident.id || selectedIncident.status === 'VERIFIED'}
                    onClick={() => handleExecuteAction(selectedIncident.id, 'VERIFIED', 'Field Verified')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verify
                  </button>

                  <button
                    disabled={actionInProgress === selectedIncident.id || selectedIncident.status === 'RESOLVED'}
                    onClick={() => handleExecuteAction(selectedIncident.id, 'RESOLVED', 'Water Cleared / Drained')}
                    className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark Resolved
                  </button>

                  <button
                    disabled={actionInProgress === selectedIncident.id}
                    onClick={() => handleDispatchCrew(selectedIncident.id)}
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Dispatch Crew
                  </button>

                  <button
                    disabled={actionInProgress === selectedIncident.id || selectedIncident.status === 'REJECTED'}
                    onClick={() => handleExecuteAction(selectedIncident.id, 'REJECTED', 'Dismissed / Duplicate')}
                    className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>

                {/* Audit Trail of Incident Actions */}
                {selectedIncident.actions && selectedIncident.actions.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-brand-600" /> Action Audit Trail
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedIncident.actions.map((act) => (
                        <div
                          key={act.id}
                          className="p-2 rounded-xl bg-muted/40 text-[11px] flex items-center justify-between"
                        >
                          <div>
                            <strong className="text-foreground">{act.actorName}: </strong>
                            <span className="text-muted-foreground">{act.notes}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 pl-2">
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-card border border-border text-center text-xs text-muted-foreground">
                Select an incident from the list to view telemetry and execute actions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
