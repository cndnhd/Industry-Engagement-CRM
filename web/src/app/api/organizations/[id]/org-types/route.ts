import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT ot.OrgTypeID, ot.OrgTypeName
       FROM dbo.OrganizationOrgTypes oot
       JOIN dbo.OrgTypes ot ON oot.OrgTypeID = ot.OrgTypeID
       WHERE oot.OrganizationID = @id`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const orgTypeIds: number[] = body.orgTypeIds ?? [];

    await query('DELETE FROM dbo.OrganizationOrgTypes WHERE OrganizationID = @id', { id: Number(id) });

    for (const typeId of orgTypeIds) {
      await query(
        'INSERT INTO dbo.OrganizationOrgTypes (OrganizationID, OrgTypeID) VALUES (@orgId, @typeId)',
        { orgId: Number(id), typeId },
      );
    }
    return NextResponse.json({ success: true, count: orgTypeIds.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
