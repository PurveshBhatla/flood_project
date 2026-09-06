import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    let dbStatus = 'HEALTHY';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'DEGRADED';
    }

    let mlStatus = 'HEALTHY';
    let mlLatencyMs = 0;
    try {
      const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
      const start = Date.now();
      const res = await fetch(`${mlUrl}/health`, { cache: 'no-store' });
      mlLatencyMs = Date.now() - start;
      if (!res.ok) mlStatus = 'OFFLINE_FALLBACK_ACTIVE';
    } catch {
      mlStatus = 'OFFLINE_FALLBACK_ACTIVE';
    }

    let weatherStatus = 'HEALTHY';
    try {
      const weatherUrl = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com/v1';
      const res = await fetch(`${weatherUrl}/forecast?latitude=19.07&longitude=72.87&current=temperature_2m`, { cache: 'no-store' });
      if (!res.ok) weatherStatus = 'DEGRADED';
    } catch {
      weatherStatus = 'FALLBACK_GENERATOR_ACTIVE';
    }

    return NextResponse.json({
      services: {
        database: { status: dbStatus, type: 'SQLite / PostgreSQL' },
        mlMicroservice: { status: mlStatus, latencyMs: mlLatencyMs, targetUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000' },
        weatherDataFeed: { status: weatherStatus, provider: 'Open-Meteo REST API' },
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Forbidden' }, { status: 403 });
  }
}
