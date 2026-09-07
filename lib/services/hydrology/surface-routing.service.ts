import { TerrainPointInfo } from './terrain.service';
import { HydraulicStatus } from './hydraulic.service';

export interface SurfaceAccumulationResult {
  accumulatedWaterM3: number;
  streetDepthCm: number;
  isFlooded: boolean;
}

export class SurfaceWaterRoutingService {
  /**
   * Computes surface water depth (cm) accumulated on a street segment.
   * Water Accumulation = (Effective Runoff) + (Drainage Surcharge Overflow) - (Drainage Inflow Absorption)
   * Street Depth (cm) is adjusted for road slope and terrain sink depressions.
   */
  static computeStreetWaterAccumulation(
    runoffMmHr: number,
    durationHours: number,
    terrain: TerrainPointInfo,
    hydraulic: HydraulicStatus
  ): SurfaceAccumulationResult {
    // 1. Gross precipitation runoff depth on street surface (mm)
    const runoffDepthMm = runoffMmHr * durationHours;

    // 2. Drainage surcharge contribution (convert m3/s overflow to equivalent surface depth mm)
    const surchargeContributionMm = hydraulic.isSurcharged
      ? (hydraulic.overflowVolumeM3s * 3600 * durationHours) / 100.0 // Scaled factor
      : 0.0;

    // 3. Gross surface depth (mm)
    let totalWaterMm = runoffDepthMm + surchargeContributionMm;

    // 4. Adjust for terrain slope drainage run-off (steeper slope drains faster)
    const slopeDrainageFactor = Math.max(0.3, 1.0 - terrain.slopePercent * 0.12);
    totalWaterMm = totalWaterMm * slopeDrainageFactor;

    // 5. Depression sink accumulation boost (water pools in low spots)
    if (terrain.isDepressionSink) {
      totalWaterMm += terrain.sinkDepthCapacityCm * 8.0;
    }

    // Convert mm to cm (1 cm = 10 mm)
    const depthCm = parseFloat(Math.max(0.0, totalWaterMm / 10.0).toFixed(1));

    return {
      accumulatedWaterM3: parseFloat((depthCm * 25.0).toFixed(1)),
      streetDepthCm: depthCm,
      isFlooded: depthCm > 5.0,
    };
  }
}
