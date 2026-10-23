import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  calculateIncidentPriorityScore,
  refreshPotentialHotspots,
} from '@/lib/services/waterlogging.service';
import { haversineDistance } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await db.waterloggingReport.findUnique({
      where: { id: params.id },
      include: {
        hotspot: true,
        actions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // Find nearby reports within 300m
    const allActive = await db.waterloggingReport.findMany({
      where: {
        id: { not: report.id },
        status: { notIn: ['RESOLVED', 'REJECTED'] },
      },
      select: {
        id: true,
        streetName: true,
        latitude: true,
        longitude: true,
        depthCategory: true,
        status: true,
        createdAt: true,
      },
    });

    const nearbyReports = allActive
      .map((r) => {
        const distM = Math.round(haversineDistance(report.latitude, report.longitude, r.latitude, r.longitude) * 1000);
        return { ...r, distanceMeters: distM };
      })
      .filter((r) => r.distanceMeters <= 300)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    // Calculate live priority score breakdown
    const scoreBreakdown = calculateIncidentPriorityScore({
      depthCategory: report.depthCategory,
      waterLevelTrend: report.waterLevelTrend,
      roadCondition: report.roadCondition,
      createdAt: report.createdAt,
      nearbyReportCount: nearbyReports.length,
    });

    return NextResponse.json({
      success: true,
      report,
      nearbyReports,
      scoreBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching report details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, actorName = 'Municipal Operator', notes = '' } = body;

    const validStatuses = ['UNVERIFIED', 'VERIFIED', 'RESOLVED', 'STALE', 'REJECTED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const current = await db.waterloggingReport.findUnique({
      where: { id: params.id },
    });

    if (!current) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const newStatus = status.toUpperCase();
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'VERIFIED') {
      updateData.verifiedAt = new Date();
    } else if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await db.waterloggingReport.update({
      where: { id: params.id },
      data: {
        ...updateData,
        actions: {
          create: {
            actionType: `STATUS_CHANGE_TO_${newStatus}`,
            actorName,
            notes: notes.trim() || `Status changed from ${current.status} to ${newStatus}.`,
          },
        },
      },
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Refresh hotspots if resolved or rejected
    await refreshPotentialHotspots();

    return NextResponse.json({
      success: true,
      report: updated,
    });
  } catch (error: any) {
    console.error('Error updating report status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update report status' }, { status: 500 });
  }
}
