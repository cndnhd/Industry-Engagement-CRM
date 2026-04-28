import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function parseSqlNullError(message: string): string | null {
  const m = message.match(/Cannot insert the value NULL into column '(\w+)'/);
  return m ? m[1] : null;
}

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

    if (!body.FirstName?.trim()) {
      return NextResponse.json({ error: 'First Name is required', field: 'FirstName' }, { status: 400 });
    }
    if (!body.LastName?.trim()) {
      return NextResponse.json({ error: 'Last Name is required', field: 'LastName' }, { status: 400 });
    }

    const rows = await query(
      `UPDATE dbo.Contacts SET
        FirstName = @FirstName,
        LastName = @LastName,
        Title = @Title,
        Email = @Email,
        Phone = @Phone,
        WorkPhone = @WorkPhone,
        CellPhone = @CellPhone,
        OrganizationID = @OrganizationID,
        FunctionalAreaID = @FunctionalAreaID,
        InfluenceLevelID = @InfluenceLevelID,
        RiskToleranceID = @RiskToleranceID,
        PersonalOrientationID = @PersonalOrientationID,
        Alumni = @Alumni,
        ClearanceFamiliarity = @ClearanceFamiliarity,
        IsPrimaryContact = @IsPrimaryContact,
        Notes = @Notes,
        LinkedInURL = @LinkedInURL,
        Prefix = @Prefix,
        MiddleName = @MiddleName,
        Suffix = @Suffix,
        PreferredName = @PreferredName,
        Department = @Department,
        SeniorityLevelID = @SeniorityLevelID,
        SecondaryEmail = @SecondaryEmail,
        OfficePhone = @OfficePhone,
        AssistantName = @AssistantName,
        AssistantEmail = @AssistantEmail,
        City = @City,
        State = @State,
        Country = @Country,
        RelationshipOwner = @RelationshipOwner,
        ContactTypeID = @ContactTypeID,
        PersonaTypeID = @PersonaTypeID,
        DecisionMakerFlag = @DecisionMakerFlag,
        ChampionFlag = @ChampionFlag,
        DonorFlag = @DonorFlag,
        SpeakerFlag = @SpeakerFlag,
        AdvisoryBoardFlag = @AdvisoryBoardFlag,
        HiringContactFlag = @HiringContactFlag,
        InternshipContactFlag = @InternshipContactFlag,
        ResearchContactFlag = @ResearchContactFlag,
        LegislativeContactFlag = @LegislativeContactFlag,
        CommunicationPreference = @CommunicationPreference,
        EngagementScore = @EngagementScore,
        RelationshipStrength = @RelationshipStrength,
        WarmthStatus = @WarmthStatus,
        LastContactDate = @LastContactDate,
        NextFollowUpDate = @NextFollowUpDate,
        ArchivedFlag = @ArchivedFlag,
        UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE ContactID = @id`,
      {
        id: Number(id),
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
        Alumni: body.Alumni ?? null,
        ClearanceFamiliarity: body.ClearanceFamiliarity ?? null,
        IsPrimaryContact: body.IsPrimaryContact ?? null,
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
        DecisionMakerFlag: body.DecisionMakerFlag ?? null,
        ChampionFlag: body.ChampionFlag ?? null,
        DonorFlag: body.DonorFlag ?? null,
        SpeakerFlag: body.SpeakerFlag ?? null,
        AdvisoryBoardFlag: body.AdvisoryBoardFlag ?? null,
        HiringContactFlag: body.HiringContactFlag ?? null,
        InternshipContactFlag: body.InternshipContactFlag ?? null,
        ResearchContactFlag: body.ResearchContactFlag ?? null,
        LegislativeContactFlag: body.LegislativeContactFlag ?? null,
        CommunicationPreference: body.CommunicationPreference ?? null,
        EngagementScore: body.EngagementScore ?? null,
        RelationshipStrength: body.RelationshipStrength ?? null,
        WarmthStatus: body.WarmthStatus ?? null,
        LastContactDate: body.LastContactDate ?? null,
        NextFollowUpDate: body.NextFollowUpDate ?? null,
        ArchivedFlag: body.ArchivedFlag ?? null,
      },
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    const col = parseSqlNullError(message);
    if (col) {
      return NextResponse.json({ error: `Field '${col}' is required`, field: col }, { status: 400 });
    }
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
