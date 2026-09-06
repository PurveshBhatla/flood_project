import { db } from '@/lib/db';

export class FloodDataService {
  static async getMonitoringStations() {
    return db.monitoringStation.findMany({
      orderBy: { waterLevel: 'desc' },
    });
  }

  static async getHistoricalFloodEvents() {
    return db.floodEvent.findMany({
      orderBy: { date: 'desc' },
    });
  }

  static async getActiveAlerts() {
    return db.floodAlert.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getRecentFloodRisks(locationId?: string) {
    return db.floodRisk.findMany({
      where: locationId ? { locationId } : undefined,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }
}
