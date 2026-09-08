export interface DemoScenarioData {
  isDemoActive: boolean;
  isSimulatedAlert: boolean;
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
    riskLevel: 'CRITICAL RED ALERT';
    riskScoreBadgeText: string;
    probability: number;
    predictedDepthCm: number;
    predictedDepthRangeText: string;
    recommendation: string;
    floodedStreetsCount: number;
    nowcastBannerText: string;
    drainNodePopupText: string;
  };
  telemetry: {
    drainageUtilization: number;
    drainageStatus: string;
    rainfallMmHr: number;
    rainfallIntensityText: string;
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
      isSimulatedAlert: true,
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
        riskScore: 94,
        riskLevel: 'CRITICAL RED ALERT',
        riskScoreBadgeText: '94 / 100 — CRITICAL RED ALERT',
        probability: 0.96,
        predictedDepthCm: 75,
        predictedDepthRangeText: '0.65m - 0.90m Depth Predicted in 45-75 mins',
        recommendation:
          'Avoid Underpass. Evacuation Route A-1 Recommended. Contact Local Ward Control Room.',
        floodedStreetsCount: 38,
        nowcastBannerText:
          '⚠️ SIH26085 EARLY WARNING: Critical runoff accumulation detected in low-lying sector. Drainage threshold breached. Evacuation route A-1 recommended.',
        drainNodePopupText: 'Drain Node #D-14 Overflowing | Water Depth: 0.8m',
      },
      telemetry: {
        drainageUtilization: 142,
        drainageStatus: '142% Overcapacity (Drain Blockage / Surcharge)',
        rainfallMmHr: 78.4,
        rainfallIntensityText: '78.4 mm/hr (Cloudburst Warning)',
        soilSaturationPercent: 96,
        waterSensorLevelMeter: 1.4,
        temperature: 26.5,
        humidity: 94,
        windSpeed: 28.5,
      },
      forecast: {
        mode: 'demo',
        updatedAt: new Date().toISOString(),
        currentMmHr: 78.4,
        next1hMmHr: 58.0,
        next3hPeakMmHr: 78.4,
        next6hPeakMmHr: 82.0,
        next1hClassification: {
          category: 'EXTREME',
          color: 'RED',
          hex: '#ef4444',
          label: 'Very Heavy / Extreme Cloudburst',
          badgeClass: 'bg-red-600 text-white font-extrabold',
          bgClass: 'bg-red-600/20',
          textClass: 'text-red-500',
          rangeLabel: '70+ mm/hr',
        },
        next3hClassification: {
          category: 'EXTREME',
          color: 'RED',
          hex: '#ef4444',
          label: 'Very Heavy / Extreme Cloudburst',
          badgeClass: 'bg-red-600 text-white font-extrabold',
          bgClass: 'bg-red-600/20',
          textClass: 'text-red-500',
          rangeLabel: '70+ mm/hr',
        },
        next6hClassification: {
          category: 'EXTREME',
          color: 'RED',
          hex: '#ef4444',
          label: 'Very Heavy / Extreme Cloudburst',
          badgeClass: 'bg-red-600 text-white font-extrabold',
          bgClass: 'bg-red-600/20',
          textClass: 'text-red-500',
          rangeLabel: '70+ mm/hr',
        },
        warningLevel: 'VERY_HEAVY',
        warningTitle: '🔴 CRITICAL FLOOD NOWCAST (+2h): Cloudburst Overcapacity Warning',
        warningIcon: '🔴',
        warningColorClass: 'bg-red-600/20 text-red-600 dark:text-red-400 border-red-600/60 ring-2 ring-red-500/40',
        expectedInHours: 2,
        expectedTimeText: 'Expected in 45–75 mins',
        precipitationProbability: 96,
        hourly: [
          { hourOffset: 0, timeLabel: 'NOW', precipitationMmHr: 78.4, probabilityPercent: 96, category: 'EXTREME', label: 'Extreme Cloudburst', badgeClass: 'bg-red-600 text-white', bgClass: 'bg-red-600/20', textClass: 'text-red-500', hex: '#ef4444' },
          { hourOffset: 1, timeLabel: '1H', precipitationMmHr: 62.0, probabilityPercent: 92, category: 'EXTREME', label: 'Extreme Cloudburst', badgeClass: 'bg-red-600 text-white', bgClass: 'bg-red-600/20', textClass: 'text-red-500', hex: '#ef4444' },
          { hourOffset: 2, timeLabel: '2H', precipitationMmHr: 78.4, probabilityPercent: 96, category: 'EXTREME', label: 'Extreme Cloudburst', badgeClass: 'bg-red-600 text-white', bgClass: 'bg-red-600/20', textClass: 'text-red-500', hex: '#ef4444' },
          { hourOffset: 3, timeLabel: '3H', precipitationMmHr: 48.0, probabilityPercent: 82, category: 'HEAVY', label: 'Heavy Rain', badgeClass: 'bg-orange-500 text-white', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500', hex: '#f97316' },
          { hourOffset: 4, timeLabel: '4H', precipitationMmHr: 32.0, probabilityPercent: 70, category: 'HEAVY', label: 'Heavy Rain', badgeClass: 'bg-orange-500 text-white', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500', hex: '#f97316' },
          { hourOffset: 5, timeLabel: '5H', precipitationMmHr: 16.0, probabilityPercent: 50, category: 'MODERATE', label: 'Moderate', badgeClass: 'bg-amber-500 text-white', bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', hex: '#f59e0b' },
          { hourOffset: 6, timeLabel: '6H', precipitationMmHr: 8.0, probabilityPercent: 35, category: 'LOW', label: 'Low', badgeClass: 'bg-emerald-500 text-white', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500', hex: '#10b981' },
        ],
      },
    };
  }
}

