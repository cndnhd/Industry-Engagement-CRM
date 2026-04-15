import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT
        g.GovernmentAlignmentTypeID AS id,
        g.AlignmentName AS name,
        COUNT(DISTINCT a.OrganizationID) AS orgCount
      FROM dbo.GovernmentAlignmentTypes g
      LEFT JOIN dbo.OrganizationGovernmentAlignments a
        ON g.GovernmentAlignmentTypeID = a.GovernmentAlignmentTypeID
      GROUP BY g.GovernmentAlignmentTypeID, g.AlignmentName
      ORDER BY g.AlignmentName
    `);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
