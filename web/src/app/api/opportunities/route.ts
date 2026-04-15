import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT * FROM dbo.Opportunities
      ORDER BY OpportunityID DESC
    `);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = await query(
      `INSERT INTO dbo.Opportunities
        (OrganizationID, OpportunityName, OpportunityTypeID, StageID, StatusID,
         OwnerName, EstimatedValue, ProbabilityScore, StrategicImportanceScore,
         OpenedDate, TargetCloseDate, ClosedDate, NextStep, Notes)
       OUTPUT INSERTED.*
       VALUES
        (@OrganizationID, @OpportunityName, @OpportunityTypeID, @StageID, @StatusID,
         @OwnerName, @EstimatedValue, @ProbabilityScore, @StrategicImportanceScore,
         @OpenedDate, @TargetCloseDate, @ClosedDate, @NextStep, @Notes)`,
      {
        OrganizationID: body.OrganizationID,
        OpportunityName: body.OpportunityName,
        OpportunityTypeID: body.OpportunityTypeID ?? null,
        StageID: body.StageID ?? null,
        StatusID: body.StatusID ?? null,
        OwnerName: body.OwnerName ?? null,
        EstimatedValue: body.EstimatedValue ?? null,
        ProbabilityScore: body.ProbabilityScore ?? null,
        StrategicImportanceScore: body.StrategicImportanceScore ?? null,
        OpenedDate: body.OpenedDate ?? null,
        TargetCloseDate: body.TargetCloseDate ?? null,
        ClosedDate: body.ClosedDate ?? null,
        NextStep: body.NextStep ?? null,
        Notes: body.Notes ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
