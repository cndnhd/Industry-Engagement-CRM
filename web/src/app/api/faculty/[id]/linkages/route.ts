import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT fl.*, o.OrganizationName, ISNULL(lr.LinkageRoleName, N'—') AS LinkageRoleName
       FROM dbo.OrganizationFacultyLinkages fl
       JOIN dbo.Organizations o ON fl.OrganizationID = o.OrganizationID
       LEFT JOIN dbo.LinkageRoles lr ON fl.LinkageRoleID = lr.LinkageRoleID
       WHERE fl.FacultyID = @id`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
