import { NextResponse } from 'next/server';
import { RainfallService } from '@/lib/services/rainfall.service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    const lat = latStr ? parseFloat(latStr) : undefined;
    const lng = lngStr ? parseFloat(lngStr) : undefined;
    const radius = radiusStr ? parseFloat(radiusStr) : 15;

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
