import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT jl.*, js.JourneyStageName, o.OrganizationName
       FROM dbo.JourneyLog jl
       LEFT JOIN dbo.JourneyStages js ON jl.JourneyStageID = js.JourneyStageID
       LEFT JOIN dbo.Organizations o ON jl.OrganizationID = o.OrganizationID
       WHERE jl.JourneyLogID = @id`,
      { id: Number(id) },
    );
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

    if (!body.EventType?.trim()) {
      return NextResponse.json({ error: 'Event Type is required', field: 'EventType' }, { status: 400 });
    }

    const rows = await query(
      `UPDATE dbo.JourneyLog SET
        OrganizationID = @OrganizationID,
        ContactID = @ContactID,
        JourneyStageID = @JourneyStageID,
        LogDate = @LogDate,
        EventType = @EventType,
        Outcome = @Outcome,
        NextStep = @NextStep,
        NextStepDate = @NextStepDate,
        Owner = @Owner,
        Notes = @Notes,
        Summary = @Summary
       OUTPUT INSERTED.*
       WHERE JourneyLogID = @id`,
      {
        id: Number(id),
        OrganizationID: body.OrganizationID,
        ContactID: body.ContactID ?? null,
        JourneyStageID: body.JourneyStageID ?? null,
        LogDate: body.LogDate,
        EventType: body.EventType,
        Outcome: body.Outcome ?? null,
        NextStep: body.NextStep ?? null,
        NextStepDate: body.NextStepDate ?? null,
        Owner: body.Owner ?? null,
        Notes: body.Notes ?? null,
        Summary: body.Summary ?? null,
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
    await query('DELETE FROM dbo.JourneyLog WHERE JourneyLogID = @id', {
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
