import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT h.*, ps1.StageName AS OldStageName, ps2.StageName AS NewStageName
       FROM dbo.PartnershipStageHistory h
       LEFT JOIN dbo.PartnershipStages ps1 ON h.OldStageID = ps1.PartnershipStageID
       JOIN dbo.PartnershipStages ps2 ON h.NewStageID = ps2.PartnershipStageID
       WHERE h.OrganizationID = @id
       ORDER BY h.TransitionDate DESC`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rows = await query(
      `INSERT INTO dbo.PartnershipStageHistory
        (OrganizationID, OldStageID, NewStageID, TransitionDate, Notes, ChangedBy)
       OUTPUT INSERTED.*
       VALUES
        (@OrganizationID, @OldStageID, @NewStageID, @TransitionDate, @Notes, @ChangedBy)`,
      {
        OrganizationID: Number(id),
        OldStageID: body.OldStageID ?? null,
        NewStageID: body.NewStageID,
        TransitionDate: body.TransitionDate,
        Notes: body.Notes ?? null,
        ChangedBy: body.ChangedBy ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
