import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT
        st.StrategicTagID AS id,
        st.TagName AS name,
        COUNT(DISTINCT ost.OrganizationID) AS orgCount
      FROM dbo.StrategicTags st
      LEFT JOIN dbo.OrganizationStrategicTags ost ON st.StrategicTagID = ost.StrategicTagID
      GROUP BY st.StrategicTagID, st.TagName
      ORDER BY st.TagName
    `);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
