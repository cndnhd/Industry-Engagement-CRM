import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT a.GovernmentAlignmentTypeID AS id, g.AlignmentName AS name, a.Notes
       FROM dbo.OrganizationGovernmentAlignments a
       JOIN dbo.GovernmentAlignmentTypes g ON a.GovernmentAlignmentTypeID = g.GovernmentAlignmentTypeID
       WHERE a.OrganizationID = @id`,
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
    if (!body.alignmentTypeId) return NextResponse.json({ error: 'alignmentTypeId is required' }, { status: 400 });
    const rows = await query(
      `INSERT INTO dbo.OrganizationGovernmentAlignments (OrganizationID, GovernmentAlignmentTypeID, Notes)
       OUTPUT INSERTED.OrganizationGovernmentAlignmentID AS id
       VALUES (@orgId, @typeId, @notes)`,
      { orgId: Number(id), typeId: Number(body.alignmentTypeId), notes: body.Notes ?? null },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('UNIQUE') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'Alignment already assigned' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.alignmentTypeId) return NextResponse.json({ error: 'alignmentTypeId is required' }, { status: 400 });
    await query(
      `DELETE FROM dbo.OrganizationGovernmentAlignments WHERE OrganizationID = @orgId AND GovernmentAlignmentTypeID = @typeId`,
      { orgId: Number(id), typeId: Number(body.alignmentTypeId) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
