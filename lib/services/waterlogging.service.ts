import { db } from '../db';
import { haversineDistance } from '../utils';

// ==========================================
// CONFIGURABLE THRESHOLDS
// ==========================================
export const FLOODWATCH_CONFIG = {
  DUPLICATE_DISTANCE_METERS: 150, // 150m threshold for duplicate detection
  DUPLICATE_TIME_WINDOW_HOURS: 4,  // Within 4 hours considered potential duplicate
  HOTSPOT_PROXIMITY_METERS: 300,   // 300m threshold for potential hotspot grouping
  STALE_REPORT_HOURS: 6,           // Reports older than 6h without updates flagged stale
};

export type DepthCategory = 'ANKLE' | 'KNEE' | 'WAIST' | 'SUBMERGED';
export type WaterLevelTrend = 'RISING' | 'STABLE' | 'FALLING' | 'UNKNOWN';
export type RoadCondition = 'PASSABLE' | 'DIFFICULT' | 'BLOCKED' | 'UNKNOWN';
export type ReportStatus = 'UNVERIFIED' | 'VERIFIED' | 'RESOLVED' | 'STALE' | 'REJECTED';

export interface ScoreBreakdown {
  baseSeverityPoints: number;
  trendAdjustment: number;
  roadConditionPoints: number;
  densityBoost: number;
  recencyMultiplier: number;
  finalScore: number;
  isStale: boolean;
  explanation: string;
}

/**
 * Calculates a transparent Incident Priority Score between 0 and 100.
 * NOTE: This is an operational dispatch priority score, NOT a scientific flood forecast or water depth prediction.
 */
export function calculateIncidentPriorityScore(params: {
  depthCategory: string;
  waterLevelTrend?: string;
  roadCondition?: string;
  createdAt?: Date | string;
  nearbyReportCount?: number;
}): ScoreBreakdown {
  const depth = (params.depthCategory || 'KNEE').toUpperCase();
  const trend = (params.waterLevelTrend || 'UNKNOWN').toUpperCase();
  const road = (params.roadCondition || 'UNKNOWN').toUpperCase();
  const nearby = params.nearbyReportCount ?? 0;
  const createdAtDate = params.createdAt ? new Date(params.createdAt) : new Date();

  // 1. Base Severity Points (0 - 85)
  let baseSeverityPoints = 40;
  if (depth === 'ANKLE') baseSeverityPoints = 20;
  else if (depth === 'KNEE') baseSeverityPoints = 40;
  else if (depth === 'WAIST') baseSeverityPoints = 65;
  else if (depth === 'SUBMERGED') baseSeverityPoints = 85;

  // 2. Water Level Trend Adjustment (-10 to +10)
  let trendAdjustment = 0;
  if (trend === 'RISING') trendAdjustment = 10;
  else if (trend === 'FALLING') trendAdjustment = -10;
  else if (trend === 'STABLE') trendAdjustment = 0;

  // 3. Road Condition Points (0 - 15)
  let roadConditionPoints = 0;
  if (road === 'BLOCKED') roadConditionPoints = 15;
  else if (road === 'DIFFICULT') roadConditionPoints = 8;
  else if (road === 'PASSABLE') roadConditionPoints = 0;

  // 4. Cluster Density Boost (+5 pts per nearby report within 300m, capped at +15)
  const densityBoost = Math.min(15, nearby * 5);

  // 5. Recency Decay Multiplier
  const ageInHours = Math.max(0, (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60));
  let recencyMultiplier = 1.0;
  let isStale = false;

  if (ageInHours <= 1) {
    recencyMultiplier = 1.0;
  } else if (ageInHours <= 3) {
    recencyMultiplier = 0.9;
  } else if (ageInHours <= 6) {
    recencyMultiplier = 0.75;
  } else {
    recencyMultiplier = 0.5;
    isStale = true;
  }

  // 6. Calculate Normalized Score [0, 100]
  const subtotal = Math.max(0, baseSeverityPoints + trendAdjustment + roadConditionPoints + densityBoost);
  const rawScore = subtotal * recencyMultiplier;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const explanation = `Base (${baseSeverityPoints} pts [${depth}]) ${
    trendAdjustment >= 0 ? '+' : ''
  }${trendAdjustment} pts [trend: ${trend}] + ${roadConditionPoints} pts [road: ${road}] + ${densityBoost} pts [${nearby} nearby reports] × ${recencyMultiplier.toFixed(
    2
  )} recency factor (${ageInHours.toFixed(1)}h old)`;

  return {
    baseSeverityPoints,
    trendAdjustment,
    roadConditionPoints,
    densityBoost,
    recencyMultiplier,
    finalScore,
    isStale,
    explanation,
  };
}

/**
 * Detects potential duplicate reports within 150m radius and a 4-hour window.
 * Does not delete duplicates; flags them for admin consolidation.
 */
export async function detectPotentialDuplicates(
  lat: number,
  lng: number,
  currentReportId?: string
): Promise<{ isDuplicate: boolean; parentReportId: string | null; distanceMeters: number | null }> {
  const cutoffTime = new Date(Date.now() - FLOODWATCH_CONFIG.DUPLICATE_TIME_WINDOW_HOURS * 60 * 60 * 1000);

  // Find non-resolved reports created recently
  const recentReports = await db.waterloggingReport.findMany({
    where: {
      status: { notIn: ['RESOLVED', 'REJECTED'] },
      createdAt: { gte: cutoffTime },
      ...(currentReportId ? { id: { not: currentReportId } } : {}),
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      streetName: true,
      createdAt: true,
      isDuplicate: true,
      parentReportId: true,
    },
  });

  for (const existing of recentReports) {
    const distKm = haversineDistance(lat, lng, existing.latitude, existing.longitude);
    const distMeters = distKm * 1000;

    if (distMeters <= FLOODWATCH_CONFIG.DUPLICATE_DISTANCE_METERS) {
      // Found candidate duplicate within ~150 meters
      const parentId = existing.isDuplicate && existing.parentReportId ? existing.parentReportId : existing.id;
      return {
        isDuplicate: true,
        parentReportId: parentId,
        distanceMeters: Math.round(distMeters),
      };
    }
  }

  return { isDuplicate: false, parentReportId: null, distanceMeters: null };
}

/**
 * Counts active reports within 300m radius of a location.
 */
export async function countNearbyReports(lat: number, lng: number, excludeId?: string): Promise<number> {
  const activeReports = await db.waterloggingReport.findMany({
    where: {
      status: { notIn: ['RESOLVED', 'REJECTED'] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { latitude: true, longitude: true },
  });

  let count = 0;
  for (const r of activeReports) {
    const distMeters = haversineDistance(lat, lng, r.latitude, r.longitude) * 1000;
    if (distMeters <= FLOODWATCH_CONFIG.HOTSPOT_PROXIMITY_METERS) {
      count++;
    }
  }
  return count;
}

/**
 * Re-clusters reports into Potential Waterlogging Hotspots (~300m proximity).
 * Automatically updates or creates Hotspot entities in the database.
 */
export async function refreshPotentialHotspots(): Promise<number> {
  const activeReports = await db.waterloggingReport.findMany({
    where: { status: { notIn: ['RESOLVED', 'REJECTED'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (activeReports.length === 0) {
    return 0;
  }

  // Simple spatial greedy clustering: group reports within 300m
  const clusters: Array<{
    centerLat: number;
    centerLng: number;
    reports: typeof activeReports;
  }> = [];

  for (const report of activeReports) {
    let matchedCluster = null;
    for (const cluster of clusters) {
      const distMeters =
        haversineDistance(report.latitude, report.longitude, cluster.centerLat, cluster.centerLng) * 1000;
      if (distMeters <= FLOODWATCH_CONFIG.HOTSPOT_PROXIMITY_METERS) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.reports.push(report);
      // Recalculate cluster center as centroid
      const total = matchedCluster.reports.length;
      matchedCluster.centerLat = matchedCluster.reports.reduce((acc, r) => acc + r.latitude, 0) / total;
      matchedCluster.centerLng = matchedCluster.reports.reduce((acc, r) => acc + r.longitude, 0) / total;
    } else {
      clusters.push({
        centerLat: report.latitude,
        centerLng: report.longitude,
        reports: [report],
      });
    }
  }

  // Update DB hotspots
  for (const cluster of clusters) {
    const reportCount = cluster.reports.length;
    const maxDepthCm = Math.max(...cluster.reports.map((r) => r.depthCm));
    const maxDepthCategory =
      maxDepthCm >= 90 ? 'SUBMERGED' : maxDepthCm >= 45 ? 'WAIST' : maxDepthCm >= 15 ? 'KNEE' : 'ANKLE';

    const avgPriority = Math.round(
      cluster.reports.reduce((acc, r) => acc + r.priorityScore, 0) / reportCount
    );

    // Primary street or title
    const primaryStreet = cluster.reports[0].streetName;
    const title = `Potential Hotspot: ${primaryStreet} (${reportCount} reports)`;

    // Find existing hotspot near cluster center
    const existing = await db.hotspot.findFirst({
      where: {
        centerLat: { gte: cluster.centerLat - 0.003, lte: cluster.centerLat + 0.003 },
        centerLng: { gte: cluster.centerLng - 0.003, lte: cluster.centerLng + 0.003 },
        status: 'ACTIVE',
      },
    });

    let hotspotId = existing?.id;

    if (existing) {
      await db.hotspot.update({
        where: { id: existing.id },
        data: {
          title,
          centerLat: cluster.centerLat,
          centerLng: cluster.centerLng,
          reportCount,
          maxDepthCategory,
          maxDepthCm,
          priorityScore: avgPriority,
          status: 'ACTIVE',
        },
      });
    } else {
      const created = await db.hotspot.create({
        data: {
          title,
          centerLat: cluster.centerLat,
          centerLng: cluster.centerLng,
          radiusMeters: FLOODWATCH_CONFIG.HOTSPOT_PROXIMITY_METERS,
          reportCount,
          maxDepthCategory,
          maxDepthCm,
          priorityScore: avgPriority,
          status: 'ACTIVE',
        },
      });
      hotspotId = created.id;
    }

    // Link reports to this hotspot
    if (hotspotId) {
      const reportIds = cluster.reports.map((r) => r.id);
      await db.waterloggingReport.updateMany({
        where: { id: { in: reportIds } },
        data: { hotspotId },
      });
    }
  }

  return clusters.length;
}

/**
 * Checks all reports and flags those older than 6 hours as stale.
 */
export async function refreshReportStaleness(): Promise<number> {
  const staleCutoff = new Date(Date.now() - FLOODWATCH_CONFIG.STALE_REPORT_HOURS * 60 * 60 * 1000);

  const result = await db.waterloggingReport.updateMany({
    where: {
      status: 'UNVERIFIED',
      createdAt: { lt: staleCutoff },
      isStale: false,
    },
    data: {
      isStale: true,
      status: 'STALE',
    },
  });

  return result.count;
}
