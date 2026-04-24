import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT ListID, Name, EntityType, FilterJson, VisibleColumnKeysJson, CreatedAt, UpdatedAt
       FROM dbo.UserLists WHERE ListID = @id`,
      { id: Number(id) },
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rows = await query(
      `UPDATE dbo.UserLists SET
        Name = COALESCE(@Name, Name),
        FilterJson = CASE WHEN @FilterJsonSet = 1 THEN @FilterJson ELSE FilterJson END,
        VisibleColumnKeysJson = CASE WHEN @VisibleSet = 1 THEN @VisibleColumnKeysJson ELSE VisibleColumnKeysJson END,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE ListID = @id`,
      {
        id: Number(id),
        Name: body.Name ?? null,
        FilterJsonSet: body.FilterJson !== undefined ? 1 : 0,
        FilterJson: body.FilterJson ?? null,
        VisibleSet: body.VisibleColumnKeysJson !== undefined ? 1 : 0,
        VisibleColumnKeysJson: body.VisibleColumnKeysJson ?? null,
      },
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM dbo.UserLists WHERE ListID = @id', { id: Number(id) });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
