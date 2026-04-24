import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  try {
    const { id, contactId } = await params;
    const rid = Number(id);
    const cid = Number(contactId);
    const body = await req.json();
    const rows = await query(
      `UPDATE dbo.RollupContacts SET
        ComponentID = CASE WHEN @CompSet = 1 THEN @ComponentID ELSE ComponentID END,
        Notes = CASE WHEN @NotesSet = 1 THEN @Notes ELSE Notes END,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE RollupID = @rid AND ContactID = @cid`,
      {
        rid,
        cid,
        CompSet: body.ComponentID !== undefined ? 1 : 0,
        ComponentID: body.ComponentID != null ? Number(body.ComponentID) : null,
        NotesSet: body.Notes !== undefined ? 1 : 0,
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  try {
    const { id, contactId } = await params;
    await query(
      `DELETE FROM dbo.RollupContacts WHERE RollupID = @rid AND ContactID = @cid`,
      { rid: Number(id), cid: Number(contactId) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
