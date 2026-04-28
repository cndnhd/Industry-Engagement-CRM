import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [statsRows, tagRows, maturityRows, overdueRows, recentJourneyRows, activityDistRows] = await Promise.all([
      query<{
        totalOrgs: number;
        totalContacts: number;
        activeOpps: number;
        recentEvents: number;
        avgScore: number | null;
        dormantOrgs: number;
        overdueActions: number;
        upcomingActions: number;
        recentJourneyEntries: number;
        savedSegments: number;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM dbo.Organizations) AS totalOrgs,
          (SELECT COUNT(*) FROM dbo.Contacts) AS totalContacts,
          (SELECT COUNT(*) FROM dbo.Opportunities WHERE ClosedDate IS NULL) AS activeOpps,
          (SELECT COUNT(*)
           FROM dbo.EngagementEvents
           WHERE EventDate >= DATEADD(DAY, -30, GETDATE())) AS recentEvents,
          (SELECT ISNULL(AVG(CAST(OverallPartnershipScore AS FLOAT)), 0) FROM dbo.OrganizationScores) AS avgScore,
          (SELECT COUNT(*) FROM dbo.Organizations
           WHERE LastMeaningfulEngagement < DATEADD(DAY, -120, GETDATE())
              OR LastMeaningfulEngagement IS NULL) AS dormantOrgs,
          (SELECT COUNT(*) FROM dbo.Organizations
           WHERE NextActionDate IS NOT NULL AND NextActionDate < GETDATE()) AS overdueActions,
          (SELECT COUNT(*) FROM dbo.Organizations
           WHERE NextActionDate IS NOT NULL
             AND NextActionDate BETWEEN GETDATE() AND DATEADD(DAY, 14, GETDATE())) AS upcomingActions,
          (SELECT COUNT(*) FROM dbo.JourneyLog
           WHERE LogDate >= DATEADD(DAY, -30, GETDATE())) AS recentJourneyEntries,
          (SELECT COUNT(*) FROM dbo.SegmentDefinitions) AS savedSegments
      `),

      query<{ tagName: string; orgCount: number }>(`
        SELECT st.TagName AS tagName, COUNT(*) AS orgCount
        FROM dbo.OrganizationStrategicTags ost
        JOIN dbo.StrategicTags st ON ost.StrategicTagID = st.StrategicTagID
        GROUP BY st.TagName
        ORDER BY orgCount DESC
      `),

      query<{ stageName: string; stageLevel: number; orgCount: number }>(`
        SELECT ps.StageName AS stageName, ps.StageLevel AS stageLevel, COUNT(o.OrganizationID) AS orgCount
        FROM dbo.PartnershipStages ps
        LEFT JOIN dbo.Organizations o ON o.PartnershipStageID = ps.PartnershipStageID
        GROUP BY ps.StageName, ps.StageLevel
        ORDER BY ps.StageLevel
      `),

      query<{
        OrganizationID: number;
        OrganizationName: string;
        NextActionDate: string;
        AssignedOwner: string | null;
        LastMeaningfulEngagement: string | null;
      }>(`
        SELECT TOP 10
          o.OrganizationID, o.OrganizationName, o.NextActionDate,
          o.AssignedOwner, o.LastMeaningfulEngagement
        FROM dbo.Organizations o
        WHERE o.NextActionDate IS NOT NULL AND o.NextActionDate < GETDATE()
        ORDER BY o.NextActionDate ASC
      `),

      query<{
        JourneyLogID: number;
        OrganizationName: string | null;
        JourneyStageName: string | null;
        LogDate: string | null;
        EventType: string | null;
        Outcome: string | null;
        Notes: string | null;
        Owner: string | null;
      }>(`
        SELECT TOP 10
          jl.JourneyLogID, o.OrganizationName, js.JourneyStageName,
          jl.LogDate, jl.EventType, jl.Outcome, jl.Notes, jl.Owner
        FROM dbo.JourneyLog jl
        LEFT JOIN dbo.JourneyStages js ON jl.JourneyStageID = js.JourneyStageID
        LEFT JOIN dbo.Organizations o ON jl.OrganizationID = o.OrganizationID
        ORDER BY jl.LogDate DESC
      `),

      query<{ eventType: string; count: number }>(`
        SELECT
          ISNULL(EventType, 'Unspecified') AS eventType,
          COUNT(*) AS count
        FROM dbo.JourneyLog
        GROUP BY EventType
        ORDER BY count DESC
      `),
    ]);

    const stats = statsRows[0];

    return NextResponse.json({
      stats: {
        totalOrgs: stats.totalOrgs,
        totalContacts: stats.totalContacts,
        activeOpps: stats.activeOpps,
        recentEvents: stats.recentEvents,
        avgScore: stats.avgScore ?? 0,
        dormantOrgs: stats.dormantOrgs,
        overdueActions: stats.overdueActions,
        upcomingActions: stats.upcomingActions,
        recentJourneyEntries: stats.recentJourneyEntries,
        savedSegments: stats.savedSegments,
      },
      tagDistribution: tagRows,
      maturityDistribution: maturityRows,
      overdueFollowUps: overdueRows,
      recentJourneyLogs: recentJourneyRows,
      activityDistribution: activityDistRows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
