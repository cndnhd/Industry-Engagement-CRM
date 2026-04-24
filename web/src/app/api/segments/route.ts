import { query } from '@/lib/db';
import { validateRules } from '@/lib/segmentation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entityType = req.nextUrl.searchParams.get('entityType');
    let sql = 'SELECT * FROM dbo.SegmentDefinitions';
    const params: Record<string, unknown> = {};
    if (entityType === 'O' || entityType === 'C') {
      sql += ' WHERE EntityType = @entityType';
      params.entityType = entityType;
    }
    sql += ' ORDER BY UpdatedAt DESC';
    const rows = await query(sql, params);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { Name, EntityType, RulesJson, Description } = body;

    if (!Name || !EntityType || RulesJson == null) {
      return NextResponse.json(
        { error: 'Name, EntityType, and RulesJson are required' },
        { status: 400 },
      );
    }

    let parsed: unknown;
    try {
      parsed =
        typeof RulesJson === 'string' ? JSON.parse(RulesJson) : RulesJson;
    } catch {
      return NextResponse.json(
        { error: 'RulesJson is not valid JSON' },
        { status: 400 },
      );
    }

    const v = validateRules(parsed);
    if (!v.valid) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const rulesStr =
      typeof RulesJson === 'string' ? RulesJson : JSON.stringify(RulesJson);

    const rows = await query(
      `INSERT INTO dbo.SegmentDefinitions (Name, EntityType, RulesJson, Description)
       OUTPUT INSERTED.*
       VALUES (@Name, @EntityType, @RulesJson, @Description)`,
      {
        Name,
        EntityType,
        RulesJson: rulesStr,
        Description: Description ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
