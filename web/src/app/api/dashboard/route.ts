import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query<{
      totalOrgs: number;
      totalContacts: number;
      activeOpps: number;
      recentEvents: number;
      avgScore: number | null;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM dbo.Organizations) AS totalOrgs,
        (SELECT COUNT(*) FROM dbo.Contacts) AS totalContacts,
        (SELECT COUNT(*) FROM dbo.Opportunities WHERE ClosedDate IS NULL) AS activeOpps,
        (SELECT COUNT(*)
         FROM dbo.EngagementEvents
         WHERE EventDate >= DATEADD(DAY, -30, GETDATE())) AS recentEvents,
        (SELECT AVG(CAST(OverallPartnershipScore AS FLOAT)) FROM dbo.OrganizationScores) AS avgScore
    `);
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
