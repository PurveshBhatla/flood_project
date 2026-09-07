import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDepthColor(depthCm: number): { hex: string; bg: string; badge: string; text: string; label: string } {
  if (depthCm >= 60.0) {
    return { hex: '#7f1d1d', bg: 'bg-red-950/20', badge: 'bg-red-950 text-white', text: 'text-red-950 dark:text-red-400', label: 'DARK RED (60+ cm)' };
  } else if (depthCm >= 30.0) {
    return { hex: '#ef4444', bg: 'bg-red-500/10', badge: 'bg-red-500 text-white', text: 'text-red-500', label: 'RED (30-60 cm)' };
  } else if (depthCm >= 15.0) {
    return { hex: '#f97316', bg: 'bg-orange-500/10', badge: 'bg-orange-500 text-white', text: 'text-orange-500', label: 'ORANGE (15-30 cm)' };
  } else if (depthCm >= 5.0) {
    return { hex: '#f59e0b', bg: 'bg-amber-500/10', badge: 'bg-amber-500 text-white', text: 'text-amber-500', label: 'YELLOW (5-15 cm)' };
  } else {
    return { hex: '#10b981', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500 text-white', text: 'text-emerald-500', label: 'GREEN (0-5 cm)' };
  }
}

export function getRiskLevelColor(level: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  hex: string;
} {
  switch (level.toUpperCase()) {
    case 'DARK_RED':
      return {
        bg: 'bg-red-950/20',
        text: 'text-red-950 dark:text-red-400',
        border: 'border-red-900/50',
        badge: 'bg-red-950 text-white',
        hex: '#7f1d1d',
      };
    case 'CRITICAL':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/30',
        badge: 'bg-red-500 text-white',
        hex: '#ef4444',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-500',
        border: 'border-orange-500/30',
        badge: 'bg-orange-500 text-white',
        hex: '#f97316',
      };
    case 'MODERATE':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500 text-white',
        hex: '#f59e0b',
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500 text-white',
        hex: '#10b981',
      };
  }
}

export const RAINFALL_THRESHOLDS = {
  LOW_MAX: 10,
  MODERATE_MAX: 25,
  HEAVY_MAX: 50,
};

export interface RainfallClassification {
  category: 'LOW' | 'MODERATE' | 'HEAVY' | 'EXTREME';
  color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  hex: string;
  label: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  rangeLabel: string;
}

export function classifyRainfallIntensity(mmPerHour: number): RainfallClassification {
  if (mmPerHour <= RAINFALL_THRESHOLDS.LOW_MAX) {
    return {
      category: 'LOW',
      color: 'GREEN',
      hex: '#10b981',
      label: 'Low',
      badgeClass: 'bg-emerald-500 text-white',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-500',
      rangeLabel: '0–10 mm/hr',
    };
  } else if (mmPerHour <= RAINFALL_THRESHOLDS.MODERATE_MAX) {
    return {
      category: 'MODERATE',
      color: 'YELLOW',
      hex: '#f59e0b',
      label: 'Moderate',
      badgeClass: 'bg-amber-500 text-white',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-500',
      rangeLabel: '10–25 mm/hr',
    };
  } else if (mmPerHour <= RAINFALL_THRESHOLDS.HEAVY_MAX) {
    return {
      category: 'HEAVY',
      color: 'ORANGE',
      hex: '#f97316',
      label: 'Heavy',
      badgeClass: 'bg-orange-500 text-white',
      bgClass: 'bg-orange-500/10',
      textClass: 'text-orange-500',
      rangeLabel: '25–50 mm/hr',
    };
  } else {
    return {
      category: 'EXTREME',
      color: 'RED',
      hex: '#ef4444',
      label: 'Very Heavy / Extreme',
      badgeClass: 'bg-red-500 text-white',
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-500',
      rangeLabel: '50+ mm/hr',
    };
  }
}


export function formatNumber(val: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates geographic distance using the Haversine formula.
 * Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


