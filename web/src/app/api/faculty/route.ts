import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT * FROM dbo.Faculty
      ORDER BY LastName, FirstName
    `);
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
      `INSERT INTO dbo.Faculty
        (FirstName, LastName, Title, Email, Notes, DepartmentID, FacultyTitleID)
       OUTPUT INSERTED.*
       VALUES
        (@FirstName, @LastName, @Title, @Email, @Notes, @DepartmentID, @FacultyTitleID)`,
      {
        FirstName: body.FirstName,
        LastName: body.LastName,
        Title: body.Title ?? null,
        Email: body.Email ?? null,
        Notes: body.Notes ?? null,
        DepartmentID: body.DepartmentID ?? null,
        FacultyTitleID: body.FacultyTitleID ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
