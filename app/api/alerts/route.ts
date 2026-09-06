import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const alertSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  severity: z.enum(['INFO', 'WARNING', 'DANGER', 'CRITICAL']),
  latitude: z.number(),
  longitude: z.number(),
  radiusKm: z.number().optional(),
  affectedArea: z.string(),
  expiresInHours: z.number().min(1).default(48),
});

export async function GET() {
  try {
    const alerts = await db.floodAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching alerts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = alertSchema.parse(body);

    const expiresAt = new Date(Date.now() + data.expiresInHours * 3600 * 1000);

    const alert = await db.floodAlert.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusKm: data.radiusKm ?? 10.0,
        affectedArea: data.affectedArea,
        expiresAt,
      },
    });

    // Notify all registered users
    const allUsers = await db.user.findMany({ select: { id: true } });
    if (allUsers.length > 0) {
      await db.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          alertId: alert.id,
          read: false,
        })),
      });
    }

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized / Validation error' }, { status: 400 });
  }
}
