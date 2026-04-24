import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT o.OrganizationID, o.OrganizationName, o.City, o.State, o.EngagementStatus, o.AssignedOwner
       FROM dbo.OrganizationGovernmentAlignments oga
       JOIN dbo.Organizations o ON oga.OrganizationID = o.OrganizationID
       WHERE oga.GovernmentAlignmentTypeID = @typeId
       ORDER BY o.OrganizationName`,
      { typeId: Number(id) },
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
    if (!body.organizationId) return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    const rows = await query(
      `INSERT INTO dbo.OrganizationGovernmentAlignments (OrganizationID, GovernmentAlignmentTypeID)
       OUTPUT INSERTED.OrganizationGovernmentAlignmentID AS id
       VALUES (@orgId, @typeId)`,
      { orgId: Number(body.organizationId), typeId: Number(id) },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('UNIQUE') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'Organization already has this alignment' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.organizationId) return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    await query(
      `DELETE FROM dbo.OrganizationGovernmentAlignments WHERE OrganizationID = @orgId AND GovernmentAlignmentTypeID = @typeId`,
      { orgId: Number(body.organizationId), typeId: Number(id) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
