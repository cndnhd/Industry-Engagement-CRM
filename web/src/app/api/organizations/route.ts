import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await query(`
      SELECT * FROM dbo.Organizations
      ORDER BY OrganizationName
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
      `INSERT INTO dbo.Organizations
        (OrganizationName, City, State, HeadquartersLocation, RegionalFootprint,
         OrgTypeID, OwnershipTypeID, GrowthStageID, PriorityLevelID,
         FederalContractor, ContractorRoleID, RDIntensityPct, EmailPattern, Notes,
         RelationshipLevelID, ChampionIdentified, ExecutiveSponsor)
       OUTPUT INSERTED.*
       VALUES
        (@OrganizationName, @City, @State, @HeadquartersLocation, @RegionalFootprint,
         @OrgTypeID, @OwnershipTypeID, @GrowthStageID, @PriorityLevelID,
         @FederalContractor, @ContractorRoleID, @RDIntensityPct, @EmailPattern, @Notes,
         @RelationshipLevelID, @ChampionIdentified, @ExecutiveSponsor)`,
      {
        OrganizationName: body.OrganizationName,
        City: body.City ?? null,
        State: body.State ?? null,
        HeadquartersLocation: body.HeadquartersLocation ?? null,
        RegionalFootprint: body.RegionalFootprint ?? null,
        OrgTypeID: body.OrgTypeID ?? null,
        OwnershipTypeID: body.OwnershipTypeID ?? null,
        GrowthStageID: body.GrowthStageID ?? null,
        PriorityLevelID: body.PriorityLevelID ?? null,
        FederalContractor: body.FederalContractor ?? null,
        ContractorRoleID: body.ContractorRoleID ?? null,
        RDIntensityPct: body.RDIntensityPct ?? null,
        EmailPattern: body.EmailPattern ?? null,
        Notes: body.Notes ?? null,
        RelationshipLevelID: body.RelationshipLevelID ?? null,
        ChampionIdentified: body.ChampionIdentified ?? null,
        ExecutiveSponsor: body.ExecutiveSponsor ?? null,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
