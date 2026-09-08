export interface DemoScenarioData {
  isDemoActive: boolean;
  scenarioName: string;
  selectedLocation: {
    id: string;
    name: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    ward: string;
  };
  prediction: {
    riskScore: number;
    riskLevel: 'CRITICAL';
    probability: number;
    predictedDepthCm: number;
    recommendation: string;
    floodedStreetsCount: number;
    nowcastBannerText: string;
  };
  telemetry: {
    drainageUtilization: number;
    drainageStatus: string;
    rainfallMmHr: number;
    soilSaturationPercent: number;
    waterSensorLevelMeter: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  forecast: any;
}

export class DemoScenarioService {
  static getHighFloodScenario(): DemoScenarioData {
    return {
      isDemoActive: true,
      scenarioName: 'High Flood Risk (Nowcast +2h)',
      selectedLocation: {
        id: 'zone-4-demo',
        name: 'Zone 4 - Central Market / Railway Underpass',
        city: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.076,
        longitude: 72.8777,
        ward: 'Ward 4-B Central Market',
      },
      prediction: {
        riskScore: 88,
        riskLevel: 'CRITICAL',
        probability: 0.94,
        predictedDepthCm: 65,
        recommendation:
          'Avoid Underpass. Evacuation Route A-2 Active. Contact Local Ward Control Room.',
        floodedStreetsCount: 34,
        nowcastBannerText:
          '⚠️ CRITICAL NOWCAST (+2h): Inundation expected in 45-90 mins due to 68mm/hr localized cloudburst exceeding drainage throughput by 135%.',
      },
      telemetry: {
        drainageUtilization: 135,
        drainageStatus: 'SURCHARGED OVERFLOW',
        rainfallMmHr: 68.0,
        soilSaturationPercent: 94,
        waterSensorLevelMeter: 1.2,
        temperature: 26.5,
        humidity: 92,
        windSpeed: 24.5,
      },
      forecast: {
        mode: 'demo',
        updatedAt: new Date().toISOString(),
        currentMmHr: 68.0,
        next1hMmHr: 45.0,
        next3hPeakMmHr: 68.0,
        next6hPeakMmHr: 72.0,
        next1hClassification: {
          category: 'EXTREME',
          color: 'RED',
          hex: '#ef4444',
          label: 'Very Heavy / Extreme',
          badgeClass: 'bg-red-500 text-white',
          bgClass: 'bg-red-500/10',
          textClass: 'text-red-500',
          rangeLabel: '50+ mm/hr',
        },
        next3hClassification: {
          category: 'EXTREME',
          color: 'RED',
          hex: '#ef4444',
          label: 'Very Heavy / Extreme',
          badgeClass: 'bg-red-500 text-white',
          bgClass: 'bg-red-500/10',
          textClass: 'text-red-500',
          rangeLabel: '50+ mm/hr',
        },
        next6hClassification: {
          category: 'EXTREME',
          color: 'RED',
          hex: '#ef4444',
          label: 'Very Heavy / Extreme',
          badgeClass: 'bg-red-500 text-white',
          bgClass: 'bg-red-500/10',
          textClass: 'text-red-500',
          rangeLabel: '50+ mm/hr',
        },
        warningLevel: 'VERY_HEAVY',
        warningTitle: '🔴 CRITICAL FLOOD NOWCAST (+2h): Severe Cloudburst Inundation',
        warningIcon: '🔴',
        warningColorClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40 ring-1 ring-red-500/30',
        expectedInHours: 2,
        expectedTimeText: 'Expected in 45–90 mins',
        precipitationProbability: 94,
        hourly: [
          { hourOffset: 0, timeLabel: 'NOW', precipitationMmHr: 68.0, probabilityPercent: 94, category: 'EXTREME', label: 'Very Heavy / Extreme', badgeClass: 'bg-red-500 text-white', bgClass: 'bg-red-500/10', textClass: 'text-red-500', hex: '#ef4444' },
          { hourOffset: 1, timeLabel: '1H', precipitationMmHr: 52.0, probabilityPercent: 90, category: 'EXTREME', label: 'Very Heavy / Extreme', badgeClass: 'bg-red-500 text-white', bgClass: 'bg-red-500/10', textClass: 'text-red-500', hex: '#ef4444' },
          { hourOffset: 2, timeLabel: '2H', precipitationMmHr: 68.0, probabilityPercent: 94, category: 'EXTREME', label: 'Very Heavy / Extreme', badgeClass: 'bg-red-500 text-white', bgClass: 'bg-red-500/10', textClass: 'text-red-500', hex: '#ef4444' },
          { hourOffset: 3, timeLabel: '3H', precipitationMmHr: 42.0, probabilityPercent: 80, category: 'HEAVY', label: 'Heavy', badgeClass: 'bg-orange-500 text-white', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500', hex: '#f97316' },
          { hourOffset: 4, timeLabel: '4H', precipitationMmHr: 28.0, probabilityPercent: 65, category: 'HEAVY', label: 'Heavy', badgeClass: 'bg-orange-500 text-white', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500', hex: '#f97316' },
          { hourOffset: 5, timeLabel: '5H', precipitationMmHr: 14.0, probabilityPercent: 45, category: 'MODERATE', label: 'Moderate', badgeClass: 'bg-amber-500 text-white', bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', hex: '#f59e0b' },
          { hourOffset: 6, timeLabel: '6H', precipitationMmHr: 6.0, probabilityPercent: 30, category: 'LOW', label: 'Low', badgeClass: 'bg-emerald-500 text-white', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500', hex: '#10b981' },
        ],
      },
    };
  }
}
