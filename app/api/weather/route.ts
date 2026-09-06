import { NextResponse } from 'next/server';
import { WeatherService } from '@/lib/services/weather.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    const lat = latStr ? parseFloat(latStr) : 19.076;
    const lng = lngStr ? parseFloat(lngStr) : 72.8777;

    const weather = await WeatherService.getWeather(lat, lng);
    return NextResponse.json({ weather });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching weather' }, { status: 500 });
  }
}
