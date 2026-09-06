import { NextResponse } from 'next/server';
import { WeatherService } from '@/lib/services/weather.service';
import { PredictionService } from '@/lib/services/prediction.service';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '19.076');
    const lng = parseFloat(searchParams.get('lng') || '72.8777');

    const weather = await WeatherService.getWeather(lat, lng);

    // Check nearest monitoring station for water level
    const station = await db.monitoringStation.findFirst({
      orderBy: { waterLevel: 'desc' },
    });

    const waterLevel = station ? station.waterLevel : 3.8;

    const prediction = await PredictionService.predict({
      latitude: lat,
      longitude: lng,
      rainfall: weather.rainfall,
      temperature: weather.temperature,
      humidity: weather.humidity,
      waterLevel: waterLevel,
    });

    return NextResponse.json({
      weather,
      prediction,
      station: station ? { name: station.name, waterLevel: station.waterLevel } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error computing risk' }, { status: 500 });
  }
}
