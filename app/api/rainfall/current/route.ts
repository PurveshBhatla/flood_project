import { NextResponse } from 'next/server';
import { RainfallService } from '@/lib/services/rainfall.service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    const lat = latStr ? parseFloat(latStr) : 19.076;
    const lng = lngStr ? parseFloat(lngStr) : 72.8777;
    const radius = radiusStr ? parseFloat(radiusStr) : 15;

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude parameters' },
        { status: 400 }
      );
    }

    const rainfallData = await RainfallService.getRainfall(lat, lng, radius);
    return NextResponse.json(rainfallData);
  } catch (error: any) {
    console.error('Error fetching live rainfall data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rainfall data' },
      { status: 500 }
    );
  }
}
