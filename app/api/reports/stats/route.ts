import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { refreshReportStaleness } from '@/lib/services/waterlogging.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await refreshReportStaleness();

    const [
      totalReports,
      verifiedReports,
      unverifiedReports,
      resolvedReports,
      staleReports,
      activeHotspots,
      highPriorityReports,
    ] = await Promise.all([
      db.waterloggingReport.count(),
      db.waterloggingReport.count({ where: { status: 'VERIFIED' } }),
      db.waterloggingReport.count({ where: { status: 'UNVERIFIED' } }),
      db.waterloggingReport.count({ where: { status: 'RESOLVED' } }),
      db.waterloggingReport.count({ where: { status: 'STALE' } }),
      db.hotspot.count({ where: { status: 'ACTIVE' } }),
      db.waterloggingReport.count({ where: { priorityScore: { gte: 70 }, status: { notIn: ['RESOLVED', 'REJECTED'] } } }),
    ]);

    // Average priority score of active incidents
    const activeIncidents = await db.waterloggingReport.findMany({
      where: { status: { notIn: ['RESOLVED', 'REJECTED'] } },
      select: { priorityScore: true },
    });

    const avgPriority =
      activeIncidents.length > 0
        ? Math.round(activeIncidents.reduce((acc, r) => acc + r.priorityScore, 0) / activeIncidents.length)
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalReports,
        verifiedReports,
        unverifiedReports,
        resolvedReports,
        staleReports,
        activeHotspots,
        highPriorityReports,
        avgPriority,
      },
    });
  } catch (error: any) {
    console.error('Error fetching waterlogging stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waterlogging statistics' },
      { status: 500 }
    );
  }
}
