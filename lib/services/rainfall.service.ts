import { classifyRainfallIntensity } from '../utils';

export interface NormalizedRainfallArea {
  lat: number;
  lng: number;
  rainfallMmPerHour: number;
  category: 'LOW' | 'MODERATE' | 'EXTREME';
  locationName: string;
  timestamp: string;
}

export interface RainfallResponse {
  mode: 'live' | 'demo';
  updatedAt: string;
  areas: NormalizedRainfallArea[];
}

export interface RainfallProvider {
  getRainfall(lat: number, lng: number, radiusKm?: number): Promise<RainfallResponse>;
}

export class LiveRainfallProvider implements RainfallProvider {
  private apiBase: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiBase = process.env.RAINFALL_API_URL || 'https://api.open-meteo.com/v1';
    this.apiKey = process.env.RAINFALL_API_KEY;
  }

  async getRainfall(lat: number, lng: number, radiusKm: number = 15): Promise<RainfallResponse> {
    // If explicitly configured to require key and key is missing, fail fast to trigger demo mode fallback
    if (process.env.REQUIRE_RAINFALL_API_KEY === 'true' && !this.apiKey) {
      throw new Error('No live rainfall API key configured');
    }

    const response = await fetch(
      `${this.apiBase}/forecast?latitude=${lat}&longitude=${lng}&current=precipitation,rain&hourly=precipitation&forecast_days=1`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`External Rainfall API response failed with status ${response.status}`);
    }

    const data = await response.json();
    const currentRain = data.current?.precipitation ?? data.current?.rain;

    if (typeof currentRain !== 'number') {
      throw new Error('Invalid response structure from external rainfall API');
    }

    const nowIso = new Date().toISOString();

    // Create a 5-point cluster centered on queried location using live precipitation
    const offsets = [
      { dLat: 0.0, dLng: 0.0, name: 'Center Sector', mult: 1.0 },
      { dLat: 0.025, dLng: 0.02, name: 'North Sector', mult: 1.25 },
      { dLat: -0.025, dLng: -0.02, name: 'South Sector', mult: 0.8 },
      { dLat: 0.015, dLng: -0.03, name: 'West Sector', mult: 1.6 },
      { dLat: -0.015, dLng: 0.03, name: 'East Sector', mult: 0.5 },
    ];

    const areas: NormalizedRainfallArea[] = offsets.map((off) => {
      const rainfallMmPerHour = Math.max(0, parseFloat((currentRain * off.mult).toFixed(1)));
      const classification = classifyRainfallIntensity(rainfallMmPerHour);
      return {
        lat: parseFloat((lat + off.dLat).toFixed(4)),
        lng: parseFloat((lng + off.dLng).toFixed(4)),
        rainfallMmPerHour,
        category: classification.category,
        locationName: `${off.name} (${lat > 20 ? 'Mumbai' : 'Delhi'} Basin)`,
        timestamp: nowIso,
      };
    });

    return {
      mode: 'live',
      updatedAt: nowIso,
      areas,
    };
  }
}

export class DemoRainfallProvider implements RainfallProvider {
  async getRainfall(lat: number, lng: number, radiusKm: number = 15): Promise<RainfallResponse> {
    const now = new Date();
    const nowIso = now.toISOString();

    // Deterministic seed based on latitude, longitude, and current hour/minute-block (5 min step)
    // Ensures consistent demo values that evolve deterministically over time without flickering
    const timeBlock = Math.floor(now.getTime() / (5 * 60 * 1000));
    
    // Grid offsets around requested center coordinate to simulate realistic spatial storm cells
    const cellDefinitions = [
      { dLat: 0.0, dLng: 0.0, name: 'Central Catchment', baseIntensity: 31.5 },   // EXTREME 🔴 (31.5 mm/h)
      { dLat: 0.03, dLng: 0.02, name: 'North Uplands', baseIntensity: 18.2 },     // MODERATE 🟡 (18.2 mm/h)
      { dLat: -0.028, dLng: -0.022, name: 'South Lowlands', baseIntensity: 7.4 },   // LOW 🟢 (7.4 mm/h)
      { dLat: 0.018, dLng: -0.035, name: 'West Coastal Plain', baseIntensity: 27.0 },// EXTREME 🔴 (27.0 mm/h)
      { dLat: -0.015, dLng: 0.032, name: 'East Commercial Hub', baseIntensity: 12.8 },// MODERATE 🟡 (12.8 mm/h)
      { dLat: 0.042, dLng: -0.018, name: 'Northwest Basin', baseIntensity: 4.5 },   // LOW 🟢 (4.5 mm/h)
      { dLat: -0.04, dLng: 0.015, name: 'Southeast Suburb', baseIntensity: 22.1 },  // MODERATE 🟡 (22.1 mm/h)
      { dLat: -0.01, dLng: -0.045, name: 'Southwest Creek', baseIntensity: 38.4 },  // EXTREME 🔴 (38.4 mm/h)
    ];

    const areas: NormalizedRainfallArea[] = cellDefinitions.map((cell, idx) => {
      const cellSeed = Math.abs(Math.sin((lat + cell.dLat) * 12.9898 + (lng + cell.dLng) * 78.233 + timeBlock * 0.1)) * 43758.5453;
      // Fluctuate deterministic intensity slightly around base value (+/- 15%)
      const variation = ((cellSeed % 20) - 10) / 100;
      const rainfallMmPerHour = Math.max(0.5, parseFloat((cell.baseIntensity * (1 + variation)).toFixed(1)));
      const classification = classifyRainfallIntensity(rainfallMmPerHour);

      return {
        lat: parseFloat((lat + cell.dLat).toFixed(4)),
        lng: parseFloat((lng + cell.dLng).toFixed(4)),
        rainfallMmPerHour,
        category: classification.category,
        locationName: `${cell.name}`,
        timestamp: nowIso,
      };
    });

    return {
      mode: 'demo',
      updatedAt: nowIso,
      areas,
    };
  }
}

export class RainfallService {
  private static liveProvider: RainfallProvider = new LiveRainfallProvider();
  private static demoProvider: RainfallProvider = new DemoRainfallProvider();

  static async getRainfall(lat: number = 19.076, lng: number = 72.8777, radiusKm: number = 15): Promise<RainfallResponse> {
    try {
      // Try Live Provider first
      const liveData = await this.liveProvider.getRainfall(lat, lng, radiusKm);
      return liveData;
    } catch (error) {
      // Clean fallback to Demo Provider
      return await this.demoProvider.getRainfall(lat, lng, radiusKm);
    }
  }
}
