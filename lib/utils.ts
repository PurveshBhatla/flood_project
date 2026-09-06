import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskLevelColor(level: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  hex: string;
} {
  switch (level.toUpperCase()) {
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
