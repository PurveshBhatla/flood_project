import { RainfallNowcastService, NowcastStep } from './rainfall-nowcast.service';
import { TerrainService, TerrainPointInfo } from './terrain.service';
import { RunoffService } from './runoff.service';
import { HydraulicService, HydraulicStatus } from './hydraulic.service';
import { SurfaceWaterRoutingService } from './surface-routing.service';

export interface StreetPrediction {
  streetId: string;
  streetName: string;
  forecastMinutes: number;
  depthCm: number;
  probability: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'DARK_RED';
  startTimeMin: number;
  peakTimeMin: number;
  durationMin: number;
  recommendation: 'SAFE' | 'CAUTION' | 'AVOID' | 'CRITICAL_EMERGENCY';
  hydrology: {
    rainfallMmHr: number;
    runoffMmHr: number;
    elevationMeters: number;
    slopePercent: number;
    surfaceType: string;
  };
  drainage: {
    capacityM3s: number;
    incomingFlowM3s: number;
    utilizationPercent: number;
    isSurcharged: boolean;
  };
  scientificExplanation: string;
}

export class FloodPredictionEngine {
  static async predictStreet(
    streetId: string,
    streetName: string,
    lat: number,
    lng: number,
    surfaceType: string = 'ROAD',
    forecastMinutes: number = 90
  ): Promise<StreetPrediction> {
    // 1. Fetch 0-3h Rainfall Nowcast
    const nowcast = await RainfallNowcastService.getNowcast(lat, lng);
    const targetStep =
      nowcast.timeline.find((t) => t.forecastMinutes === forecastMinutes) ||
      nowcast.timeline[3]; // Default T+90 min

    // 2. Fetch Terrain DEM
    const terrain = TerrainService.getTerrainInfo(lat, lng);

    // 3. Compute Effective Runoff
    const runoffMmHr = RunoffService.calculateRunoff(targetStep.intensityMmHr, surfaceType);

    // 4. Hydraulic Capacity & Utilization Evaluation
    // Base pipe capacity derived from street category
    const pipeDiameter = streetName.toLowerCase().includes('express') || streetName.toLowerCase().includes('highway') ? 1.8 : 1.0;
    const pipeCapacity = HydraulicService.calculateManningCapacity(pipeDiameter, terrain.slopePercent);
    const incomingFlow = (runoffMmHr * 0.25); // Estimated inflow rate m3/s

    const hydraulic = HydraulicService.evaluateHydraulics(pipeCapacity, incomingFlow);

    // 5. Surface Water Routing Accumulation
    const durationHours = Math.max(0.5, forecastMinutes / 60.0);
    const routing = SurfaceWaterRoutingService.computeStreetWaterAccumulation(
      runoffMmHr,
      durationHours,
      terrain,
      hydraulic
    );

    const depthCm = routing.streetDepthCm;

    // 6. Probability & Risk Classification
    const probability = parseFloat(Math.min(0.99, Math.max(0.05, depthCm / 65.0)).toFixed(2));

    let riskLevel: StreetPrediction['riskLevel'] = 'LOW';
    let recommendation: StreetPrediction['recommendation'] = 'SAFE';

    if (depthCm >= 60.0) {
      riskLevel = 'DARK_RED';
      recommendation = 'CRITICAL_EMERGENCY';
    } else if (depthCm >= 30.0) {
      riskLevel = 'CRITICAL';
      recommendation = 'AVOID';
    } else if (depthCm >= 15.0) {
      riskLevel = 'HIGH';
      recommendation = 'AVOID';
    } else if (depthCm >= 5.0) {
      riskLevel = 'MODERATE';
      recommendation = 'CAUTION';
    }

    // Timeline forecast bounds
    const startTimeMin = depthCm > 5.0 ? Math.max(15, forecastMinutes - 30) : 0;
    const peakTimeMin = nowcast.peakMinute;
    const durationMin = depthCm > 5.0 ? 120 : 0;

    // Scientific Explanation Formulation
    const scientificExplanation =
      `Heavy rainfall nowcast (${targetStep.intensityMmHr} mm/h) is generating high surface runoff (${runoffMmHr} mm/h, C=${RunoffService.getCoefficient(surfaceType)}) on a ${terrain.elevationMeters}m elevation terrain (${terrain.slopePercent}% slope). ` +
      `Drainage infrastructure is operating at ${hydraulic.utilizationPercent}% capacity (${hydraulic.incomingFlowM3s.toFixed(1)} / ${hydraulic.capacityM3s.toFixed(1)} m³/s). ` +
      (hydraulic.isSurcharged
        ? `Overloaded drainage conduits have surcharged, driving ${depthCm} cm of surface water accumulation.`
        : depthCm > 5.0
        ? `Surface runoff accumulation exceeds drainage intake rate, creating ${depthCm} cm of standing water.`
        : `Drainage capacity is sufficient to convey surface runoff with minimal surface pooling (${depthCm} cm).`);

    const riskScore = parseFloat(Math.min(100.0, depthCm * 1.5).toFixed(1));

    return {
      streetId,
      streetName,
      forecastMinutes,
      depthCm,
      probability,
      riskScore,
      riskLevel,
      startTimeMin,
      peakTimeMin,
      durationMin,
      recommendation,
      hydrology: {
        rainfallMmHr: targetStep.intensityMmHr,
        runoffMmHr,
        elevationMeters: terrain.elevationMeters,
        slopePercent: terrain.slopePercent,
        surfaceType,
      },
      drainage: {
        capacityM3s: hydraulic.capacityM3s,
        incomingFlowM3s: hydraulic.incomingFlowM3s,
        utilizationPercent: hydraulic.utilizationPercent,
        isSurcharged: hydraulic.isSurcharged,
      },
      scientificExplanation,
    };
  }
}
