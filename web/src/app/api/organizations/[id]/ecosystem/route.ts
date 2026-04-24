import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT e.*, et.TypeName
       FROM dbo.OrganizationEcosystem e
       JOIN dbo.EcosystemEntityTypes et ON e.EntityTypeID = et.EntityTypeID
       WHERE e.OrganizationID = @id
       ORDER BY et.TypeName`,
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
      `INSERT INTO dbo.OrganizationEcosystem
        (OrganizationID, EntityTypeID, EntityName, RelationshipDescription)
       OUTPUT INSERTED.*
       VALUES
        (@OrganizationID, @EntityTypeID, @EntityName, @RelationshipDescription)`,
      {
        OrganizationID: Number(id),
        EntityTypeID: body.EntityTypeID,
        EntityName: body.EntityName,
        RelationshipDescription: body.RelationshipDescription ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const linkId = body.EcosystemLinkID;
    if (linkId == null) return NextResponse.json({ error: 'EcosystemLinkID is required' }, { status: 400 });

    await query(
      'DELETE FROM dbo.OrganizationEcosystem WHERE EcosystemLinkID = @linkId AND OrganizationID = @id',
      { linkId: Number(linkId), id: Number(id) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
