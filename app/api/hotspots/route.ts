import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { refreshPotentialHotspots } from '@/lib/services/waterlogging.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Optionally trigger a fresh cluster calculation
    await refreshPotentialHotspots();

    const hotspots = await db.hotspot.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { priorityScore: 'desc' },
      include: {
        reports: {
          select: {
            id: true,
            streetName: true,
            depthCategory: true,
            depthCm: true,
            priorityScore: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: hotspots.length,
      hotspots,
    });
  } catch (error: any) {
    console.error('Error fetching hotspots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch potential hotspots' },
      { status: 500 }
    );
  }
}
