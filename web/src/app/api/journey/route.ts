import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT jl.*, js.JourneyStageName, o.OrganizationName
      FROM dbo.JourneyLog jl
      LEFT JOIN dbo.JourneyStages js ON jl.JourneyStageID = js.JourneyStageID
      LEFT JOIN dbo.Organizations o ON jl.OrganizationID = o.OrganizationID
      ORDER BY jl.LogDate DESC
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
      `INSERT INTO dbo.JourneyLog
        (OrganizationID, ContactID, JourneyStageID, LogDate, EventType, Outcome,
         NextStep, NextStepDate, Owner, Notes, Summary)
       OUTPUT INSERTED.*
       VALUES
        (@OrganizationID, @ContactID, @JourneyStageID, @LogDate, @EventType, @Outcome,
         @NextStep, @NextStepDate, @Owner, @Notes, @Summary)`,
      {
        OrganizationID: body.OrganizationID,
        ContactID: body.ContactID ?? null,
        JourneyStageID: body.JourneyStageID,
        LogDate: body.LogDate,
        EventType: body.EventType ?? null,
        Outcome: body.Outcome ?? null,
        NextStep: body.NextStep ?? null,
        NextStepDate: body.NextStepDate ?? null,
        Owner: body.Owner ?? null,
        Notes: body.Notes ?? null,
        Summary: body.Summary ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
