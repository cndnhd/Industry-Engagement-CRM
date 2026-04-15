import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT a.GovernmentAlignmentTypeID AS id, g.AlignmentName AS name, a.Notes
       FROM dbo.OrganizationGovernmentAlignments a
       JOIN dbo.GovernmentAlignmentTypes g ON a.GovernmentAlignmentTypeID = g.GovernmentAlignmentTypeID
       WHERE a.OrganizationID = @id`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
