import { NextResponse } from 'next/server';
import { RainfallNowcastService } from '@/lib/services/hydrology/rainfall-nowcast.service';
import { FloodPredictionEngine } from '@/lib/services/hydrology/flood-prediction.engine';
import { HotspotDetectionService } from '@/lib/services/hydrology/hotspot.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scenario = body.scenario || 'EXTREME_RAIN'; // NORMAL, HEAVY_RAIN, EXTREME_RAIN
    const lat = body.latitude || 19.076;
    const lng = body.longitude || 72.8777;

    const nowcast = await RainfallNowcastService.getNowcast(lat, lng);

    const streets = [
      { id: 'road-101', name: 'Central Ring Road & BKC Junction', lat: 19.076, lng: 72.8777, surface: 'ROAD' },
      { id: 'road-102', name: 'LBS Marg Corridor', lat: 19.08, lng: 72.885, surface: 'CONCRETE' },
      { id: 'road-103', name: 'SV Road Underpass', lat: 19.06, lng: 72.84, surface: 'ROAD' },
      { id: 'road-104', name: 'Western Express Highway Flyover', lat: 19.09, lng: 72.855, surface: 'ROAD' },
    ];

    // Simulate predictions across 0-3h timeline
    const timelinePredictions = await Promise.all(
      [0, 30, 60, 90, 120, 150, 180].map(async (min) => {
        const predictions = await Promise.all(
          streets.map((s) => FloodPredictionEngine.predictStreet(s.id, s.name, s.lat, s.lng, s.surface, min))
        );

        const hotspots = HotspotDetectionService.rankHotspots(predictions, {
          'road-101': [19.076, 72.8777],
          'road-102': [19.08, 72.885],
          'road-103': [19.06, 72.84],
          'road-104': [19.09, 72.855],
        });

        return {
          minutes: min,
          predictions,
          hotspots,
        };
      })
    );

    return NextResponse.json({
      scenario,
      nowcast,
      timeline: timelinePredictions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error running simulation scenario' }, { status: 500 });
  }
}
