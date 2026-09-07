export interface TerrainPointInfo {
  elevationMeters: number;
  slopePercent: number;
  flowDirectionDegrees: number;
  isDepressionSink: boolean;
  sinkDepthCapacityCm: number;
}

export class TerrainService {
  /**
   * Deterministic Digital Elevation Model (DEM) lookup for coordinates.
   * Simulates high ridges, slope gradients, and low-lying coastal/river basin sinks.
   */
  static getTerrainInfo(lat: number, lng: number): TerrainPointInfo {
    const baseElev = 5.0 + Math.abs(Math.sin(lat * 30.0 + lng * 30.0)) * 25.0;
    
    // Deterministic slope percentage (0.5% flat plain to 8% incline)
    const slope = 0.5 + Math.abs(Math.cos(lat * 50.0)) * 6.5;

    // Flow direction (0-360 deg pointing downhill towards drainage channels)
    const flowDirection = Math.floor((Math.sin(lat * 100.0) * 180.0 + 180.0) % 360);

    // Identify low-elevation sink depressions (< 8 meters elevation)
    const isDepressionSink = baseElev < 9.5;
    const sinkDepthCapacityCm = isDepressionSink ? (9.5 - baseElev) * 15.0 : 0.0;

    return {
      elevationMeters: parseFloat(baseElev.toFixed(1)),
      slopePercent: parseFloat(slope.toFixed(2)),
      flowDirectionDegrees: flowDirection,
      isDepressionSink,
      sinkDepthCapacityCm: parseFloat(sinkDepthCapacityCm.toFixed(1)),
    };
  }
}
