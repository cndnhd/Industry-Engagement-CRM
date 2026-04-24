import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    const entityType = searchParams.get('entityType'); // C | O | null

    let sql = `
      SELECT ListID, Name, EntityType, FilterJson, VisibleColumnKeysJson, CreatedAt, UpdatedAt
      FROM dbo.UserLists
      WHERE 1=1`;
    const params: Record<string, unknown> = {};
    if (q) {
      sql += ` AND Name LIKE @q`;
      params.q = `%${q}%`;
    }
    if (entityType === 'C' || entityType === 'O') {
      sql += ` AND EntityType = @entityType`;
      params.entityType = entityType;
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
    const entityType = body.EntityType === 'O' ? 'O' : 'C';
    const rows = await query(
      `INSERT INTO dbo.UserLists (Name, EntityType, FilterJson, VisibleColumnKeysJson)
       OUTPUT INSERTED.*
       VALUES (@Name, @EntityType, @FilterJson, @VisibleColumnKeysJson)`,
      {
        Name: body.Name,
        EntityType: entityType,
        FilterJson: body.FilterJson ?? null,
        VisibleColumnKeysJson: body.VisibleColumnKeysJson ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
