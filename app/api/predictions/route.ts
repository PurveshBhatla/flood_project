import { NextResponse } from 'next/server';
import { PredictionService } from '@/lib/services/prediction.service';
import { db } from '@/lib/db';
import { z } from 'zod';

const predictSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  rainfall: z.number(),
  rainfallIntensity: z.number().optional(),
  temperature: z.number(),
  humidity: z.number().optional(),
  waterLevel: z.number(),
  historicalRisk: z.number().optional(),
  soilMoisture: z.number().optional(),
  locationId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = predictSchema.parse(body);

    const prediction = await PredictionService.predict(data);

    if (data.locationId) {
      await db.floodRisk.create({
        data: {
          locationId: data.locationId,
          latitude: data.latitude,
          longitude: data.longitude,
          riskScore: prediction.riskScore,
          probability: prediction.probability,
          riskLevel: prediction.riskLevel,
          confidence: prediction.confidence,
          rainfall: data.rainfall,
          waterLevel: data.waterLevel,
          temperature: data.temperature,
          humidity: data.humidity,
          soilMoisture: data.soilMoisture,
        },
      });
    }

    return NextResponse.json(prediction);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Error processing prediction' }, { status: 500 });
  }
}
