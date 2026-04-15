import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query('SELECT * FROM dbo.Organizations WHERE OrganizationID = @id', {
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
      `UPDATE dbo.Organizations SET
        OrganizationName = @OrganizationName,
        City = @City, State = @State,
        HeadquartersLocation = @HeadquartersLocation, RegionalFootprint = @RegionalFootprint,
        OrgTypeID = @OrgTypeID, OwnershipTypeID = @OwnershipTypeID,
        GrowthStageID = @GrowthStageID, PriorityLevelID = @PriorityLevelID,
        FederalContractor = @FederalContractor, ContractorRoleID = @ContractorRoleID,
        RDIntensityPct = @RDIntensityPct, EmailPattern = @EmailPattern, Notes = @Notes,
        RelationshipLevelID = @RelationshipLevelID,
        ChampionIdentified = @ChampionIdentified, ExecutiveSponsor = @ExecutiveSponsor,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE OrganizationID = @id`,
      { id: Number(id), ...body },
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
    await query('DELETE FROM dbo.Organizations WHERE OrganizationID = @id', {
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
