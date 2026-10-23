'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ListFilter,
  Search,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ThumbsUp,
  TrendingUp,
  Car,
  Layers,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ShieldCheck
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
  hazardTags: string; // JSON
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
  verifiedAt: string | null;
  resolvedAt: string | null;
  hotspot?: {
    id: string;
    title: string;
  } | null;
  actions?: Array<{
    id: string;
    actionType: string;
    actorName: string;
    notes: string;
    createdAt: string;
  }>;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roadFilter, setRoadFilter] = useState('ALL');
  const [trendFilter, setTrendFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'upvotes'>('priority');

  // Expanded score breakdowns
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severityFilter !== 'ALL') params.set('severity', severityFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (roadFilter !== 'ALL') params.set('roadCondition', roadFilter);
      if (trendFilter !== 'ALL') params.set('waterLevelTrend', trendFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          let list: Incident[] = data.reports || [];

          // Sort in-memory
          if (sortBy === 'priority') {
            list.sort((a, b) => b.priorityScore - a.priorityScore);
          } else if (sortBy === 'newest') {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          } else if (sortBy === 'upvotes') {
            list.sort((a, b) => b.upvotes - a.upvotes);
          }

          setIncidents(list);
        }
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter, roadFilter, trendFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/reports/${id}/upvote`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === id ? { ...inc, upvotes: data.upvotes } : inc))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityBadge = (category: string) => {
    switch (category.toUpperCase()) {
      case 'SUBMERGED':
        return { label: 'Severe / Submerged', color: 'bg-red-500/10 text-red-600 border-red-500/30' };
      case 'WAIST':
        return { label: 'High / Waist-Deep', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' };
      case 'KNEE':
        return { label: 'Moderate / Knee-Deep', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
      case 'ANKLE':
      default:
        return { label: 'Mild / Ankle-Deep', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
    }
  };

  const getStatusBadge = (status: string, isStale: boolean) => {
    if (status === 'VERIFIED') {
      return {
        label: 'Verified Report',
        icon: CheckCircle2,
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      };
    }
    if (status === 'RESOLVED') {
      return {
        label: 'Resolved / Drained',
        icon: CheckCircle2,
        color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
      };
    }
    if (status === 'STALE' || isStale) {
      return {
        label: 'Potentially Stale (>6h)',
        icon: Clock,
        color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
      };
    }
    return {
      label: 'Unverified Citizen Report',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    };
  };

  const parseTags = (tagStr: string): string[] => {
    try {
      return JSON.parse(tagStr);
    } catch {
      return [];
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
            <ListFilter className="h-4 w-4" />
            <span>Community Telemetry Feed</span>
          </div>
          <h1 className="text-3xl font-black text-foreground">
            Waterlogging Incidents Register
          </h1>
          <p className="text-xs text-muted-foreground">
            Searchable, filterable community submissions sorted by transparent incident priority scores.
          </p>
        </div>

        <Link
          href="/report"
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-sm hover:scale-105 flex items-center gap-1.5 w-fit"
        >
          <PlusCircle className="h-4 w-4" />
          Report Waterlogging
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-5 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by street name, landmark, or description (e.g. Kurla, Underpass, LBS Marg)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
          >
            Search
          </button>
        </form>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-semibold">
          {/* Severity */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-background border border-input text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="SUBMERGED">Severe / Submerged</option>
              <option value="WAIST">High / Waist</option>
              <option value="KNEE">Moderate / Knee</option>
              <option value="ANKLE">Mild / Ankle</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
              Verification Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-background border border-input text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="RESOLVED">Resolved / Drained</option>
              <option value="STALE">Stale (&gt;6h)</option>
            </select>
          </div>

          {/* Road Condition */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
              Road Condition
            </label>
            <select
              value={roadFilter}
              onChange={(e) => setRoadFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-background border border-input text-xs"
            >
              <option value="ALL">All Road Conditions</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DIFFICULT">Difficult</option>
              <option value="PASSABLE">Passable</option>
            </select>
          </div>

          {/* Water Trend */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
              Water Trend
            </label>
            <select
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-background border border-input text-xs"
            >
              <option value="ALL">All Trends</option>
              <option value="RISING">Rising</option>
              <option value="STABLE">Stable</option>
              <option value="FALLING">Falling</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-background border border-input text-xs font-bold text-brand-600"
            >
              <option value="priority">Priority Score (Highest)</option>
              <option value="newest">Newest First</option>
              <option value="upvotes">Most Upvotes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Count & Freshness Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-muted-foreground gap-2">
        <span>Showing <strong>{incidents.length}</strong> community reports matching criteria.</span>
        <span className="text-[11px] flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          Reports older than 6 hours are automatically flagged as stale.
        </span>
      </div>

      {/* Incidents Cards List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-brand-600" />
          <p className="text-xs text-muted-foreground font-semibold">Loading incidents telemetry...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-4 shadow-xs">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-extrabold text-foreground">No Incidents Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            No waterlogging incidents match your current search and filter criteria. You can clear the filters or report a new incident.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSeverityFilter('ALL');
              setStatusFilter('ALL');
              setRoadFilter('ALL');
              setTrendFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-muted text-xs font-bold hover:bg-muted/80 text-foreground"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => {
            const severity = getSeverityBadge(incident.depthCategory);
            const statusInfo = getStatusBadge(incident.status, incident.isStale);
            const StatusIcon = statusInfo.icon;
            const tags = parseTags(incident.hazardTags);
            const isExpanded = expandedId === incident.id;

            return (
              <div
                key={incident.id}
                className="p-5 rounded-3xl bg-card border border-border hover:border-brand-500/40 transition-all shadow-xs space-y-4"
              >
                {/* Top Row: Street name, Badges, Priority Meter */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${severity.color}`}>
                        {severity.label} ({incident.depthCm} cm)
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>

                      {incident.isDuplicate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                          Proximity Duplicate Flagged
                        </span>
                      )}

                      {incident.hotspot && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                          Clustered Hotspot
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-foreground">
                      {incident.streetName}
                    </h3>
                    {incident.landmark && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-brand-600" />
                        {incident.landmark}, {incident.city}
                      </p>
                    )}
                  </div>

                  {/* Priority Score Gauge */}
                  <div className="flex items-center gap-3 shrink-0 bg-muted/60 p-3 rounded-2xl border border-border">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Priority Score
                      </span>
                      <span className="text-xl font-black text-brand-600">
                        {incident.priorityScore}
                        <span className="text-xs font-normal text-muted-foreground">/100</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                      className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="View Score Calculation"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Road Condition & Trend Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1 rounded-xl bg-muted text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Road: <strong>{incident.roadCondition}</strong></span>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-muted text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                    <span>Trend: <strong>{incident.waterLevelTrend}</strong></span>
                  </div>

                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold"
                    >
                      #{t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {/* Description & Photo */}
                {incident.description && (
                  <p className="text-xs text-foreground/80 leading-relaxed bg-background/50 p-3 rounded-2xl border border-border/50">
                    "{incident.description}"
                  </p>
                )}

                {incident.photoUrl && (
                  <div className="pt-1">
                    <img
                      src={incident.photoUrl}
                      alt="Incident photograph evidence"
                      className="max-h-48 rounded-2xl object-cover border border-border shadow-xs"
                    />
                  </div>
                )}

                {/* Expandable Priority Breakdown */}
                {isExpanded && (
                  <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs space-y-2 animate-fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-brand-600">
                      <Info className="h-4 w-4" />
                      <span>Priority Score Mathematical Formula Breakdown</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Score = (Base Severity + Water Trend + Road Condition + Cluster Density) × Recency Factor
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="bg-card p-2 rounded-xl border border-border">
                        <span className="text-muted-foreground block text-[10px]">Depth Category</span>
                        <strong className="text-foreground">{incident.depthCategory}</strong>
                      </div>
                      <div className="bg-card p-2 rounded-xl border border-border">
                        <span className="text-muted-foreground block text-[10px]">Trend Modifier</span>
                        <strong className="text-foreground">{incident.waterLevelTrend}</strong>
                      </div>
                      <div className="bg-card p-2 rounded-xl border border-border">
                        <span className="text-muted-foreground block text-[10px]">Road Status</span>
                        <strong className="text-foreground">{incident.roadCondition}</strong>
                      </div>
                      <div className="bg-card p-2 rounded-xl border border-border">
                        <span className="text-muted-foreground block text-[10px]">Status</span>
                        <strong className="text-foreground">{incident.isStale ? 'Stale Decay (0.5x)' : 'Active (1.0x)'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Footer: Metadata, Upvote, Map Link */}
                <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {getTimeAgo(incident.createdAt)}
                    </span>
                    <span>•</span>
                    <span>By: <strong className="text-foreground">{incident.reportedBy || 'Citizen'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleUpvote(incident.id, e)}
                      className="px-3 py-1.5 rounded-xl border border-input hover:border-brand-500 bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Confirm this incident"
                    >
                      <ThumbsUp className="h-3.5 w-3.5 text-brand-600" />
                      <span>{incident.upvotes} Upvotes</span>
                    </button>

                    <Link
                      href={`/map?focus=${incident.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                    >
                      <span>Show on Map</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
