import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT fl.OrganizationFacultyLinkageID, fl.OrganizationID, fl.FacultyID,
              fl.LinkageRoleID, fl.ActiveFlag, fl.Notes,
              f.FirstName, f.LastName, f.Email,
              d.DepartmentName, ft.FacultyTitleName,
              ISNULL(lr.LinkageRoleName, N'—') AS LinkageRoleName
       FROM dbo.OrganizationFacultyLinkages fl
       JOIN dbo.Faculty f ON fl.FacultyID = f.FacultyID
       LEFT JOIN dbo.Departments d ON f.DepartmentID = d.DepartmentID
       LEFT JOIN dbo.FacultyTitles ft ON f.FacultyTitleID = ft.FacultyTitleID
       LEFT JOIN dbo.LinkageRoles lr ON fl.LinkageRoleID = lr.LinkageRoleID
       WHERE fl.OrganizationID = @id`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
