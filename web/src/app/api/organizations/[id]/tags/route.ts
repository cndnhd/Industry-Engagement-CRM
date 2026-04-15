import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT t.StrategicTagID AS id, st.TagName AS name
       FROM dbo.OrganizationStrategicTags t
       JOIN dbo.StrategicTags st ON t.StrategicTagID = st.StrategicTagID
       WHERE t.OrganizationID = @id`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
