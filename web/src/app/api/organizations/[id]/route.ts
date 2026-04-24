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
        ParentOrganizationID = @ParentOrganizationID,
        BusinessModelType = @BusinessModelType, HQCountry = @HQCountry,
        MissouriPresenceFlag = @MissouriPresenceFlag, MissouriCities = @MissouriCities,
        PrimaryRegion = @PrimaryRegion,
        LinkedInURL = @LinkedInURL, GeneralEmail = @GeneralEmail, MainPhone = @MainPhone,
        AnnualRevenueRange = @AnnualRevenueRange, EmployeeCountRange = @EmployeeCountRange,
        NAICSCode = @NAICSCode, PublicPrivateStatus = @PublicPrivateStatus,
        PartnershipStageID = @PartnershipStageID, EngagementStatus = @EngagementStatus,
        StrategicFitScore = @StrategicFitScore,
        WorkforceAlignmentScore = @WorkforceAlignmentScore,
        ResearchAlignmentScore = @ResearchAlignmentScore,
        PhilanthropyPotentialScore = @PhilanthropyPotentialScore,
        GovernmentRelationsRelevance = @GovernmentRelationsRelevance,
        InternshipPotentialFlag = @InternshipPotentialFlag,
        HiringPotentialFlag = @HiringPotentialFlag,
        SponsorshipPotentialFlag = @SponsorshipPotentialFlag,
        AdvisoryBoardPotentialFlag = @AdvisoryBoardPotentialFlag,
        ResearchCollaborationPotentialFlag = @ResearchCollaborationPotentialFlag,
        ExecutiveEngagementLevel = @ExecutiveEngagementLevel,
        AssignedOwner = @AssignedOwner, AssignedTeam = @AssignedTeam,
        NextActionDate = @NextActionDate, ArchivedFlag = @ArchivedFlag,
        StrategicPriorityLevel = @StrategicPriorityLevel, Projects = @Projects,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE OrganizationID = @id`,
      {
        id: Number(id),
        OrganizationName: body.OrganizationName ?? null,
        City: body.City ?? null,
        State: body.State ?? null,
        HeadquartersLocation: body.HeadquartersLocation ?? null,
        RegionalFootprint: body.RegionalFootprint ?? null,
        OrgTypeID: body.OrgTypeID ?? null,
        OwnershipTypeID: body.OwnershipTypeID ?? null,
        GrowthStageID: body.GrowthStageID ?? null,
        PriorityLevelID: body.PriorityLevelID ?? null,
        FederalContractor: body.FederalContractor ?? false,
        ContractorRoleID: body.ContractorRoleID ?? null,
        RDIntensityPct: body.RDIntensityPct ?? null,
        EmailPattern: body.EmailPattern ?? null,
        Notes: body.Notes ?? null,
        RelationshipLevelID: body.RelationshipLevelID ?? null,
        ChampionIdentified: body.ChampionIdentified ?? false,
        ExecutiveSponsor: body.ExecutiveSponsor ?? false,
        ParentOrganizationID: body.ParentOrganizationID ?? null,
        BusinessModelType: body.BusinessModelType ?? null,
        HQCountry: body.HQCountry ?? null,
        MissouriPresenceFlag: body.MissouriPresenceFlag ?? false,
        MissouriCities: body.MissouriCities ?? null,
        PrimaryRegion: body.PrimaryRegion ?? null,
        LinkedInURL: body.LinkedInURL ?? null,
        GeneralEmail: body.GeneralEmail ?? null,
        MainPhone: body.MainPhone ?? null,
        AnnualRevenueRange: body.AnnualRevenueRange ?? null,
        EmployeeCountRange: body.EmployeeCountRange ?? null,
        NAICSCode: body.NAICSCode ?? null,
        PublicPrivateStatus: body.PublicPrivateStatus ?? null,
        PartnershipStageID: body.PartnershipStageID ?? null,
        EngagementStatus: body.EngagementStatus ?? null,
        StrategicFitScore: body.StrategicFitScore ?? null,
        WorkforceAlignmentScore: body.WorkforceAlignmentScore ?? null,
        ResearchAlignmentScore: body.ResearchAlignmentScore ?? null,
        PhilanthropyPotentialScore: body.PhilanthropyPotentialScore ?? null,
        GovernmentRelationsRelevance: body.GovernmentRelationsRelevance ?? null,
        InternshipPotentialFlag: body.InternshipPotentialFlag ?? false,
        HiringPotentialFlag: body.HiringPotentialFlag ?? false,
        SponsorshipPotentialFlag: body.SponsorshipPotentialFlag ?? false,
        AdvisoryBoardPotentialFlag: body.AdvisoryBoardPotentialFlag ?? false,
        ResearchCollaborationPotentialFlag: body.ResearchCollaborationPotentialFlag ?? false,
        ExecutiveEngagementLevel: body.ExecutiveEngagementLevel ?? null,
        AssignedOwner: body.AssignedOwner ?? null,
        AssignedTeam: body.AssignedTeam ?? null,
        NextActionDate: body.NextActionDate ?? null,
        ArchivedFlag: body.ArchivedFlag ?? false,
        StrategicPriorityLevel: body.StrategicPriorityLevel ?? null,
        Projects: body.Projects ?? null,
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
