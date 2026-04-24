import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; columnId: string }> }) {
  try {
    const { id, columnId } = await params;
    const listId = Number(id);
    const colId = Number(columnId);
    const body = await req.json();
    let processTier = body.ProcessTier;
    if (processTier !== undefined) {
      processTier = Number(processTier);
      if (!Number.isFinite(processTier) || processTier < 1 || processTier > 5) {
        return NextResponse.json({ error: 'ProcessTier must be 1–5' }, { status: 400 });
      }
    }
    const rows = await query(
      `UPDATE dbo.UserListColumns SET
        Label = COALESCE(@Label, Label),
        SortOrder = COALESCE(@SortOrder, SortOrder),
        ProcessTier = COALESCE(@ProcessTier, ProcessTier),
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE ColumnID = @colId AND ListID = @listId`,
      {
        listId,
        colId,
        Label: body.Label ?? null,
        SortOrder: body.SortOrder ?? null,
        ProcessTier: processTier ?? null,
      },
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; columnId: string }> }) {
  try {
    const { id, columnId } = await params;
    await query(
      `DELETE FROM dbo.UserListColumns WHERE ColumnID = @colId AND ListID = @listId`,
      { listId: Number(id), colId: Number(columnId) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
