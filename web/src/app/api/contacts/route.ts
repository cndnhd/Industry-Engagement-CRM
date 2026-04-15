import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT * FROM dbo.Contacts
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
      `INSERT INTO dbo.Contacts
        (FirstName, LastName, Title, Email, Phone, OrganizationID, FunctionalAreaID,
         InfluenceLevelID, RiskToleranceID, PersonalOrientationID,
         Alumni, ClearanceFamiliarity, IsPrimaryContact, Notes)
       OUTPUT INSERTED.*
       VALUES
        (@FirstName, @LastName, @Title, @Email, @Phone, @OrganizationID, @FunctionalAreaID,
         @InfluenceLevelID, @RiskToleranceID, @PersonalOrientationID,
         @Alumni, @ClearanceFamiliarity, @IsPrimaryContact, @Notes)`,
      {
        FirstName: body.FirstName,
        LastName: body.LastName,
        Title: body.Title ?? null,
        Email: body.Email ?? null,
        Phone: body.Phone ?? null,
        OrganizationID: body.OrganizationID ?? null,
        FunctionalAreaID: body.FunctionalAreaID ?? null,
        InfluenceLevelID: body.InfluenceLevelID ?? null,
        RiskToleranceID: body.RiskToleranceID ?? null,
        PersonalOrientationID: body.PersonalOrientationID ?? null,
        Alumni: body.Alumni ?? null,
        ClearanceFamiliarity: body.ClearanceFamiliarity ?? null,
        IsPrimaryContact: body.IsPrimaryContact ?? null,
        Notes: body.Notes ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
