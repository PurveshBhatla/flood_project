import { NextResponse } from 'next/server';
import { SafeRoutingService } from '@/lib/services/routing/safe-routing.service';
import { z } from 'zod';

const safeRouteSchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  forecastMinutes: z.number().optional().default(90),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = safeRouteSchema.parse(body);

    const result = await SafeRoutingService.calculateSafeRoute(
      data.origin,
      data.destination,
      data.forecastMinutes
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Error processing safe routing' }, { status: 500 });
  }
}
