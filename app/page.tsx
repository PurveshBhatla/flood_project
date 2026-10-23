'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Waves,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ListFilter,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Compass,
  Building2,
  Car
} from 'lucide-react';

interface SystemStats {
  totalReports: number;
  verifiedReports: number;
  unverifiedReports: number;
  resolvedReports: number;
  staleReports: number;
  activeHotspots: number;
  highPriorityReports: number;
  avgPriority: number;
}

interface RecentIncident {
  id: string;
  streetName: string;
  landmark: string | null;
  city: string;
  depthCategory: string;
  depthCm: number;
  waterLevelTrend: string;
  roadCondition: string;
  status: string;
  priorityScore: number;
  upvotes: number;
  createdAt: string;
}

export default function HomePage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          fetch('/api/reports/stats'),
          fetch('/api/reports?limit=3'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) setStats(statsData.stats);
        }

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          if (reportsData.success) setRecentIncidents(reportsData.reports || []);
        }
      } catch (err) {
        console.error('Failed to load live statistics:', err);
      } finally {
        setLoadingStats(false);
      }
    }

    loadData();
  }, []);

  const getSeverityBadge = (category: string) => {
    switch (category.toUpperCase()) {
      case 'SUBMERGED':
        return { label: 'Severe / Submerged (>90cm)', color: 'bg-red-500/10 text-red-600 border-red-500/30' };
      case 'WAIST':
        return { label: 'High / Waist (45-90cm)', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' };
      case 'KNEE':
        return { label: 'Moderate / Knee (15-45cm)', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
      case 'ANKLE':
      default:
        return { label: 'Mild / Ankle (<15cm)', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-background text-white py-20 lg:py-28 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/25 via-transparent to-transparent pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold tracking-wide uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            Community-Powered Civic Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Flood<span className="text-brand-400">Watch</span> — Community-Powered Waterlogging Intelligence
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto">
            A crowdsourced urban flood monitoring platform enabling citizens to report street waterlogging with photos, road conditions, and water trends. Powered by spatial duplicate detection and proximity clustering to guide municipal response.
          </p>

          {/* Primary CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/map"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-brand-600/30 hover:scale-105 flex items-center justify-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              View Interactive Live Map
            </Link>

            <Link
              href="/report"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/25 hover:scale-105 flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Report Waterlogging Incident
            </Link>

            <Link
              href="/incidents"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <ListFilter className="h-4 w-4" />
              Browse Incidents
            </Link>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-center gap-2 font-medium">
            <span>✓ OpenStreetMap Powered (Zero Paid Keys)</span>
            <span>•</span>
            <span>✓ Transparent 0–100 Priority Scoring</span>
            <span>•</span>
            <span>✓ Persistent Database Storage</span>
          </div>
        </div>
      </section>

      {/* 2. REAL SYSTEM STATISTICS (SUPPORTED BY ACTUAL STORED DATABASE DATA) */}
      <section className="py-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-6">
            <span className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Live Database Verification
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Community Waterlogging Reporting Metrics
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time counts queried directly from SQLite application database.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="p-5 rounded-2xl bg-muted/40 border border-border text-center space-y-1 shadow-xs">
              <span className="text-3xl sm:text-4xl font-black text-foreground">
                {loadingStats ? <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600" /> : stats?.totalReports ?? 0}
              </span>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Reports Filed
              </p>
              <span className="text-[11px] text-muted-foreground block">
                Logged by community
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1 shadow-xs">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {loadingStats ? <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" /> : stats?.verifiedReports ?? 0}
              </span>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Verified Incidents
              </p>
              <span className="text-[11px] text-muted-foreground block">
                Validated by operators
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-1 shadow-xs">
              <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                {loadingStats ? <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600" /> : stats?.activeHotspots ?? 0}
              </span>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Potential Hotspots
              </p>
              <span className="text-[11px] text-muted-foreground block">
                Within ~300m clusters
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-center space-y-1 shadow-xs">
              <span className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400">
                {loadingStats ? <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-600" /> : stats?.resolvedReports ?? 0}
              </span>
              <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                Resolved Locations
              </p>
              <span className="text-[11px] text-muted-foreground block">
                Water cleared by civic teams
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM & SOLUTION EXPLANATION */}
      <section className="py-16 container mx-auto px-4 md:px-8 max-w-6xl space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
            Why Traditional Monitoring Fails
          </span>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            Bridging The Gap Between Regional Flood Alerts & Street Reality
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Major river gauge sensors and weather radars can forecast regional precipitation, but they cannot see the choked storm drain or flooded underpass causing a 2-hour traffic standstill or submerging vehicles on your street.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs hover:border-brand-500/50 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">The Urban Problem</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Monsoon cloudbursts cause rapid, hyper-local waterlogging. Open manholes, stranded autorickshaws, and blocked roads occur in minutes without warning to daily commuters or civic rescue teams.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs hover:border-brand-500/50 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">Citizen Telemetry</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Commuters and neighborhood residents report exact street waterlogging depth (Ankle, Knee, Waist, Submerged), road conditions (Passable, Difficult, Blocked), and whether levels are rising or falling.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs hover:border-brand-500/50 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">Spatial Intelligence</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated 150m duplicate detection flags redundant entries, 300m proximity clustering creates potential hotspots, and a normalized 0–100 priority score helps municipal desks dispatch dewatering pumps effectively.
            </p>
          </div>
        </div>
      </section>

      {/* 4. RECENT INCIDENTS FEED PREVIEW */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider">
                Ground-Truth Community Feed
              </span>
              <h2 className="text-2xl font-black text-foreground">
                Recent Waterlogging Incidents
              </h2>
            </div>
            <Link
              href="/incidents"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 w-fit"
            >
              View Full Incident Register <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">No reports recorded yet</p>
              <p className="text-xs text-muted-foreground">Be the first to report an incident in your area.</p>
              <Link href="/report" className="inline-block mt-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
                Submit Report
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentIncidents.map((incident) => {
                const badge = getSeverityBadge(incident.depthCategory);
                return (
                  <div
                    key={incident.id}
                    className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Priority: <strong className="text-brand-600">{incident.priorityScore}/100</strong>
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-foreground leading-snug line-clamp-2">
                        {incident.streetName}
                      </h4>
                      {incident.landmark && (
                        <p className="text-xs text-muted-foreground">
                          Near {incident.landmark}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-muted/60 p-2 rounded-xl">
                          <span className="text-muted-foreground block text-[10px]">Water Trend:</span>
                          <span className="font-bold text-foreground">{incident.waterLevelTrend}</span>
                        </div>
                        <div className="bg-muted/60 p-2 rounded-xl">
                          <span className="text-muted-foreground block text-[10px]">Road Status:</span>
                          <span className="font-bold text-foreground">{incident.roadCondition}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className={`font-bold flex items-center gap-1 ${
                        incident.status === 'VERIFIED' ? 'text-emerald-600' :
                        incident.status === 'RESOLVED' ? 'text-cyan-600' :
                        incident.status === 'STALE' ? 'text-muted-foreground' : 'text-amber-600'
                      }`}>
                        {incident.status === 'VERIFIED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {incident.status}
                      </span>
                      <Link
                        href={`/map?focus=${incident.id}`}
                        className="text-brand-600 hover:underline font-bold flex items-center gap-1"
                      >
                        Locate on Map <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. HOW IT WORKS / METHODOLOGY OVERVIEW */}
      <section className="py-16 container mx-auto px-4 md:px-8 max-w-6xl space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold text-brand-600 uppercase tracking-widest">
            Algorithmic Pipeline
          </span>
          <h2 className="text-3xl font-black text-foreground">
            How Community Intelligence Powers Decision-Making
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-2 text-center shadow-xs">
            <div className="h-10 w-10 mx-auto rounded-xl bg-brand-600/10 text-brand-600 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h4 className="font-extrabold text-sm text-foreground">1. Citizen Entry</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Residents record GPS coordinates, photo evidence, depth category, and road blockage.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-2 text-center shadow-xs">
            <div className="h-10 w-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h4 className="font-extrabold text-sm text-foreground">2. 150m Duplicate Check</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Haversine formula identifies reports within 150m, linking duplicates without discarding data.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-2 text-center shadow-xs">
            <div className="h-10 w-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h4 className="font-extrabold text-sm text-foreground">3. 300m Hotspots</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Spatial clustering aggregates reports into Potential Waterlogging Hotspots for civic pump units.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-2 text-center shadow-xs">
            <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
              4
            </div>
            <h4 className="font-extrabold text-sm text-foreground">4. Priority Dispatch</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              0–100 priority score evaluates depth, trend, road blockage, density, and recency decay.
            </p>
          </div>
        </div>

        {/* Administrative Portal Callout */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-brand-950 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-left">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
              Municipal & Disaster Response Desk
            </span>
            <h3 className="text-xl font-black">
              Authorized Civic Operator Interface
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Authorized municipal administrators can review citizen submissions, verify ground-truth telemetry, mark resolved drains, and track action audit trails.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 transition-transform hover:scale-105 shadow-md"
          >
            Access Admin Command Portal
          </Link>
        </div>
      </section>
    </div>
  );
}
