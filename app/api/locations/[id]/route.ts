import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const location = await db.location.findFirst({
      where: { id, userId: session.id },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    await db.location.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting location' }, { status: 400 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await req.json();

    const location = await db.location.findFirst({
      where: { id, userId: session.id },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    if (body.isHome) {
      await db.location.updateMany({
        where: { userId: session.id, isHome: true },
        data: { isHome: false },
      });
    }

    const updated = await db.location.update({
      where: { id },
      data: {
        name: body.name ?? location.name,
        isHome: body.isHome !== undefined ? body.isHome : location.isHome,
      },
    });

    return NextResponse.json({ location: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating location' }, { status: 400 });
  }
}
