import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT RollupID, Name, Description, CreatedAt, UpdatedAt FROM dbo.StrategicRollups WHERE RollupID = @id`,
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
      `UPDATE dbo.StrategicRollups SET
        Name = COALESCE(@Name, Name),
        Description = CASE WHEN @DescSet = 1 THEN @Description ELSE Description END,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE RollupID = @rid`,
      {
        rid: Number(id),
        Name: body.Name ?? null,
        DescSet: body.Description !== undefined ? 1 : 0,
        Description: body.Description ?? null,
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
    await query('DELETE FROM dbo.StrategicRollups WHERE RollupID = @id', { id: Number(id) });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
