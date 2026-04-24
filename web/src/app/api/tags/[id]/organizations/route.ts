import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT o.OrganizationID, o.OrganizationName, o.City, o.State, o.EngagementStatus, o.AssignedOwner
       FROM dbo.OrganizationStrategicTags ost
       JOIN dbo.Organizations o ON ost.OrganizationID = o.OrganizationID
       WHERE ost.StrategicTagID = @tagId
       ORDER BY o.OrganizationName`,
      { tagId: Number(id) },
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
    const organizationId = body.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    const rows = await query(
      `INSERT INTO dbo.OrganizationStrategicTags (OrganizationID, StrategicTagID)
       OUTPUT INSERTED.OrganizationStrategicTagID AS id
       VALUES (@orgId, @tagId)`,
      { orgId: Number(organizationId), tagId: Number(id) },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('UNIQUE') || message.includes('duplicate') || message.includes('Violation of UNIQUE KEY')) {
      return NextResponse.json({ error: 'Organization already tagged' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const organizationId = body.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    await query(
      `DELETE FROM dbo.OrganizationStrategicTags WHERE OrganizationID = @orgId AND StrategicTagID = @tagId`,
      { orgId: Number(organizationId), tagId: Number(id) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
