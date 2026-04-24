import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const listId = Number(id);
    const rows = await query(
      `SELECT ColumnID, ListID, Label, SortOrder, ProcessTier, CreatedAt, UpdatedAt
       FROM dbo.UserListColumns WHERE ListID = @listId ORDER BY SortOrder, ColumnID`,
      { listId },
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
    const listId = Number(id);
    const body = await req.json();
    const tier = Number(body.ProcessTier);
    if (!Number.isFinite(tier) || tier < 1 || tier > 5) {
      return NextResponse.json({ error: 'ProcessTier must be 1–5' }, { status: 400 });
    }
    const rows = await query(
      `INSERT INTO dbo.UserListColumns (ListID, Label, SortOrder, ProcessTier)
       OUTPUT INSERTED.*
       VALUES (@listId, @Label, @SortOrder, @ProcessTier)`,
      {
        listId,
        Label: body.Label,
        SortOrder: body.SortOrder ?? 0,
        ProcessTier: tier,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
