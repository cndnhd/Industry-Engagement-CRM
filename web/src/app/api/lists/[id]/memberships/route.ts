import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

async function listEntityType(listId: number): Promise<'C' | 'O' | null> {
  const r = await query<{ EntityType: string }>(
    `SELECT EntityType FROM dbo.UserLists WHERE ListID = @listId`,
    { listId },
  );
  if (r.length === 0) return null;
  return r[0].EntityType === 'O' ? 'O' : 'C';
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const listId = Number(id);

    const flat = await query<{
      MembershipID: number;
      ContactID: number | null;
      OrganizationID: number | null;
      ColumnID: number | null;
      CompletionLevel: number | null;
    }>(
      `SELECT m.MembershipID, m.ContactID, m.OrganizationID, v.ColumnID, v.CompletionLevel
       FROM dbo.UserListMemberships m
       LEFT JOIN dbo.UserListCellValues v ON v.MembershipID = m.MembershipID
       WHERE m.ListID = @listId`,
      { listId },
    );

    const byMember = new Map<
      number,
      { membershipId: number; contactId?: number; organizationId?: number; cells: Record<number, number> }
    >();

    for (const row of flat) {
      let m = byMember.get(row.MembershipID);
      if (!m) {
        m = {
          membershipId: row.MembershipID,
          cells: {},
          ...(row.ContactID != null ? { contactId: row.ContactID } : {}),
          ...(row.OrganizationID != null ? { organizationId: row.OrganizationID } : {}),
        };
        byMember.set(row.MembershipID, m);
      }
      if (row.ColumnID != null && row.CompletionLevel != null) {
        m.cells[row.ColumnID] = row.CompletionLevel;
      }
    }

    return NextResponse.json({ memberships: [...byMember.values()] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const listId = Number(id);
    const body = await req.json();
    const et = await listEntityType(listId);
    if (!et) return NextResponse.json({ error: 'List not found' }, { status: 404 });

    if (et === 'C') {
      const cid = Number(body.ContactID);
      if (!Number.isFinite(cid)) {
        return NextResponse.json({ error: 'ContactID required' }, { status: 400 });
      }
      const rows = await query(
        `INSERT INTO dbo.UserListMemberships (ListID, ContactID, OrganizationID)
         OUTPUT INSERTED.*
         VALUES (@listId, @cid, NULL)`,
        { listId, cid },
      );
      return NextResponse.json(rows[0], { status: 201 });
    }

    const oid = Number(body.OrganizationID);
    if (!Number.isFinite(oid)) {
      return NextResponse.json({ error: 'OrganizationID required' }, { status: 400 });
    }
    const rows = await query(
      `INSERT INTO dbo.UserListMemberships (ListID, ContactID, OrganizationID)
       OUTPUT INSERTED.*
       VALUES (@listId, NULL, @oid)`,
      { listId, oid },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('UX_UserListMemberships') || message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Already in list' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
