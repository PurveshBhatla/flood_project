import { NextResponse } from 'next/server';
import { RescueResourceService } from '@/lib/services/rescue-resource.service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    const lat = latStr ? parseFloat(latStr) : 19.076;
    const lng = lngStr ? parseFloat(lngStr) : 72.8777;

    const data = await RescueResourceService.getResources(lat, lng);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching rescue resources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rescue resources' },
      { status: 500 }
    );
  }
}
