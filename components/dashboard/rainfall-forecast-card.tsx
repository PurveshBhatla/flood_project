'use client';

import React, { useState, useEffect } from 'react';
import { RainfallForecastResult } from '@/lib/services/weather.service';
import {
  CloudRain,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Sun,
  CheckCircle2,
  Calendar,
  Zap
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface RainfallForecastCardProps {
  forecast?: RainfallForecastResult | null;
  locationName?: string;
}

export default function RainfallForecastCard({ forecast, locationName }: RainfallForecastCardProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!forecast?.updatedAt) return;
    const updatedAtTime = new Date(forecast.updatedAt).getTime();
    
    const interval = setInterval(() => {
      const diffSec = Math.max(0, Math.floor((Date.now() - updatedAtTime) / 1000));
      setSecondsAgo(diffSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [forecast?.updatedAt]);

  if (!forecast) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-muted/60 rounded-xl" />
          <div className="h-20 bg-muted/60 rounded-xl" />
          <div className="h-20 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const isDemo = forecast.mode === 'demo';
  const updatedTimeLabel =
    secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)} min ago`;

  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-5 shadow-sm relative overflow-hidden transition-all">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
            <CloudRain className="h-3.5 w-3.5 text-blue-500" /> Early Warning Hydrological Forecast
          </span>
          <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2 mt-0.5">
            🌧️ RAINFALL FORECAST
            {locationName && (
              <span className="text-xs text-muted-foreground font-normal">
                ({locationName})
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide uppercase ${
              isDemo
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isDemo ? '● DEMO FORECAST' : '● LIVE FORECAST'}
          </span>
        </div>
      </div>

      {/* Current Intensity Indicator */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/80">
        <span className="text-xs font-semibold text-muted-foreground">Current Rainfall Intensity</span>
        <span className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          {forecast.currentMmHr} mm/hr
        </span>
      </div>

      {/* Forecast Windows (Next 1h, Next 3h, Next 6h) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Next 1h */}
        <div className={`p-3.5 rounded-xl border space-y-1 ${forecast.next1hClassification.bgClass} border-border/80`}>
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Next 1 Hour</span>
          <div className="text-xl font-extrabold text-foreground">
            {forecast.next1hMmHr} <span className="text-xs font-normal text-muted-foreground">mm/hr</span>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${forecast.next1hClassification.badgeClass}`}>
            {forecast.next1hClassification.category}
          </span>
        </div>

        {/* Next 3h */}
        <div className={`p-3.5 rounded-xl border space-y-1 ${forecast.next3hClassification.bgClass} border-border/80`}>
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Next 3 Hours Peak</span>
          <div className="text-xl font-extrabold text-foreground">
            {forecast.next3hPeakMmHr} <span className="text-xs font-normal text-muted-foreground">mm/hr</span>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${forecast.next3hClassification.badgeClass}`}>
            {forecast.next3hClassification.category}
          </span>
        </div>

        {/* Next 6h */}
        <div className={`p-3.5 rounded-xl border space-y-1 ${forecast.next6hClassification.bgClass} border-border/80`}>
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Next 6 Hours Peak</span>
          <div className="text-xl font-extrabold text-foreground">
            {forecast.next6hPeakMmHr} <span className="text-xs font-normal text-muted-foreground">mm/hr</span>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${forecast.next6hClassification.badgeClass}`}>
            {forecast.next6hClassification.category}
          </span>
        </div>
      </div>

      {/* Early Warning Banner */}
      <div className={`p-4 rounded-xl border shadow-sm space-y-1.5 ${forecast.warningColorClass}`}>
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm flex items-center gap-2">
            <span>{forecast.warningIcon}</span>
            <span>{forecast.warningTitle}</span>
          </h4>
          {forecast.precipitationProbability !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-background/80 border border-border text-foreground">
              Probability: {forecast.precipitationProbability}%
            </span>
          )}
        </div>

        <p className="text-xs font-medium text-foreground/90 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>Timing: <strong>{forecast.expectedTimeText}</strong></span>
        </p>
      </div>

      {/* 6-Hour Hourly Forecast Grid */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
          6-Hour Rainfall Forecast Trend
        </span>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {forecast.hourly.map((step) => (
            <div
              key={step.hourOffset}
              className={`p-2 rounded-xl border text-center space-y-1 ${step.bgClass} border-border/60 hover:scale-105 transition-transform`}
            >
              <span className="text-[10px] font-extrabold text-muted-foreground block">
                {step.timeLabel}
              </span>
              <span className={`text-xs font-extrabold block ${step.textClass}`}>
                {step.precipitationMmHr}
              </span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: step.hex }} title={`${step.category}: ${step.precipitationMmHr} mm/hr`} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Timestamp */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
          Forecast updated: <strong className="text-foreground font-semibold">{updatedTimeLabel}</strong>
        </span>
        <span className="italic text-[10px]">Open-Meteo Rainfall Pipeline</span>
      </div>
    </div>
  );
}
