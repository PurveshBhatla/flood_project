'use client';

import React, { useState } from 'react';
import { RescueResourceSummary, RescueResourceItem } from '@/lib/services/rescue-resource.service';
import {
  ShieldAlert,
  Ambulance,
  Flame,
  Tent,
  Ship,
  Hospital,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface RescueResourcesCardProps {
  data?: RescueResourceSummary | null;
  onFocusLocation?: (lat: number, lng: number, name: string) => void;
}

export default function RescueResourcesCard({ data, onFocusLocation }: RescueResourcesCardProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!data) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-muted/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isDemo = data.mode === 'demo';
  const summary = data.summary;

  const resourceCategories = [
    {
      type: 'AMBULANCE',
      label: summary.ambulances.label,
      count: summary.ambulances.count,
      status: summary.ambulances.status,
      icon: Ambulance,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10 border-red-500/20',
    },
    {
      type: 'RESCUE_TEAM',
      label: summary.rescueTeams.label,
      count: summary.rescueTeams.count,
      status: summary.rescueTeams.status,
      icon: Flame,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      type: 'SHELTER',
      label: summary.shelters.label,
      count: summary.shelters.count,
      status: summary.shelters.status,
      extraText: `${summary.shelters.totalCapacity} capacity`,
      icon: Tent,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      type: 'RESCUE_BOAT',
      label: summary.rescueBoats.label,
      count: summary.rescueBoats.count,
      status: summary.rescueBoats.status,
      icon: Ship,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      type: 'HOSPITAL',
      label: summary.hospitals.label,
      count: summary.hospitals.count,
      status: summary.hospitals.status,
      icon: Hospital,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      type: 'RELIEF_SUPPLY',
      label: summary.supplyKits.label,
      count: summary.supplyKits.count,
      status: summary.supplyKits.status,
      icon: Package,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  const filteredResources = selectedType
    ? data.resources.filter((r) => r.type === selectedType)
    : data.resources;

  const renderStatusBadge = (status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE') => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> AVAILABLE
          </span>
        );
      case 'LIMITED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <AlertCircle className="h-3 w-3" /> LIMITED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
            <XCircle className="h-3 w-3" /> UNAVAILABLE
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div>
          <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Emergency Preparedness & Dispatch
          </span>
          <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            🚨 RESCUE RESOURCES AVAILABLE
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
              isDemo
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {isDemo ? '● DEMO RESOURCES' : '● LIVE RESOURCES'}
          </span>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {resourceCategories.map((cat) => {
          const IconComp = cat.icon;
          const isSelected = selectedType === cat.type;

          return (
            <button
              key={cat.type}
              onClick={() => {
                setSelectedType(isSelected ? null : cat.type);
                setExpanded(true);
              }}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/30'
                  : 'bg-muted/40 hover:bg-muted/80 border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <IconComp className={`h-5 w-5 ${cat.color}`} />
                {renderStatusBadge(cat.status)}
              </div>

              <div className="mt-2">
                <span className="text-2xl font-extrabold text-foreground block">
                  {cat.count}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground line-clamp-1 block">
                  {cat.label}
                </span>
                {cat.extraText && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                    {cat.extraText}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Expandable Detailed Resource Inventory List */}
      <div className="pt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-xs text-muted-foreground font-semibold hover:text-foreground py-1 border-t border-border/60"
        >
          <span>
            {selectedType
              ? `Filter: ${resourceCategories.find((c) => c.type === selectedType)?.label} (${filteredResources.length} Deployment Stations)`
              : `View All Staged Rescue Units (${data.resources.length} Depots)`}
          </span>
          <span className="flex items-center gap-1 text-brand-600 font-bold">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? 'Collapse Units' : 'Expand Resource Locations'}
          </span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredResources.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/60 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.iconName}</span>
                    <span className="font-extrabold text-xs text-foreground">{item.name}</span>
                    {renderStatusBadge(item.status)}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand-500" /> {item.locationName}
                    </span>
                    {item.contactPhone && (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Phone className="h-3 w-3 text-emerald-500" /> {item.contactPhone}
                      </span>
                    )}
                  </div>
                  {item.capacityDetails && (
                    <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                      Capacities: {item.capacityDetails}
                    </p>
                  )}
                </div>

                {onFocusLocation && (
                  <button
                    onClick={() => onFocusLocation(item.latitude, item.longitude, item.name)}
                    className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-[11px] font-bold rounded-lg border border-brand-500/30 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Locate on Map
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Notice Banner */}
      <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 leading-snug">
          <Info className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          {isDemo
            ? 'Demo Availability Mode — Resources are simulated for disaster preparedness prototyping.'
            : 'Live Emergency Feed — Connected to District Disaster Response Control.'}
        </span>
        <Link
          href="/safety"
          className="text-brand-600 dark:text-brand-400 font-bold hover:underline shrink-0 flex items-center gap-1 text-[11px]"
        >
          Safety Guidelines <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
