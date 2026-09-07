import { StreetPrediction } from './flood-prediction.engine';

export interface FloodHotspot {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  depthCm: number;
  probability: number;
  riskLevel: string;
  expectedTimeMin: number;
  reason: string;
}

export class HotspotDetectionService {
  static rankHotspots(predictions: StreetPrediction[], coordinatesMap: Record<string, [number, number]>): FloodHotspot[] {
    const sorted = [...predictions].sort((a, b) => b.depthCm - a.depthCm);

    return sorted.slice(0, 5).map((pred, idx) => {
      const coords = coordinatesMap[pred.streetId] || [19.076, 72.8777];

      let reason = 'Low-elevation terrain accumulation.';
      if (pred.drainage.isSurcharged) {
        reason = `Drainage capacity overloaded (${pred.drainage.utilizationPercent}% utilization). Severe surcharge.`;
      } else if (pred.hydrology.rainfallMmHr > 40) {
        reason = `Torrential rainfall nowcast (${pred.hydrology.rainfallMmHr} mm/h) exceeding drainage intake rate.`;
      }

      return {
        id: `hotspot-${idx + 1}`,
        locationName: pred.streetName,
        latitude: coords[0],
        longitude: coords[1],
        depthCm: pred.depthCm,
        probability: pred.probability,
        riskLevel: pred.riskLevel,
        expectedTimeMin: pred.peakTimeMin,
        reason,
      };
    });
  }
}
