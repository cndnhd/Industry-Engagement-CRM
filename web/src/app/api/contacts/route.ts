import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function parseSqlNullError(message: string): string | null {
  const m = message.match(/Cannot insert the value NULL into column '(\w+)'/);
  return m ? m[1] : null;
}

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('organizationId');
    const rows = orgId
      ? await query(
          `SELECT * FROM dbo.Contacts WHERE OrganizationID = @orgId ORDER BY LastName, FirstName`,
          { orgId: Number(orgId) },
        )
      : await query(`SELECT * FROM dbo.Contacts ORDER BY LastName, FirstName`);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.FirstName?.trim()) {
      return NextResponse.json({ error: 'First Name is required', field: 'FirstName' }, { status: 400 });
    }
    if (!body.LastName?.trim()) {
      return NextResponse.json({ error: 'Last Name is required', field: 'LastName' }, { status: 400 });
    }

    const rows = await query(
      `INSERT INTO dbo.Contacts
        (FirstName, LastName, Title, Email, Phone, WorkPhone, CellPhone,
         OrganizationID, FunctionalAreaID,
         InfluenceLevelID, RiskToleranceID, PersonalOrientationID,
         Alumni, ClearanceFamiliarity, IsPrimaryContact, Notes, LinkedInURL,
         Prefix, MiddleName, Suffix, PreferredName, Department, SeniorityLevelID,
         SecondaryEmail, OfficePhone, AssistantName, AssistantEmail,
         City, State, Country, RelationshipOwner,
         ContactTypeID, PersonaTypeID,
         DecisionMakerFlag, ChampionFlag, DonorFlag, SpeakerFlag,
         AdvisoryBoardFlag, HiringContactFlag, InternshipContactFlag,
         ResearchContactFlag, LegislativeContactFlag,
         CommunicationPreference, EngagementScore, RelationshipStrength, WarmthStatus,
         LastContactDate, NextFollowUpDate, ArchivedFlag)
       OUTPUT INSERTED.*
       VALUES
        (@FirstName, @LastName, @Title, @Email, @Phone, @WorkPhone, @CellPhone,
         @OrganizationID, @FunctionalAreaID,
         @InfluenceLevelID, @RiskToleranceID, @PersonalOrientationID,
         @Alumni, @ClearanceFamiliarity, @IsPrimaryContact, @Notes, @LinkedInURL,
         @Prefix, @MiddleName, @Suffix, @PreferredName, @Department, @SeniorityLevelID,
         @SecondaryEmail, @OfficePhone, @AssistantName, @AssistantEmail,
         @City, @State, @Country, @RelationshipOwner,
         @ContactTypeID, @PersonaTypeID,
         @DecisionMakerFlag, @ChampionFlag, @DonorFlag, @SpeakerFlag,
         @AdvisoryBoardFlag, @HiringContactFlag, @InternshipContactFlag,
         @ResearchContactFlag, @LegislativeContactFlag,
         @CommunicationPreference, @EngagementScore, @RelationshipStrength, @WarmthStatus,
         @LastContactDate, @NextFollowUpDate, @ArchivedFlag)`,
      {
        FirstName: body.FirstName,
        LastName: body.LastName,
        Title: body.Title ?? body.JobTitle ?? null,
        Email: body.Email ?? null,
        Phone: body.Phone ?? null,
        WorkPhone: body.WorkPhone ?? null,
        CellPhone: body.CellPhone ?? null,
        OrganizationID: body.OrganizationID ?? null,
        FunctionalAreaID: body.FunctionalAreaID ?? null,
        InfluenceLevelID: body.InfluenceLevelID ?? null,
        RiskToleranceID: body.RiskToleranceID ?? null,
        PersonalOrientationID: body.PersonalOrientationID ?? null,
        Alumni: body.Alumni ?? false,
        ClearanceFamiliarity: body.ClearanceFamiliarity ?? false,
        IsPrimaryContact: body.IsPrimaryContact ?? false,
        Notes: body.Notes ?? null,
        LinkedInURL: body.LinkedInURL ?? null,
        Prefix: body.Prefix ?? null,
        MiddleName: body.MiddleName ?? null,
        Suffix: body.Suffix ?? null,
        PreferredName: body.PreferredName ?? null,
        Department: body.Department ?? null,
        SeniorityLevelID: body.SeniorityLevelID ?? null,
        SecondaryEmail: body.SecondaryEmail ?? null,
        OfficePhone: body.OfficePhone ?? null,
        AssistantName: body.AssistantName ?? null,
        AssistantEmail: body.AssistantEmail ?? null,
        City: body.City ?? null,
        State: body.State ?? null,
        Country: body.Country ?? null,
        RelationshipOwner: body.RelationshipOwner ?? null,
        ContactTypeID: body.ContactTypeID ?? null,
        PersonaTypeID: body.PersonaTypeID ?? null,
        DecisionMakerFlag: body.DecisionMakerFlag ?? false,
        ChampionFlag: body.ChampionFlag ?? false,
        DonorFlag: body.DonorFlag ?? false,
        SpeakerFlag: body.SpeakerFlag ?? false,
        AdvisoryBoardFlag: body.AdvisoryBoardFlag ?? false,
        HiringContactFlag: body.HiringContactFlag ?? false,
        InternshipContactFlag: body.InternshipContactFlag ?? false,
        ResearchContactFlag: body.ResearchContactFlag ?? false,
        LegislativeContactFlag: body.LegislativeContactFlag ?? false,
        CommunicationPreference: body.CommunicationPreference ?? null,
        EngagementScore: body.EngagementScore ?? null,
        RelationshipStrength: body.RelationshipStrength ?? null,
        WarmthStatus: body.WarmthStatus ?? null,
        LastContactDate: body.LastContactDate ?? null,
        NextFollowUpDate: body.NextFollowUpDate ?? null,
        ArchivedFlag: body.ArchivedFlag ?? false,
      },
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    const col = parseSqlNullError(message);
    if (col) {
      return NextResponse.json({ error: `Field '${col}' is required`, field: col }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
