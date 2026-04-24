import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; membershipId: string }> }) {
  try {
    const { id, membershipId } = await params;
    const listId = Number(id);
    const mid = Number(membershipId);
    const body = await req.json();
    const cells = body.cells as { columnId: number; completionLevel: number }[] | undefined;
    if (!Array.isArray(cells) || cells.length === 0) {
      return NextResponse.json({ error: 'cells array required' }, { status: 400 });
    }

    const ok = await query<{ n: number }>(
      `SELECT COUNT(*) AS n FROM dbo.UserListMemberships WHERE MembershipID = @mid AND ListID = @listId`,
      { mid, listId },
    );
    if (!ok[0]?.n) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });

    for (const c of cells) {
      const colId = Number(c.columnId);
      const level = Number(c.completionLevel);
      if (!Number.isFinite(colId) || !Number.isFinite(level) || level < 1 || level > 5) {
        return NextResponse.json({ error: 'Invalid cell' }, { status: 400 });
      }
      const colCheck = await query(
        `SELECT 1 AS x FROM dbo.UserListColumns WHERE ColumnID = @colId AND ListID = @listId`,
        { colId, listId },
      );
      if (colCheck.length === 0) {
        return NextResponse.json({ error: `Column ${colId} not in list` }, { status: 400 });
      }

      await query(
        `UPDATE dbo.UserListCellValues SET CompletionLevel = @level, UpdatedAt = SYSUTCDATETIME()
         WHERE MembershipID = @mid AND ColumnID = @colId`,
        { mid, colId, level },
      );
      const check = await query(
        `SELECT 1 AS x FROM dbo.UserListCellValues WHERE MembershipID = @mid AND ColumnID = @colId`,
        { mid, colId },
      );
      if (check.length === 0) {
        await query(
          `INSERT INTO dbo.UserListCellValues (MembershipID, ColumnID, CompletionLevel) VALUES (@mid, @colId, @level)`,
          { mid, colId, level },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
