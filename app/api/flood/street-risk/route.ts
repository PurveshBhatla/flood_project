import { NextResponse } from 'next/server';
import { FloodPredictionEngine } from '@/lib/services/hydrology/flood-prediction.engine';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '19.076');
    const lng = parseFloat(searchParams.get('lng') || '72.8777');
    const forecastMin = parseInt(searchParams.get('forecastMin') || '90', 10);

    // Fetch roads from DB or generate deterministic GIS street network centered around requested coordinates
    const dbRoads = await db.road.findMany({
      include: { segments: true },
    });

    const streetList = [
      { id: 'road-101', name: 'Central Ring Road & BKC Junction', lat: 19.076, lng: 72.8777, surface: 'ROAD', coords: [[72.865, 19.065], [72.872, 19.072], [72.8777, 19.076], [72.885, 19.082]] },
      { id: 'road-102', name: 'LBS Marg Corridor', lat: 19.08, lng: 72.885, surface: 'CONCRETE', coords: [[72.88, 19.07], [72.885, 19.078], [72.89, 19.085]] },
      { id: 'road-103', name: 'SV Road Underpass', lat: 19.06, lng: 72.84, surface: 'ROAD', coords: [[72.835, 19.055], [72.84, 19.06], [72.845, 19.065]] },
      { id: 'road-104', name: 'Western Express Highway Flyover', lat: 19.09, lng: 72.855, surface: 'ROAD', coords: [[72.85, 19.08], [72.855, 19.09], [72.86, 19.10]] },
      { id: 'road-105', name: 'Marine Coastal Expressway', lat: 18.95, lng: 72.825, surface: 'CONCRETE', coords: [[72.82, 18.94], [72.825, 18.95], [72.83, 18.96]] },
    ];

    const features = await Promise.all(
      streetList.map(async (st) => {
        const prediction = await FloodPredictionEngine.predictStreet(
          st.id,
          st.name,
          st.lat,
          st.lng,
          st.surface,
          forecastMin
        );

        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: st.coords,
          },
          properties: {
            streetId: st.id,
            streetName: st.name,
            depthCm: prediction.depthCm,
            probability: prediction.probability,
            riskLevel: prediction.riskLevel,
            recommendation: prediction.recommendation,
            forecastMinutes: prediction.forecastMinutes,
            startTimeMin: prediction.startTimeMin,
            peakTimeMin: prediction.peakTimeMin,
            durationMin: prediction.durationMin,
            hydrology: prediction.hydrology,
            drainage: prediction.drainage,
            scientificExplanation: prediction.scientificExplanation,
          },
        };
      })
    );

    const geoJson = {
      type: 'FeatureCollection',
      forecastMinutes: forecastMin,
      features,
    };

    return NextResponse.json(geoJson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error generating street flood GeoJSON' }, { status: 500 });
  }
}
