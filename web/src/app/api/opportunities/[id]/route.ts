import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query('SELECT * FROM dbo.Opportunities WHERE OpportunityID = @id', {
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
      `UPDATE dbo.Opportunities SET
        OrganizationID = @OrganizationID,
        OpportunityName = @OpportunityName,
        OpportunityTypeID = @OpportunityTypeID,
        StageID = @StageID,
        StatusID = @StatusID,
        OwnerName = @OwnerName,
        EstimatedValue = @EstimatedValue,
        ProbabilityScore = @ProbabilityScore,
        StrategicImportanceScore = @StrategicImportanceScore,
        OpenedDate = @OpenedDate,
        TargetCloseDate = @TargetCloseDate,
        ClosedDate = @ClosedDate,
        NextStep = @NextStep,
        Notes = @Notes
       OUTPUT INSERTED.*
       WHERE OpportunityID = @id`,
      {
        id: Number(id),
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
    await query('DELETE FROM dbo.Opportunities WHERE OpportunityID = @id', {
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
