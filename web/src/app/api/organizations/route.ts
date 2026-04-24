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
         RelationshipLevelID, ChampionIdentified, ExecutiveSponsor,
         ParentOrganizationID, BusinessModelType, HQCountry,
         MissouriPresenceFlag, MissouriCities, PrimaryRegion,
         LinkedInURL, GeneralEmail, MainPhone,
         AnnualRevenueRange, EmployeeCountRange, NAICSCode, PublicPrivateStatus,
         PartnershipStageID, EngagementStatus,
         StrategicFitScore, WorkforceAlignmentScore, ResearchAlignmentScore,
         PhilanthropyPotentialScore, GovernmentRelationsRelevance,
         InternshipPotentialFlag, HiringPotentialFlag, SponsorshipPotentialFlag,
         AdvisoryBoardPotentialFlag, ResearchCollaborationPotentialFlag,
         ExecutiveEngagementLevel, AssignedOwner, AssignedTeam,
         NextActionDate, ArchivedFlag, StrategicPriorityLevel, Projects)
       OUTPUT INSERTED.*
       VALUES
        (@OrganizationName, @City, @State, @HeadquartersLocation, @RegionalFootprint,
         @OrgTypeID, @OwnershipTypeID, @GrowthStageID, @PriorityLevelID,
         @FederalContractor, @ContractorRoleID, @RDIntensityPct, @EmailPattern, @Notes,
         @RelationshipLevelID, @ChampionIdentified, @ExecutiveSponsor,
         @ParentOrganizationID, @BusinessModelType, @HQCountry,
         @MissouriPresenceFlag, @MissouriCities, @PrimaryRegion,
         @LinkedInURL, @GeneralEmail, @MainPhone,
         @AnnualRevenueRange, @EmployeeCountRange, @NAICSCode, @PublicPrivateStatus,
         @PartnershipStageID, @EngagementStatus,
         @StrategicFitScore, @WorkforceAlignmentScore, @ResearchAlignmentScore,
         @PhilanthropyPotentialScore, @GovernmentRelationsRelevance,
         @InternshipPotentialFlag, @HiringPotentialFlag, @SponsorshipPotentialFlag,
         @AdvisoryBoardPotentialFlag, @ResearchCollaborationPotentialFlag,
         @ExecutiveEngagementLevel, @AssignedOwner, @AssignedTeam,
         @NextActionDate, @ArchivedFlag, @StrategicPriorityLevel, @Projects)`,
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
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
