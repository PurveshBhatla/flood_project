import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { WeatherService } from '@/lib/services/weather.service';
import { PredictionService } from '@/lib/services/prediction.service';
import { z } from 'zod';

const locationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isHome: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();

    const locations = await db.location.findMany({
      where: { userId: session.id },
      include: {
        floodRisks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ isHome: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ locations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const data = locationSchema.parse(body);

    if (data.isHome) {
      // Unset previous home location
      await db.location.updateMany({
        where: { userId: session.id, isHome: true },
        data: { isHome: false },
      });
    }

    const location = await db.location.create({
      data: {
        userId: session.id,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        state: data.state,
        country: data.country,
        isHome: data.isHome ?? false,
      },
    });

    // Compute initial flood risk & weather for this location
    const weather = await WeatherService.getWeather(data.latitude, data.longitude);
    const prediction = await PredictionService.predict({
      latitude: data.latitude,
      longitude: data.longitude,
      rainfall: weather.rainfall,
      temperature: weather.temperature,
      humidity: weather.humidity,
      waterLevel: 3.5,
    });

    await db.floodRisk.create({
      data: {
        locationId: location.id,
        latitude: data.latitude,
        longitude: data.longitude,
        riskScore: prediction.riskScore,
        probability: prediction.probability,
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
        rainfall: weather.rainfall,
        waterLevel: 3.5,
        temperature: weather.temperature,
        humidity: weather.humidity,
      },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error saving location' }, { status: 400 });
  }
}
