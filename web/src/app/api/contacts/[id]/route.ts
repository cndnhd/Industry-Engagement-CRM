import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query('SELECT * FROM dbo.Contacts WHERE ContactID = @id', {
      id: Number(id),
    });
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rows = await query(
      `UPDATE dbo.Contacts SET
        FirstName = @FirstName,
        LastName = @LastName,
        Title = @Title,
        Email = @Email,
        Phone = @Phone,
        OrganizationID = @OrganizationID,
        FunctionalAreaID = @FunctionalAreaID,
        InfluenceLevelID = @InfluenceLevelID,
        RiskToleranceID = @RiskToleranceID,
        PersonalOrientationID = @PersonalOrientationID,
        Alumni = @Alumni,
        ClearanceFamiliarity = @ClearanceFamiliarity,
        IsPrimaryContact = @IsPrimaryContact,
        Notes = @Notes,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE ContactID = @id`,
      {
        id: Number(id),
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
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM dbo.Contacts WHERE ContactID = @id', {
      id: Number(id),
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('REFERENCE') || message.includes('FOREIGN KEY')) {
      return NextResponse.json(
        { error: 'Cannot delete — this record is referenced by other data. Remove related records first.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
