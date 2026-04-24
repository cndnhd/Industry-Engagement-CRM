import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    let sql = `SELECT RollupID, Name, Description, CreatedAt, UpdatedAt FROM dbo.StrategicRollups WHERE 1=1`;
    const params: Record<string, unknown> = {};
    if (q) {
      sql += ` AND (Name LIKE @q OR Description LIKE @q)`;
      params.q = `%${q}%`;
    }
    sql += ` ORDER BY Name`;
    const rows = await query(sql, Object.keys(params).length ? params : undefined);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = await query(
      `INSERT INTO dbo.StrategicRollups (Name, Description)
       OUTPUT INSERTED.*
       VALUES (@Name, @Description)`,
      {
        Name: body.Name,
        Description: body.Description ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
