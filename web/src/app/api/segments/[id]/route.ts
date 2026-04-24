import { query } from '@/lib/db';
import { validateRules } from '@/lib/segmentation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rows = await query(
      'SELECT * FROM dbo.SegmentDefinitions WHERE SegmentID = @id',
      { id: Number(id) },
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.RulesJson != null) {
      let parsed: unknown;
      try {
        parsed =
          typeof body.RulesJson === 'string'
            ? JSON.parse(body.RulesJson)
            : body.RulesJson;
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
    }

    const rulesStr =
      body.RulesJson != null
        ? typeof body.RulesJson === 'string'
          ? body.RulesJson
          : JSON.stringify(body.RulesJson)
        : null;

    const rows = await query(
      `UPDATE dbo.SegmentDefinitions SET
        Name = COALESCE(@Name, Name),
        RulesJson = COALESCE(@RulesJson, RulesJson),
        Description = COALESCE(@Description, Description),
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE SegmentID = @id`,
      {
        id: Number(id),
        Name: body.Name ?? null,
        RulesJson: rulesStr,
        Description: body.Description ?? null,
      },
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await query(
      'DELETE FROM dbo.SegmentDefinitions WHERE SegmentID = @id',
      { id: Number(id) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
