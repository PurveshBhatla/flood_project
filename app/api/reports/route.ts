import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  calculateIncidentPriorityScore,
  detectPotentialDuplicates,
  countNearbyReports,
  refreshPotentialHotspots,
  refreshReportStaleness,
} from '@/lib/services/waterlogging.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const roadCondition = searchParams.get('roadCondition');
    const waterLevelTrend = searchParams.get('waterLevelTrend');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Refresh staleness on query
    await refreshReportStaleness();

    const where: any = {};

    if (severity && severity !== 'ALL') {
      where.depthCategory = severity.toUpperCase();
    }

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (roadCondition && roadCondition !== 'ALL') {
      where.roadCondition = roadCondition.toUpperCase();
    }

    if (waterLevelTrend && waterLevelTrend !== 'ALL') {
      where.waterLevelTrend = waterLevelTrend.toUpperCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { streetName: { contains: term } },
        { landmark: { contains: term } },
        { description: { contains: term } },
        { city: { contains: term } },
      ];
    }

    const reports = await db.waterloggingReport.findMany({
      where,
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        hotspot: true,
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error: any) {
    console.error('Error fetching waterlogging reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waterlogging reports' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      latitude,
      longitude,
      streetName,
      landmark,
      city = 'Mumbai',
      depthCategory = 'KNEE',
      depthCm,
      waterLevelTrend = 'UNKNOWN',
      roadCondition = 'UNKNOWN',
      hazardTags = [],
      description,
      photoUrl,
      reportedBy = 'Citizen Reporter',
    } = body;

    // Basic Validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid latitude and longitude coordinates are required.' },
        { status: 400 }
      );
    }

    if (!streetName || typeof streetName !== 'string' || streetName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Street name or identifiable location is required.' },
        { status: 400 }
      );
    }

    // Default depth in cm if not supplied
    let numericDepthCm = typeof depthCm === 'number' ? depthCm : 30;
    if (!depthCm) {
      if (depthCategory === 'ANKLE') numericDepthCm = 15;
      else if (depthCategory === 'KNEE') numericDepthCm = 35;
      else if (depthCategory === 'WAIST') numericDepthCm = 65;
      else if (depthCategory === 'SUBMERGED') numericDepthCm = 100;
    }

    // 1. Run Duplicate Report Detection (~150m threshold)
    const duplicateCheck = await detectPotentialDuplicates(latitude, longitude);

    // 2. Count Nearby Reports (~300m proximity)
    const nearbyCount = await countNearbyReports(latitude, longitude);

    // 3. Compute Transparent Incident Priority Score (0 - 100)
    const scoreResult = calculateIncidentPriorityScore({
      depthCategory,
      waterLevelTrend,
      roadCondition,
      createdAt: new Date(),
      nearbyReportCount: nearbyCount,
    });

    // 4. Save persistently in SQLite database
    const newReport = await db.waterloggingReport.create({
      data: {
        latitude,
        longitude,
        streetName: streetName.trim(),
        landmark: landmark?.trim() || null,
        city: city.trim(),
        depthCategory: depthCategory.toUpperCase(),
        depthCm: numericDepthCm,
        waterLevelTrend: waterLevelTrend.toUpperCase(),
        roadCondition: roadCondition.toUpperCase(),
        hazardTags: JSON.stringify(Array.isArray(hazardTags) ? hazardTags : []),
        description: description?.trim() || null,
        photoUrl: photoUrl || null,
        priorityScore: scoreResult.finalScore,
        isDuplicate: duplicateCheck.isDuplicate,
        parentReportId: duplicateCheck.parentReportId,
        status: 'UNVERIFIED',
        reportedBy: reportedBy.trim(),
        actions: {
          create: {
            actionType: duplicateCheck.isDuplicate ? 'MERGE_DUPLICATE_CANDIDATE' : 'REPORT_CREATED',
            actorName: reportedBy.trim(),
            notes: duplicateCheck.isDuplicate
              ? `Report registered. Potential duplicate within ${duplicateCheck.distanceMeters}m of existing report #${duplicateCheck.parentReportId}.`
              : `New waterlogging incident submitted. Priority Score: ${scoreResult.finalScore}/100.`,
          },
        },
      },
      include: {
        actions: true,
      },
    });

    // 5. Trigger background refresh of Potential Waterlogging Hotspots
    try {
      await refreshPotentialHotspots();
    } catch (e) {
      console.warn('Hotspot refresh warning:', e);
    }

    return NextResponse.json({
      success: true,
      report: newReport,
      scoreBreakdown: scoreResult,
      duplicateInfo: duplicateCheck,
    });
  } catch (error: any) {
    console.error('Error creating waterlogging report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save waterlogging report' },
      { status: 500 }
    );
  }
}
