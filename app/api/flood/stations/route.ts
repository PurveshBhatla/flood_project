import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stations = await db.monitoringStation.findMany({
      orderBy: { waterLevel: 'desc' },
    });
    return NextResponse.json({ stations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching stations' }, { status: 500 });
  }
}
