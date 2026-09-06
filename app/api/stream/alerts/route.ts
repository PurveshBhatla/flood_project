import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendAlerts = async () => {
        try {
          const alerts = await db.floodAlert.findMany({
            where: { expiresAt: { gte: new Date() } },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          const stations = await db.monitoringStation.findMany({
            take: 10,
            orderBy: { waterLevel: 'desc' },
          });

          const payload = JSON.stringify({
            timestamp: new Date().toISOString(),
            alerts,
            stations,
          });

          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error('SSE Stream error:', err);
        }
      };

      await sendAlerts();
      const interval = setInterval(sendAlerts, 10000); // 10s tick

      // Keep stream alive
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
