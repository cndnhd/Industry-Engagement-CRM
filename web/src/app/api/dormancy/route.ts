import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT o.OrganizationID, o.OrganizationName, o.AssignedOwner,
             o.LastMeaningfulEngagement, o.NextActionDate,
             o.PartnershipStageID, ps.StageName,
             DATEDIFF(DAY, o.LastMeaningfulEngagement, GETDATE()) AS DaysSinceEngagement,
             CASE
               WHEN o.LastMeaningfulEngagement IS NULL THEN 'Never Engaged'
               WHEN DATEDIFF(DAY, o.LastMeaningfulEngagement, GETDATE()) > 120 THEN 'Dormant'
               WHEN o.NextActionDate < GETDATE() THEN 'Overdue Action'
               ELSE 'At Risk'
             END AS DormancyStatus
      FROM dbo.Organizations o
      LEFT JOIN dbo.PartnershipStages ps ON o.PartnershipStageID = ps.PartnershipStageID
      WHERE o.ArchivedFlag = 0
        AND (o.LastMeaningfulEngagement IS NULL
             OR DATEDIFF(DAY, o.LastMeaningfulEngagement, GETDATE()) > 120
             OR (o.NextActionDate IS NOT NULL AND o.NextActionDate < GETDATE()))
      ORDER BY DaysSinceEngagement DESC
    `);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
