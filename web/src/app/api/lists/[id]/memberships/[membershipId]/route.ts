import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; membershipId: string }> }) {
  try {
    const { id, membershipId } = await params;
    await query(
      `DELETE FROM dbo.UserListMemberships WHERE MembershipID = @mid AND ListID = @listId`,
      { listId: Number(id), mid: Number(membershipId) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
