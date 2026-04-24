import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT * FROM dbo.EngagementEvents
      ORDER BY EventDate DESC
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
      `INSERT INTO dbo.EngagementEvents
        (OrganizationID, PrimaryContactID, EventDate, OutreachMotionID, EngagementTypeID,
         ResponseTimeDays, FollowUpCadenceDays, Subject, Outcome, Notes, NextStep, NextStepDate,
         Channel, Direction, Sentiment, EntryVector, ValuePropositionCategory, FacultySource, CompletedFlag)
       OUTPUT INSERTED.*
       VALUES
        (@OrganizationID, @PrimaryContactID, @EventDate, @OutreachMotionID, @EngagementTypeID,
         @ResponseTimeDays, @FollowUpCadenceDays, @Subject, @Outcome, @Notes, @NextStep, @NextStepDate,
         @Channel, @Direction, @Sentiment, @EntryVector, @ValuePropositionCategory, @FacultySource, @CompletedFlag)`,
      {
        OrganizationID: body.OrganizationID,
        PrimaryContactID: body.PrimaryContactID ?? null,
        EventDate: body.EventDate,
        OutreachMotionID: body.OutreachMotionID ?? null,
        EngagementTypeID: body.EngagementTypeID ?? null,
        ResponseTimeDays: body.ResponseTimeDays ?? null,
        FollowUpCadenceDays: body.FollowUpCadenceDays ?? null,
        Subject: body.Subject ?? null,
        Outcome: body.Outcome ?? null,
        Notes: body.Notes ?? null,
        NextStep: body.NextStep ?? null,
        NextStepDate: body.NextStepDate ?? null,
        Channel: body.Channel ?? null,
        Direction: body.Direction ?? null,
        Sentiment: body.Sentiment ?? null,
        EntryVector: body.EntryVector ?? null,
        ValuePropositionCategory: body.ValuePropositionCategory ?? null,
        FacultySource: body.FacultySource ?? null,
        CompletedFlag: body.CompletedFlag ?? false,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
