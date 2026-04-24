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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.FacultyID) return NextResponse.json({ error: 'FacultyID is required' }, { status: 400 });
    const rows = await query(
      `INSERT INTO dbo.OrganizationFacultyLinkages (OrganizationID, FacultyID, LinkageRoleID, ActiveFlag, Notes)
       OUTPUT INSERTED.OrganizationFacultyLinkageID AS id
       VALUES (@orgId, @facultyId, @roleId, @active, @notes)`,
      {
        orgId: Number(id),
        facultyId: Number(body.FacultyID),
        roleId: body.LinkageRoleID ? Number(body.LinkageRoleID) : null,
        active: body.ActiveFlag ?? true,
        notes: body.Notes ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('UNIQUE') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'This faculty linkage already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const linkageId = body.linkageId;
    if (!linkageId) return NextResponse.json({ error: 'linkageId is required' }, { status: 400 });
    await query(
      `DELETE FROM dbo.OrganizationFacultyLinkages WHERE OrganizationFacultyLinkageID = @linkageId AND OrganizationID = @orgId`,
      { linkageId: Number(linkageId), orgId: Number(id) },
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
