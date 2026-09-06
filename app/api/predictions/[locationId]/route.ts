import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    const { locationId } = params;

    const risks = await db.floodRisk.findMany({
      where: { locationId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ predictions: risks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching prediction history' }, { status: 500 });
  }
}
