import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT ia.InterestAreaID, ia.AreaName
       FROM dbo.ContactInterestAreas cia
       JOIN dbo.InterestAreas ia ON cia.InterestAreaID = ia.InterestAreaID
       WHERE cia.ContactID = @id`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const interestAreaIds: number[] = body.interestAreaIds ?? [];

    await query('DELETE FROM dbo.ContactInterestAreas WHERE ContactID = @id', { id: Number(id) });

    for (const areaId of interestAreaIds) {
      await query(
        'INSERT INTO dbo.ContactInterestAreas (ContactID, InterestAreaID) VALUES (@contactId, @areaId)',
        { contactId: Number(id), areaId },
      );
    }
    return NextResponse.json({ success: true, count: interestAreaIds.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
