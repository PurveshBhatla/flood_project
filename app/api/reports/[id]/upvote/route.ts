import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await db.waterloggingReport.update({
      where: { id: params.id },
      data: {
        upvotes: { increment: 1 },
      },
      select: {
        id: true,
        upvotes: true,
      },
    });

    return NextResponse.json({ success: true, upvotes: updated.upvotes });
  } catch (error: any) {
    console.error('Error upvoting report:', error);
    return NextResponse.json({ success: false, error: 'Failed to record upvote' }, { status: 500 });
  }
}
