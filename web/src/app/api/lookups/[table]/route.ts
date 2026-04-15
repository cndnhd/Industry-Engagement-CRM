import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const LOOKUP_WHITELIST: Record<
  string,
  { table: string; idCol: string; nameCol: string; sortCol?: string }
> = {
  departments: { table: 'Departments', idCol: 'DepartmentID', nameCol: 'DepartmentName' },
  facultyTitles: { table: 'FacultyTitles', idCol: 'FacultyTitleID', nameCol: 'FacultyTitleName' },
  contractorRoles: { table: 'ContractorRoles', idCol: 'ContractorRoleID', nameCol: 'ContractorRoleName' },
  functionalAreas: { table: 'FunctionalAreas', idCol: 'FunctionalAreaID', nameCol: 'FunctionalAreaName' },
  influenceLevels: { table: 'InfluenceLevels', idCol: 'InfluenceLevelID', nameCol: 'InfluenceLevelName' },
  riskToleranceLevels: { table: 'RiskToleranceLevels', idCol: 'RiskToleranceID', nameCol: 'RiskToleranceName' },
  personalOrientations: { table: 'PersonalOrientations', idCol: 'PersonalOrientationID', nameCol: 'PersonalOrientationName' },
  orgTypes: { table: 'OrgTypes', idCol: 'OrgTypeID', nameCol: 'OrgTypeName' },
  ownershipTypes: { table: 'OwnershipTypes', idCol: 'OwnershipTypeID', nameCol: 'OwnershipTypeName' },
  growthStages: { table: 'GrowthStages', idCol: 'GrowthStageID', nameCol: 'GrowthStageName' },
  priorityLevels: { table: 'PriorityLevels', idCol: 'PriorityLevelID', nameCol: 'PriorityLevelName' },
  relationshipLevels: { table: 'RelationshipLevels', idCol: 'RelationshipLevelID', nameCol: 'LevelName', sortCol: 'LevelRank' },
  outreachMotions: { table: 'OutreachMotions', idCol: 'OutreachMotionID', nameCol: 'OutreachMotionName' },
  engagementTypes: { table: 'EngagementTypes', idCol: 'EngagementTypeID', nameCol: 'EngagementTypeName' },
  journeyStages: { table: 'JourneyStages', idCol: 'JourneyStageID', nameCol: 'JourneyStageName' },
  opportunityTypes: { table: 'OpportunityTypes', idCol: 'OpportunityTypeID', nameCol: 'OpportunityTypeName' },
  opportunityStages: { table: 'OpportunityStages', idCol: 'StageID', nameCol: 'StageName' },
  opportunityStatuses: { table: 'OpportunityStatuses', idCol: 'StatusID', nameCol: 'StatusName' },
  governmentAlignmentTypes: { table: 'GovernmentAlignmentTypes', idCol: 'GovernmentAlignmentTypeID', nameCol: 'AlignmentName' },
  strategicTags: { table: 'StrategicTags', idCol: 'StrategicTagID', nameCol: 'TagName' },
  linkageRoles: { table: 'LinkageRoles', idCol: 'LinkageRoleID', nameCol: 'LinkageRoleName' },
};

export { LOOKUP_WHITELIST };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table: tableKey } = await params;
    const def = LOOKUP_WHITELIST[tableKey];
    if (!def) return NextResponse.json({ error: 'Unknown lookup table' }, { status: 404 });

    const { table, idCol, nameCol, sortCol } = def;
    const orderBy = sortCol ? `[${sortCol}], [${nameCol}]` : `[${nameCol}]`;
    const selectSort = sortCol ? `, [${sortCol}] AS sortOrder` : '';
    const rows = await query(
      `SELECT [${idCol}] AS id, [${nameCol}] AS name${selectSort} FROM dbo.[${table}] ORDER BY ${orderBy}`
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table: tableKey } = await params;
    const def = LOOKUP_WHITELIST[tableKey];
    if (!def) return NextResponse.json({ error: 'Unknown lookup table' }, { status: 404 });

    const body = await req.json();
    const name = (body.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { table, idCol, nameCol, sortCol } = def;

    // For RelationshipLevels, also accept an optional sortOrder / LevelRank
    const extraCols = sortCol && body.sortOrder != null
      ? `, [${sortCol}]`
      : '';
    const extraVals = sortCol && body.sortOrder != null
      ? ', @sortOrder'
      : '';
    const extraParams: Record<string, unknown> = { name };
    if (sortCol && body.sortOrder != null) extraParams.sortOrder = body.sortOrder;

    const rows = await query(
      `INSERT INTO dbo.[${table}] ([${nameCol}]${extraCols})
       OUTPUT INSERTED.[${idCol}] AS id, INSERTED.[${nameCol}] AS name
       VALUES (@name${extraVals})`,
      extraParams,
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('UNIQUE') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'That value already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table: tableKey } = await params;
    const def = LOOKUP_WHITELIST[tableKey];
    if (!def) return NextResponse.json({ error: 'Unknown lookup table' }, { status: 404 });

    const body = await req.json();
    const id = body.id;
    if (id == null) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { table, idCol } = def;
    await query(`DELETE FROM dbo.[${table}] WHERE [${idCol}] = @id`, { id });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    if (message.includes('REFERENCE') || message.includes('FOREIGN KEY')) {
      return NextResponse.json(
        { error: 'Cannot delete — this value is in use by other records' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
