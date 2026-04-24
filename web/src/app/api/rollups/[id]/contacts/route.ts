import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rid = Number(id);
    const rows = await query(
      `SELECT rc.RollupID, rc.ContactID, rc.ComponentID, rc.Notes, rc.CreatedAt, rc.UpdatedAt,
              c.FirstName, c.LastName, c.Email, c.JobTitle AS Title, c.OrganizationID
       FROM dbo.RollupContacts rc
       INNER JOIN dbo.Contacts c ON c.ContactID = rc.ContactID
       WHERE rc.RollupID = @rid
       ORDER BY c.LastName, c.FirstName`,
      { rid },
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
    const rid = Number(id);
    const body = await req.json();
    const contactId = Number(body.ContactID);
    if (!Number.isFinite(contactId)) {
      return NextResponse.json({ error: 'ContactID required' }, { status: 400 });
    }
    const componentId = body.ComponentID != null ? Number(body.ComponentID) : null;
    const rows = await query(
      `INSERT INTO dbo.RollupContacts (RollupID, ContactID, ComponentID, Notes)
       OUTPUT INSERTED.*
       VALUES (@rid, @contactId, @componentId, @Notes)`,
      {
        rid,
        contactId,
        componentId,
        Notes: body.Notes ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('PK_RollupContacts') || message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Contact already linked' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
