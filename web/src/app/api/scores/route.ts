import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT s.*, o.OrganizationName
      FROM dbo.OrganizationScores s
      JOIN dbo.Organizations o ON s.OrganizationID = o.OrganizationID
      ORDER BY s.OverallPartnershipScore DESC
    `);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
