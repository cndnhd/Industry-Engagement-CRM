// ─── Rule AST types ───────────────────────────────────────────────────

export type Operator =
  | 'eq' | 'neq' | 'contains' | 'starts_with' | 'ends_with'
  | 'is_blank' | 'is_not_blank'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'not_in' | 'between'
  | 'is_true' | 'is_false';

export interface RuleCondition {
  field: string;
  operator: Operator;
  value?: string | number | boolean | string[] | number[];
  value2?: string | number;
}

export interface RuleGroup {
  logic: 'AND' | 'OR' | 'NOT';
  conditions: (RuleCondition | RuleGroup)[];
}

export interface SegmentRules {
  entityType: 'O' | 'C';
  root: RuleGroup;
}

// ─── Internal field mapping types ─────────────────────────────────────

type DirectField = { kind: 'direct'; expr: string };
type SpecialField = {
  kind: 'special';
  joinTable: string;
  joinParentCol: string;
  parentExpr: string;
  valueCol: string;
};
type FieldDef = DirectField | SpecialField;

interface CompileCtx {
  idx: number;
  params: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function d(alias: string, col: string): DirectField {
  return { kind: 'direct', expr: `${alias}.${col}` };
}

function addParam(ctx: CompileCtx, value: unknown): string {
  const name = `p${ctx.idx++}`;
  ctx.params[name] = value;
  return `@${name}`;
}

function escapeLike(v: string): string {
  return v.replace(/[%_\[\\]/g, '\\$&');
}

// ─── Organization field allowlist ─────────────────────────────────────

const ORG_FIELDS: Record<string, FieldDef> = {
  // Strings
  OrganizationName: d('o', 'OrganizationName'),
  City: d('o', 'City'),
  State: d('o', 'State'),
  HeadquartersLocation: d('o', 'HeadquartersLocation'),
  RegionalFootprint: d('o', 'RegionalFootprint'),
  BusinessModelType: d('o', 'BusinessModelType'),
  HQCountry: d('o', 'HQCountry'),
  MissouriCities: d('o', 'MissouriCities'),
  PrimaryRegion: d('o', 'PrimaryRegion'),
  LinkedInURL: d('o', 'LinkedInURL'),
  GeneralEmail: d('o', 'GeneralEmail'),
  MainPhone: d('o', 'MainPhone'),
  AnnualRevenueRange: d('o', 'AnnualRevenueRange'),
  EmployeeCountRange: d('o', 'EmployeeCountRange'),
  NAICSCode: d('o', 'NAICSCode'),
  PublicPrivateStatus: d('o', 'PublicPrivateStatus'),
  EngagementStatus: d('o', 'EngagementStatus'),
  StrategicPriorityLevel: d('o', 'StrategicPriorityLevel'),
  ExecutiveEngagementLevel: d('o', 'ExecutiveEngagementLevel'),
  AssignedOwner: d('o', 'AssignedOwner'),
  AssignedTeam: d('o', 'AssignedTeam'),
  Notes: d('o', 'Notes'),
  Projects: d('o', 'Projects'),
  EmailPattern: d('o', 'EmailPattern'),
  GovernmentRelationsRelevance: d('o', 'GovernmentRelationsRelevance'),

  // Booleans
  FederalContractor: d('o', 'FederalContractor'),
  ChampionIdentified: d('o', 'ChampionIdentified'),
  ExecutiveSponsor: d('o', 'ExecutiveSponsor'),
  InternshipPotentialFlag: d('o', 'InternshipPotentialFlag'),
  HiringPotentialFlag: d('o', 'HiringPotentialFlag'),
  SponsorshipPotentialFlag: d('o', 'SponsorshipPotentialFlag'),
  AdvisoryBoardPotentialFlag: d('o', 'AdvisoryBoardPotentialFlag'),
  ResearchCollaborationPotentialFlag: d('o', 'ResearchCollaborationPotentialFlag'),
  ArchivedFlag: d('o', 'ArchivedFlag'),
  MissouriPresenceFlag: d('o', 'MissouriPresenceFlag'),

  // FK / lookup IDs
  OrgTypeID: d('o', 'OrgTypeID'),
  OwnershipTypeID: d('o', 'OwnershipTypeID'),
  GrowthStageID: d('o', 'GrowthStageID'),
  PriorityLevelID: d('o', 'PriorityLevelID'),
  ContractorRoleID: d('o', 'ContractorRoleID'),
  RelationshipLevelID: d('o', 'RelationshipLevelID'),
  PartnershipStageID: d('o', 'PartnershipStageID'),

  // Decimals
  RDIntensityPct: d('o', 'RDIntensityPct'),
  StrategicFitScore: d('o', 'StrategicFitScore'),
  WorkforceAlignmentScore: d('o', 'WorkforceAlignmentScore'),
  ResearchAlignmentScore: d('o', 'ResearchAlignmentScore'),
  PhilanthropyPotentialScore: d('o', 'PhilanthropyPotentialScore'),

  // Dates
  FirstEngagementDate: d('o', 'FirstEngagementDate'),
  LastMeaningfulEngagement: d('o', 'LastMeaningfulEngagement'),
  NextActionDate: d('o', 'NextActionDate'),
  CreatedAt: d('o', 'CreatedAt'),

  // Nullable int
  ParentOrganizationID: d('o', 'ParentOrganizationID'),

  // Computed
  DaysSinceEngagement: {
    kind: 'direct',
    expr: 'DATEDIFF(DAY, o.LastMeaningfulEngagement, GETDATE())',
  },

  // Special — join-based
  Tag: {
    kind: 'special',
    joinTable: 'dbo.OrganizationStrategicTags',
    joinParentCol: 'OrganizationID',
    parentExpr: 'o.OrganizationID',
    valueCol: 'StrategicTagID',
  },
  Sector: {
    kind: 'special',
    joinTable: 'dbo.OrganizationSectors',
    joinParentCol: 'OrganizationID',
    parentExpr: 'o.OrganizationID',
    valueCol: 'IndustrySectorID',
  },
};

// ─── Contact field allowlist ──────────────────────────────────────────

const CONTACT_FIELDS: Record<string, FieldDef> = {
  // Strings
  FirstName: d('c', 'FirstName'),
  LastName: d('c', 'LastName'),
  Title: d('c', 'Title'),
  Email: d('c', 'Email'),
  Phone: d('c', 'Phone'),
  SecondaryEmail: d('c', 'SecondaryEmail'),
  OfficePhone: d('c', 'OfficePhone'),
  Prefix: d('c', 'Prefix'),
  MiddleName: d('c', 'MiddleName'),
  Suffix: d('c', 'Suffix'),
  PreferredName: d('c', 'PreferredName'),
  Department: d('c', 'Department'),
  AssistantName: d('c', 'AssistantName'),
  AssistantEmail: d('c', 'AssistantEmail'),
  City: d('c', 'City'),
  State: d('c', 'State'),
  Country: d('c', 'Country'),
  RelationshipOwner: d('c', 'RelationshipOwner'),
  CommunicationPreference: d('c', 'CommunicationPreference'),
  RelationshipStrength: d('c', 'RelationshipStrength'),
  WarmthStatus: d('c', 'WarmthStatus'),
  LinkedInURL: d('c', 'LinkedInURL'),
  Notes: d('c', 'Notes'),

  // Booleans
  Alumni: d('c', 'Alumni'),
  ClearanceFamiliarity: d('c', 'ClearanceFamiliarity'),
  IsPrimaryContact: d('c', 'IsPrimaryContact'),
  DecisionMakerFlag: d('c', 'DecisionMakerFlag'),
  ChampionFlag: d('c', 'ChampionFlag'),
  DonorFlag: d('c', 'DonorFlag'),
  SpeakerFlag: d('c', 'SpeakerFlag'),
  AdvisoryBoardFlag: d('c', 'AdvisoryBoardFlag'),
  HiringContactFlag: d('c', 'HiringContactFlag'),
  InternshipContactFlag: d('c', 'InternshipContactFlag'),
  ResearchContactFlag: d('c', 'ResearchContactFlag'),
  LegislativeContactFlag: d('c', 'LegislativeContactFlag'),
  ArchivedFlag: d('c', 'ArchivedFlag'),

  // FK / lookup IDs
  OrganizationID: d('c', 'OrganizationID'),
  FunctionalAreaID: d('c', 'FunctionalAreaID'),
  InfluenceLevelID: d('c', 'InfluenceLevelID'),
  RiskToleranceID: d('c', 'RiskToleranceID'),
  PersonalOrientationID: d('c', 'PersonalOrientationID'),
  SeniorityLevelID: d('c', 'SeniorityLevelID'),
  ContactTypeID: d('c', 'ContactTypeID'),
  PersonaTypeID: d('c', 'PersonaTypeID'),

  // Decimal
  EngagementScore: d('c', 'EngagementScore'),

  // Dates
  LastContactDate: d('c', 'LastContactDate'),
  NextFollowUpDate: d('c', 'NextFollowUpDate'),
  CreatedAt: d('c', 'CreatedAt'),

  // Special — join-based
  InterestArea: {
    kind: 'special',
    joinTable: 'dbo.ContactInterestAreas',
    joinParentCol: 'ContactID',
    parentExpr: 'c.ContactID',
    valueCol: 'InterestAreaID',
  },
};

// ─── SQL compilation ──────────────────────────────────────────────────

const VALID_OPS = new Set<string>([
  'eq', 'neq', 'contains', 'starts_with', 'ends_with',
  'is_blank', 'is_not_blank', 'gt', 'gte', 'lt', 'lte',
  'in', 'not_in', 'between', 'is_true', 'is_false',
]);

const NEEDS_VALUE = new Set<string>([
  'eq', 'neq', 'contains', 'starts_with', 'ends_with',
  'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'between',
]);

function compileDirect(
  expr: string,
  cond: RuleCondition,
  ctx: CompileCtx,
): string {
  switch (cond.operator) {
    case 'eq':
      return `${expr} = ${addParam(ctx, cond.value)}`;
    case 'neq':
      return `${expr} <> ${addParam(ctx, cond.value)}`;
    case 'gt':
      return `${expr} > ${addParam(ctx, cond.value)}`;
    case 'gte':
      return `${expr} >= ${addParam(ctx, cond.value)}`;
    case 'lt':
      return `${expr} < ${addParam(ctx, cond.value)}`;
    case 'lte':
      return `${expr} <= ${addParam(ctx, cond.value)}`;
    case 'contains':
      return `${expr} LIKE '%' + ${addParam(ctx, escapeLike(String(cond.value)))} + '%' ESCAPE '\\'`;
    case 'starts_with':
      return `${expr} LIKE ${addParam(ctx, escapeLike(String(cond.value)))} + '%' ESCAPE '\\'`;
    case 'ends_with':
      return `${expr} LIKE '%' + ${addParam(ctx, escapeLike(String(cond.value)))} ESCAPE '\\'`;
    case 'is_blank':
      return `(${expr} IS NULL OR ${expr} = '')`;
    case 'is_not_blank':
      return `(${expr} IS NOT NULL AND ${expr} <> '')`;
    case 'is_true':
      return `${expr} = 1`;
    case 'is_false':
      return `(${expr} = 0 OR ${expr} IS NULL)`;
    case 'between': {
      const lo = addParam(ctx, cond.value);
      const hi = addParam(ctx, cond.value2);
      return `${expr} BETWEEN ${lo} AND ${hi}`;
    }
    case 'in':
    case 'not_in': {
      const arr = Array.isArray(cond.value) ? cond.value : [cond.value];
      if (arr.length === 0) return cond.operator === 'in' ? '1=0' : '1=1';
      const refs = arr.map((v) => addParam(ctx, v));
      return cond.operator === 'in'
        ? `${expr} IN (${refs.join(', ')})`
        : `${expr} NOT IN (${refs.join(', ')})`;
    }
    default:
      throw new Error(`Unsupported operator: ${cond.operator}`);
  }
}

function compileSpecial(
  def: SpecialField,
  cond: RuleCondition,
  ctx: CompileCtx,
): string {
  if (cond.operator !== 'in' && cond.operator !== 'not_in') {
    throw new Error(
      `Field '${cond.field}' only supports 'in' and 'not_in' operators`,
    );
  }
  const arr = Array.isArray(cond.value) ? cond.value : [cond.value];
  if (arr.length === 0) return cond.operator === 'in' ? '1=0' : '1=1';
  const refs = arr.map((v) => addParam(ctx, v));
  const kw = cond.operator === 'in' ? 'EXISTS' : 'NOT EXISTS';
  return `${kw} (SELECT 1 FROM ${def.joinTable} _j WHERE _j.${def.joinParentCol} = ${def.parentExpr} AND _j.${def.valueCol} IN (${refs.join(', ')}))`;
}

function isGroup(node: RuleCondition | RuleGroup): node is RuleGroup {
  return 'logic' in node && 'conditions' in node;
}

function compileNode(
  node: RuleCondition | RuleGroup,
  fields: Record<string, FieldDef>,
  ctx: CompileCtx,
): string {
  if (isGroup(node)) return compileGroupNode(node, fields, ctx);

  if (!VALID_OPS.has(node.operator)) {
    throw new Error(`Invalid operator: ${node.operator}`);
  }
  if (NEEDS_VALUE.has(node.operator) && node.value == null) {
    throw new Error(`Operator '${node.operator}' requires a value`);
  }
  if (node.operator === 'between' && node.value2 == null) {
    throw new Error("Operator 'between' requires value2");
  }

  const def = fields[node.field];
  if (!def) throw new Error(`Disallowed field: '${node.field}'`);

  return def.kind === 'special'
    ? compileSpecial(def, node, ctx)
    : compileDirect(def.expr, node, ctx);
}

function compileGroupNode(
  group: RuleGroup,
  fields: Record<string, FieldDef>,
  ctx: CompileCtx,
): string {
  if (!group.conditions?.length) return '1=1';
  const parts = group.conditions.map((c) => compileNode(c, fields, ctx));
  if (group.logic === 'NOT') return `NOT (${parts.join(' AND ')})`;
  return `(${parts.join(group.logic === 'OR' ? ' OR ' : ' AND ')})`;
}

// ─── Public API ───────────────────────────────────────────────────────

export function compileSegment(rules: SegmentRules): {
  sql: string;
  countSql: string;
  params: Record<string, unknown>;
} {
  if (rules.entityType !== 'O' && rules.entityType !== 'C') {
    throw new Error(`Invalid entityType: '${rules.entityType}'`);
  }
  const fields = rules.entityType === 'O' ? ORG_FIELDS : CONTACT_FIELDS;
  const table =
    rules.entityType === 'O' ? 'dbo.Organizations o' : 'dbo.Contacts c';
  const ctx: CompileCtx = { idx: 0, params: {} };
  const where = compileGroupNode(rules.root, fields, ctx);
  return {
    sql: `SELECT * FROM ${table} WHERE ${where}`,
    countSql: `SELECT COUNT(*) AS cnt FROM ${table} WHERE ${where}`,
    params: ctx.params,
  };
}

export function validateRules(
  raw: unknown,
): { valid: true; rules: SegmentRules } | { valid: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Rules must be an object' };
  }
  const r = raw as Record<string, unknown>;
  if (r.entityType !== 'O' && r.entityType !== 'C') {
    return { valid: false, error: "entityType must be 'O' or 'C'" };
  }
  if (!r.root || typeof r.root !== 'object') {
    return { valid: false, error: 'root must be a rule group' };
  }
  try {
    const typed = r as unknown as SegmentRules;
    compileSegment(typed);
    return { valid: true, rules: typed };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid rules',
    };
  }
}
