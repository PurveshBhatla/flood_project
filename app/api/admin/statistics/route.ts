import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalLocations,
      totalAlerts,
      activeAlerts,
      totalStations,
      criticalStations,
      totalEvents,
      recentRisks,
    ] = await Promise.all([
      db.user.count(),
      db.location.count(),
      db.floodAlert.count(),
      db.floodAlert.count({ where: { expiresAt: { gte: new Date() } } }),
      db.monitoringStation.count(),
      db.monitoringStation.count({ where: { status: 'CRITICAL' } }),
      db.floodEvent.count(),
      db.floodRisk.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
    ]);

    // Risk distribution counts
    const riskDistribution = {
      LOW: recentRisks.filter((r) => r.riskLevel === 'LOW').length,
      MODERATE: recentRisks.filter((r) => r.riskLevel === 'MODERATE').length,
      HIGH: recentRisks.filter((r) => r.riskLevel === 'HIGH').length,
      CRITICAL: recentRisks.filter((r) => r.riskLevel === 'CRITICAL').length,
    };

    return NextResponse.json({
      totalUsers,
      totalLocations,
      totalAlerts,
      activeAlerts,
      totalStations,
      criticalStations,
      totalEvents,
      riskDistribution,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Forbidden' }, { status: 403 });
  }
}
