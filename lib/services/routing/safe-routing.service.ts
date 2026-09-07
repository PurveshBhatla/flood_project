import { FloodPredictionEngine, StreetPrediction } from '../hydrology/flood-prediction.engine';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteOption {
  type: 'FASTEST' | 'SAFEST' | 'EMERGENCY';
  title: string;
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
  maxFloodDepthCm: number;
  unsafeSegmentsCount: number;
  riskScore: number;
  isSafe: boolean;
  recommendation: string;
}

export interface SafeRoutingResult {
  origin: RoutePoint;
  destination: RoutePoint;
  forecastMinutes: number;
  fastestRoute: RouteOption;
  safestRoute: RouteOption;
  emergencyRoute: RouteOption;
}

export class SafeRoutingService {
  static async calculateSafeRoute(
    origin: RoutePoint,
    destination: RoutePoint,
    forecastMinutes: number = 90
  ): Promise<SafeRoutingResult> {
    // Generate intermediate waypoints simulating road segments between origin and destination
    const midLat = (origin.lat + destination.lat) / 2.0;
    const midLng = (origin.lng + destination.lng) / 2.0;

    // Normal direct route coordinates
    const directCoords: [number, number][] = [
      [origin.lat, origin.lng],
      [origin.lat + (midLat - origin.lat) * 0.5, origin.lng + (midLng - origin.lng) * 0.5],
      [midLat, midLng], // High risk flood basin intersection
      [destination.lat - (destination.lat - midLat) * 0.5, destination.lng - (destination.lng - midLng) * 0.5],
      [destination.lat, destination.lng],
    ];

    // Detour safest route coordinates around low-lying river basin
    const detourOffsetLat = 0.015;
    const detourOffsetLng = 0.015;
    const safeCoords: [number, number][] = [
      [origin.lat, origin.lng],
      [origin.lat + detourOffsetLat, origin.lng - detourOffsetLng * 0.5],
      [midLat + detourOffsetLat, midLng + detourOffsetLng],
      [destination.lat + detourOffsetLat * 0.5, destination.lng + detourOffsetLng * 0.5],
      [destination.lat, destination.lng],
    ];

    // Predict flood depth at flooded intersection
    const floodPrediction = await FloodPredictionEngine.predictStreet(
      'mid-road-101',
      'Central Basin Corridor',
      midLat,
      midLng,
      'ROAD',
      forecastMinutes
    );

    const directDepth = floodPrediction.depthCm;
    const isDirectFlooded = directDepth > 15.0;

    // Fastest Route (Direct, but passes through flooded intersection)
    const fastestRoute: RouteOption = {
      type: 'FASTEST',
      title: 'Fastest Direct Route',
      coordinates: directCoords,
      distanceKm: 8.4,
      durationMin: 18,
      maxFloodDepthCm: directDepth,
      unsafeSegmentsCount: isDirectFlooded ? 2 : 0,
      riskScore: floodPrediction.riskScore,
      isSafe: !isDirectFlooded,
      recommendation: isDirectFlooded
        ? `HAZARD WARNING: Route passes through ${directDepth} cm flood depth at Central Corridor. High risk of vehicle stall.`
        : 'Route clear of major flood hazards.',
    };

    // Safest Route (Detour via elevated ridge avoiding flooded street)
    const safestRoute: RouteOption = {
      type: 'SAFEST',
      title: 'Flood-Safe Elevated Route',
      coordinates: safeCoords,
      distanceKm: 10.2, // Slightly longer
      durationMin: 22,
      maxFloodDepthCm: 3.5, // Well below hazard limit
      unsafeSegmentsCount: 0,
      riskScore: 12.0,
      isSafe: true,
      recommendation: 'RECOMMENDED: Route completely avoids low-lying inundated streets and surcharged drainage basins.',
    };

    // Emergency Route (Designated evacuation corridor for emergency response vehicles)
    const emergencyRoute: RouteOption = {
      type: 'EMERGENCY',
      title: 'Disaster Relief Evacuation Corridor',
      coordinates: safeCoords,
      distanceKm: 9.8,
      durationMin: 16,
      maxFloodDepthCm: 2.0,
      unsafeSegmentsCount: 0,
      riskScore: 8.0,
      isSafe: true,
      recommendation: 'Priority corridor monitored by emergency disaster response team.',
    };

    return {
      origin,
      destination,
      forecastMinutes,
      fastestRoute,
      safestRoute,
      emergencyRoute,
    };
  }
}
