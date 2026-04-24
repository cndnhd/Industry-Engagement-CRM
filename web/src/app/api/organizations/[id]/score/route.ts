import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      'SELECT * FROM dbo.OrganizationScores WHERE OrganizationID = @id',
      { id: Number(id) },
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function scoreParams(orgId: number, body: Record<string, unknown>) {
  return {
    orgId,
    ExecutiveEngagementScore: body.ExecutiveEngagementScore ?? 0,
    MultiTouchpointScore: body.MultiTouchpointScore ?? 0,
    FacultyAlignmentScore: body.FacultyAlignmentScore ?? 0,
    GovernmentOverlayScore: body.GovernmentOverlayScore ?? 0,
    AdvisoryBoardScore: body.AdvisoryBoardScore ?? 0,
    PhilanthropicBehaviorScore: body.PhilanthropicBehaviorScore ?? 0,
    RegionalIdentityScore: body.RegionalIdentityScore ?? 0,
    NamingLevelProbabilityScore: body.NamingLevelProbabilityScore ?? null,
    Notes: body.Notes ?? null,
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rows = await query(
      `INSERT INTO dbo.OrganizationScores
        (OrganizationID, ExecutiveEngagementScore, MultiTouchpointScore,
         FacultyAlignmentScore, GovernmentOverlayScore, AdvisoryBoardScore,
         PhilanthropicBehaviorScore, RegionalIdentityScore, NamingLevelProbabilityScore,
         OverallPartnershipScore, Notes)
       OUTPUT INSERTED.*
       VALUES
        (@orgId, @ExecutiveEngagementScore, @MultiTouchpointScore,
         @FacultyAlignmentScore, @GovernmentOverlayScore, @AdvisoryBoardScore,
         @PhilanthropicBehaviorScore, @RegionalIdentityScore, @NamingLevelProbabilityScore,
         ROUND((ISNULL(@ExecutiveEngagementScore,0)*0.25 + ISNULL(@MultiTouchpointScore,0)*0.20 + ISNULL(@FacultyAlignmentScore,0)*0.15 + ISNULL(@GovernmentOverlayScore,0)*0.10 + ISNULL(@AdvisoryBoardScore,0)*0.10 + ISNULL(@PhilanthropicBehaviorScore,0)*0.10 + ISNULL(@RegionalIdentityScore,0)*0.10) * 20, 2),
         @Notes)`,
      scoreParams(Number(id), body),
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('UNIQUE') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'Score already exists for this organization. Use PUT to update.' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rows = await query(
      `UPDATE dbo.OrganizationScores SET
        ExecutiveEngagementScore = @ExecutiveEngagementScore,
        MultiTouchpointScore = @MultiTouchpointScore,
        FacultyAlignmentScore = @FacultyAlignmentScore,
        GovernmentOverlayScore = @GovernmentOverlayScore,
        AdvisoryBoardScore = @AdvisoryBoardScore,
        PhilanthropicBehaviorScore = @PhilanthropicBehaviorScore,
        RegionalIdentityScore = @RegionalIdentityScore,
        NamingLevelProbabilityScore = @NamingLevelProbabilityScore,
        Notes = @Notes,
        OverallPartnershipScore = ROUND((ISNULL(@ExecutiveEngagementScore,0)*0.25 + ISNULL(@MultiTouchpointScore,0)*0.20 + ISNULL(@FacultyAlignmentScore,0)*0.15 + ISNULL(@GovernmentOverlayScore,0)*0.10 + ISNULL(@AdvisoryBoardScore,0)*0.10 + ISNULL(@PhilanthropicBehaviorScore,0)*0.10 + ISNULL(@RegionalIdentityScore,0)*0.10) * 20, 2),
        ScoreDate = CONVERT(date, SYSDATETIME())
       OUTPUT INSERTED.*
       WHERE OrganizationID = @orgId`,
      scoreParams(Number(id), body),
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
