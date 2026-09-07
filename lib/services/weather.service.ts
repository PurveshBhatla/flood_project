import { classifyRainfallIntensity, RainfallClassification } from '../utils';

export interface HourlyForecastStep {
  hourOffset: number; // 0, 1, 2, 3, 4, 5, 6
  timeLabel: string; // "NOW", "1H", "2H", "3H", "4H", "5H", "6H"
  precipitationMmHr: number;
  probabilityPercent?: number;
  category: 'LOW' | 'MODERATE' | 'HEAVY' | 'EXTREME';
  label: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  hex: string;
}

export interface RainfallForecastResult {
  mode: 'live' | 'demo';
  updatedAt: string;
  currentMmHr: number;
  next1hMmHr: number;
  next3hPeakMmHr: number;
  next6hPeakMmHr: number;
  next1hClassification: RainfallClassification;
  next3hClassification: RainfallClassification;
  next6hClassification: RainfallClassification;
  warningLevel: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'VERY_HEAVY';
  warningTitle: string;
  warningIcon: string;
  warningColorClass: string;
  expectedInHours: number | null;
  expectedTimeText: string;
  precipitationProbability?: number;
  hourly: HourlyForecastStep[];
}

export interface WeatherDataResult {
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  rainfall: number; // mm
  windSpeed: number; // km/h
  condition: string;
  timestamp: Date;
  forecast: RainfallForecastResult;
}

export class WeatherService {
  private static OPEN_METEO_BASE = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com/v1';

  static async getWeather(lat: number, lng: number): Promise<WeatherDataResult> {
    try {
      const response = await fetch(
        `${this.OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,weather_code&hourly=precipitation,precipitation_probability,rain&forecast_days=1`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}`);
      }

      const data = await response.json();
      const current = data.current || {};
      const currentRain = Math.max(0, parseFloat((current.precipitation ?? current.rain ?? 12.4).toFixed(1)));

      const weatherCode = current.weather_code ?? 0;
      const condition = this.mapWeatherCode(weatherCode);

      const rawHourlyPrecip: number[] = data.hourly?.precipitation || [];
      const rawHourlyProb: number[] = data.hourly?.precipitation_probability || [];

      const forecast = this.buildForecastResult('live', currentRain, rawHourlyPrecip, rawHourlyProb);

      return {
        latitude: lat,
        longitude: lng,
        temperature: current.temperature_2m ?? 24.5,
        humidity: current.relative_humidity_2m ?? 75,
        rainfall: currentRain,
        windSpeed: current.wind_speed_10m ?? 14.2,
        condition,
        timestamp: new Date(),
        forecast,
      };
    } catch (error) {
      console.warn('External Weather Service fallback activated:', error);
      return this.generateMockWeather(lat, lng);
    }
  }

  private static buildForecastResult(
    mode: 'live' | 'demo',
    currentRain: number,
    rawHourlyPrecip: number[],
    rawHourlyProb?: number[]
  ): RainfallForecastResult {
    const nowIso = new Date().toISOString();
    const timeLabels = ['NOW', '1H', '2H', '3H', '4H', '5H', '6H'];

    const hourly: HourlyForecastStep[] = timeLabels.map((label, idx) => {
      let mmHr = currentRain;
      if (rawHourlyPrecip && rawHourlyPrecip[idx] !== undefined) {
        mmHr = Math.max(0, parseFloat(rawHourlyPrecip[idx].toFixed(1)));
      } else if (idx > 0) {
        // Deterministic forecast curve multiplier for demo / fallback
        const multipliers = [1.0, 1.3, 1.8, 2.4, 2.1, 1.5, 0.9];
        mmHr = parseFloat((currentRain * multipliers[idx]).toFixed(1));
      }

      let probPercent = rawHourlyProb && rawHourlyProb[idx] !== undefined ? rawHourlyProb[idx] : undefined;
      if (probPercent === undefined && mmHr > 0) {
        probPercent = Math.min(95, Math.round(45 + mmHr * 1.2));
      }

      const classif = classifyRainfallIntensity(mmHr);

      return {
        hourOffset: idx,
        timeLabel: label,
        precipitationMmHr: mmHr,
        probabilityPercent: probPercent,
        category: classif.category,
        label: classif.label,
        badgeClass: classif.badgeClass,
        bgClass: classif.bgClass,
        textClass: classif.textClass,
        hex: classif.hex,
      };
    });

    const next1hMmHr = hourly[1]?.precipitationMmHr ?? currentRain;
    const next3hPeakMmHr = Math.max(...hourly.slice(0, 4).map((h) => h.precipitationMmHr));
    const next6hPeakMmHr = Math.max(...hourly.map((h) => h.precipitationMmHr));

    const next1hClassification = classifyRainfallIntensity(next1hMmHr);
    const next3hClassification = classifyRainfallIntensity(next3hPeakMmHr);
    const next6hClassification = classifyRainfallIntensity(next6hPeakMmHr);

    let warningLevel: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'VERY_HEAVY' = 'NONE';
    let warningTitle = '☀️ No significant rainfall expected';
    let warningIcon = '☀️';
    let warningColorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

    if (next6hPeakMmHr >= 50.0) {
      warningLevel = 'VERY_HEAVY';
      warningTitle = '🔴 Very heavy rainfall likely in the next 6 hours';
      warningIcon = '🔴';
      warningColorClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
    } else if (next6hPeakMmHr >= 25.0) {
      warningLevel = 'HEAVY';
      warningTitle = '⚠️ Heavy rainfall expected';
      warningIcon = '⚠️';
      warningColorClass = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
    } else if (next6hPeakMmHr >= 10.0) {
      warningLevel = 'MODERATE';
      warningTitle = '🟡 Moderate rainfall expected';
      warningIcon = '🌧️';
      warningColorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    } else if (next6hPeakMmHr > 2.0) {
      warningLevel = 'LIGHT';
      warningTitle = '🌧️ Light rainfall expected';
      warningIcon = '🌧️';
      warningColorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }

    // Expected Time calculation
    let expectedInHours: number | null = null;
    let expectedTimeText = 'Stable in next 6 hours';

    if (warningLevel === 'HEAVY' || warningLevel === 'VERY_HEAVY') {
      const peakIdx = hourly.findIndex((h) => h.hourOffset > 0 && h.precipitationMmHr >= 25.0);
      if (peakIdx > 0) {
        expectedInHours = peakIdx;
        expectedTimeText = `Expected in ~${peakIdx} ${peakIdx === 1 ? 'hour' : 'hours'}`;
      } else if (currentRain >= 25.0) {
        expectedInHours = 0;
        expectedTimeText = 'Currently occurring';
      }
    } else if (warningLevel === 'MODERATE') {
      const modIdx = hourly.findIndex((h) => h.hourOffset > 0 && h.precipitationMmHr >= 10.0);
      if (modIdx > 0) {
        expectedInHours = modIdx;
        expectedTimeText = `Expected in ~${modIdx} ${modIdx === 1 ? 'hour' : 'hours'}`;
      } else if (currentRain >= 10.0) {
        expectedInHours = 0;
        expectedTimeText = 'Currently occurring';
      }
    } else if (warningLevel === 'LIGHT') {
      const lightIdx = hourly.findIndex((h) => h.hourOffset > 0 && h.precipitationMmHr > 2.0);
      if (lightIdx > 0) {
        expectedInHours = lightIdx;
        expectedTimeText = `Expected in ~${lightIdx} ${lightIdx === 1 ? 'hour' : 'hours'}`;
      }
    }

    const overallProb =
      hourly.find((h) => h.hourOffset > 0 && h.probabilityPercent !== undefined)?.probabilityPercent ||
      hourly[0]?.probabilityPercent;

    return {
      mode,
      updatedAt: nowIso,
      currentMmHr: currentRain,
      next1hMmHr,
      next3hPeakMmHr,
      next6hPeakMmHr,
      next1hClassification,
      next3hClassification,
      next6hClassification,
      warningLevel,
      warningTitle,
      warningIcon,
      warningColorClass,
      expectedInHours,
      expectedTimeText,
      precipitationProbability: overallProb,
      hourly,
    };
  }

  private static mapWeatherCode(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Light Drizzle / Rain';
    if (code >= 80 && code <= 82) return 'Heavy Torrential Rain';
    if (code >= 95) return 'Severe Thunderstorm';
    return 'Rainy';
  }

  private static generateMockWeather(lat: number, lng: number): WeatherDataResult {
    // Seeded deterministic output based on lat/lng
    const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 43758.5453;
    const baseRain = parseFloat(((seed % 45) + 5).toFixed(1)); // 5 to 50 mm
    const temp = parseFloat((22 + (seed % 10)).toFixed(1));
    const humidity = parseFloat((60 + (seed % 35)).toFixed(1));
    const wind = parseFloat((10 + (seed % 20)).toFixed(1));

    const mockHourlyPrecip = [
      baseRain,
      parseFloat((baseRain * 1.2).toFixed(1)),
      parseFloat((baseRain * 1.7).toFixed(1)),
      parseFloat((baseRain * 2.3).toFixed(1)),
      parseFloat((baseRain * 1.9).toFixed(1)),
      parseFloat((baseRain * 1.3).toFixed(1)),
      parseFloat((baseRain * 0.8).toFixed(1)),
    ];

    const mockHourlyProb = [
      Math.min(95, Math.round(40 + baseRain)),
      Math.min(95, Math.round(50 + baseRain)),
      Math.min(95, Math.round(65 + baseRain)),
      Math.min(95, Math.round(85 + baseRain)),
      Math.min(95, Math.round(75 + baseRain)),
      Math.min(95, Math.round(60 + baseRain)),
      Math.min(95, Math.round(45 + baseRain)),
    ];

    const forecast = this.buildForecastResult('demo', baseRain, mockHourlyPrecip, mockHourlyProb);

    return {
      latitude: lat,
      longitude: lng,
      temperature: temp,
      humidity: humidity,
      rainfall: baseRain,
      windSpeed: wind,
      condition: baseRain > 30 ? 'Heavy Torrential Rain' : 'Moderate Rain',
      timestamp: new Date(),
      forecast,
    };
  }
}
