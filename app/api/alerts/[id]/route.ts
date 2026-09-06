import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { id } = params;

    await db.floodAlert.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Alert deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting alert' }, { status: 400 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await req.json();

    const updated = await db.floodAlert.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity,
        affectedArea: body.affectedArea,
      },
    });

    return NextResponse.json({ alert: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating alert' }, { status: 400 });
  }
}
