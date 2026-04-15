import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query('SELECT * FROM dbo.EngagementEvents WHERE EngagementEventID = @id', {
      id: Number(id),
    });
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rows = await query(
      `UPDATE dbo.EngagementEvents SET
        OrganizationID = @OrganizationID,
        PrimaryContactID = @PrimaryContactID,
        EventDate = @EventDate,
        OutreachMotionID = @OutreachMotionID,
        EngagementTypeID = @EngagementTypeID,
        ResponseTimeDays = @ResponseTimeDays,
        FollowUpCadenceDays = @FollowUpCadenceDays,
        Subject = @Subject,
        Outcome = @Outcome,
        Notes = @Notes,
        NextStep = @NextStep,
        NextStepDate = @NextStepDate
       OUTPUT INSERTED.*
       WHERE EngagementEventID = @id`,
      {
        id: Number(id),
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
      },
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM dbo.EngagementEvents WHERE EngagementEventID = @id', {
      id: Number(id),
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('REFERENCE') || message.includes('FOREIGN KEY')) {
      return NextResponse.json(
        { error: 'Cannot delete — this record is referenced by other data. Remove related records first.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
