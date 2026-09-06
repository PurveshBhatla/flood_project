import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const events = await db.floodEvent.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching events' }, { status: 500 });
  }
}
