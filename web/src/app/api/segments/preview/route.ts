import { query } from '@/lib/db';
import {
  compileSegment,
  validateRules,
  type SegmentRules,
} from '@/lib/segmentation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let rules: SegmentRules;

    if (body.segmentId) {
      const segs = await query<{ RulesJson: string }>(
        'SELECT RulesJson FROM dbo.SegmentDefinitions WHERE SegmentID = @id',
        { id: Number(body.segmentId) },
      );
      if (segs.length === 0) {
        return NextResponse.json(
          { error: 'Segment not found' },
          { status: 404 },
        );
      }
      rules = JSON.parse(segs[0].RulesJson);
    } else if (body.rules) {
      rules = body.rules;
    } else {
      return NextResponse.json(
        { error: 'Provide rules or segmentId' },
        { status: 400 },
      );
    }

    const v = validateRules(rules);
    if (!v.valid) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const compiled = compileSegment(rules);
    const result = await query<{ cnt: number }>(
      compiled.countSql,
      compiled.params,
    );
    return NextResponse.json({ count: result[0].cnt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
