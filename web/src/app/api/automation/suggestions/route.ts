import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      -- Maturity upgrade suggestions: orgs with 3+ engagement events in last 90 days
      SELECT 'maturity_upgrade' AS SuggestionType,
             o.OrganizationID, o.OrganizationName, ps.StageName AS CurrentStage,
             COUNT(ee.EngagementEventID) AS RecentEventCount,
             'Consider upgrading maturity level - high recent activity' AS Suggestion
      FROM dbo.Organizations o
      LEFT JOIN dbo.PartnershipStages ps ON o.PartnershipStageID = ps.PartnershipStageID
      JOIN dbo.EngagementEvents ee ON o.OrganizationID = ee.OrganizationID
        AND ee.EventDate >= DATEADD(DAY, -90, GETDATE())
      GROUP BY o.OrganizationID, o.OrganizationName, ps.StageName
      HAVING COUNT(ee.EngagementEventID) >= 3

      UNION ALL

      -- Site visit occurred - suggest level 3+
      SELECT 'site_visit_upgrade' AS SuggestionType,
             o.OrganizationID, o.OrganizationName, ps.StageName,
             1 AS RecentEventCount,
             'Site visit logged - consider Active Project stage' AS Suggestion
      FROM dbo.Organizations o
      LEFT JOIN dbo.PartnershipStages ps ON o.PartnershipStageID = ps.PartnershipStageID
      JOIN dbo.EngagementEvents ee ON o.OrganizationID = ee.OrganizationID
      JOIN dbo.EngagementTypes et ON ee.EngagementTypeID = et.EngagementTypeID
      WHERE et.EngagementTypeName LIKE '%Site Visit%'
        AND ee.EventDate >= DATEADD(DAY, -180, GETDATE())
        AND (o.PartnershipStageID IS NULL OR ps.StageLevel < 3)

      UNION ALL

      -- Stalled: no engagement in 90 days but had some before
      SELECT 'stalled_warning' AS SuggestionType,
             o.OrganizationID, o.OrganizationName, ps.StageName,
             0 AS RecentEventCount,
             'No recent activity - relationship may be stalling' AS Suggestion
      FROM dbo.Organizations o
      LEFT JOIN dbo.PartnershipStages ps ON o.PartnershipStageID = ps.PartnershipStageID
      WHERE o.LastMeaningfulEngagement IS NOT NULL
        AND DATEDIFF(DAY, o.LastMeaningfulEngagement, GETDATE()) BETWEEN 90 AND 120
        AND o.ArchivedFlag = 0

      ORDER BY SuggestionType, RecentEventCount DESC
    `);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
