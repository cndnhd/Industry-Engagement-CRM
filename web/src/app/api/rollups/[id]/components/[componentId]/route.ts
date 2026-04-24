import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; componentId: string }> }) {
  try {
    const { id, componentId } = await params;
    const rid = Number(id);
    const cid = Number(componentId);
    const body = await req.json();
    const rows = await query(
      `UPDATE dbo.RollupComponents SET
        Label = COALESCE(@Label, Label),
        SortOrder = COALESCE(@SortOrder, SortOrder),
        Notes = CASE WHEN @NotesSet = 1 THEN @Notes ELSE Notes END,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE ComponentID = @cid AND RollupID = @rid`,
      {
        rid,
        cid,
        Label: body.Label ?? null,
        SortOrder: body.SortOrder ?? null,
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; componentId: string }> }) {
  try {
    const { id, componentId } = await params;
    await query(
      `DELETE FROM dbo.RollupComponents WHERE ComponentID = @cid AND RollupID = @rid`,
      { rid: Number(id), cid: Number(componentId) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
