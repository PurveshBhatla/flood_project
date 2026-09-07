export interface NowcastStep {
  forecastMinutes: number; // 0, 30, 60, 90, 120, 150, 180
  intensityMmHr: number;
  accumulatedMm: number;
  label: string;
}

export interface RainfallNowcastResult {
  source: 'DEMO / SIMULATED NOWCAST' | 'LIVE_RADAR_WEATHER_API';
  providerName: string;
  isSimulated: boolean;
  timeline: NowcastStep[];
  peakIntensityMmHr: number;
  peakMinute: number;
  totalAccumulatedMm: number;
}

export interface RainfallProvider {
  getNowcast(lat: number, lng: number): Promise<RainfallNowcastResult>;
}

export class DemoRainfallProvider implements RainfallProvider {
  async getNowcast(lat: number, lng: number): Promise<RainfallNowcastResult> {
    // Seeded deterministic 0-3h nowcast profile based on coordinates
    const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 43758.5453;
    const intensityMultiplier = 1.0 + (seed % 1.5); // 1.0x to 2.5x storm factor

    // Curve simulating a heavy convective storm cell passing over 3 hours
    const rawIntensities = [
      { min: 0, int: 12.0 * intensityMultiplier },
      { min: 30, int: 28.5 * intensityMultiplier },
      { min: 60, int: 54.0 * intensityMultiplier },
      { min: 90, int: 72.0 * intensityMultiplier }, // Peak
      { min: 120, int: 45.0 * intensityMultiplier },
      { min: 150, int: 22.5 * intensityMultiplier },
      { min: 180, int: 10.0 * intensityMultiplier },
    ];

    let runningAccumulation = 0;
    const timeline: NowcastStep[] = rawIntensities.map((item) => {
      // 30 min block accumulation in mm = (intensity in mm/h) * 0.5h
      const stepAccum = item.int * 0.5;
      runningAccumulation += stepAccum;

      return {
        forecastMinutes: item.min,
        intensityMmHr: parseFloat(item.int.toFixed(1)),
        accumulatedMm: parseFloat(runningAccumulation.toFixed(1)),
        label: `T+${item.min} min`,
      };
    });

    const peakStep = timeline.reduce((max, curr) =>
      curr.intensityMmHr > max.intensityMmHr ? curr : max
    );

    return {
      source: 'DEMO / SIMULATED NOWCAST',
      providerName: 'Synthetic Convective Radar Storm Profiler',
      isSimulated: true,
      timeline,
      peakIntensityMmHr: peakStep.intensityMmHr,
      peakMinute: peakStep.forecastMinutes,
      totalAccumulatedMm: parseFloat(runningAccumulation.toFixed(1)),
    };
  }
}

export class RainfallNowcastService {
  private static provider: RainfallProvider = new DemoRainfallProvider();

  static setProvider(newProvider: RainfallProvider) {
    this.provider = newProvider;
  }

  static async getNowcast(lat: number, lng: number): Promise<RainfallNowcastResult> {
    return this.provider.getNowcast(lat, lng);
  }
}
