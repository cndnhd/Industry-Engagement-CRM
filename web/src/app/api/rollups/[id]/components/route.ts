import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT ComponentID, RollupID, Label, SortOrder, Notes, CreatedAt, UpdatedAt
       FROM dbo.RollupComponents WHERE RollupID = @rid ORDER BY SortOrder, ComponentID`,
      { rid: Number(id) },
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
    const rows = await query(
      `INSERT INTO dbo.RollupComponents (RollupID, Label, SortOrder, Notes)
       OUTPUT INSERTED.*
       VALUES (@rid, @Label, @SortOrder, @Notes)`,
      {
        rid,
        Label: body.Label,
        SortOrder: body.SortOrder ?? 0,
        Notes: body.Notes ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
