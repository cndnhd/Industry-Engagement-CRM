// Types matching the ACTUAL Azure SQL database schema at industryrelations-coe.database.windows.net

export interface Organization {
  OrganizationID: number;
  OrganizationName: string;
  City?: string;
  State?: string;
  HeadquartersLocation?: string;
  RegionalFootprint?: string;
  OrgTypeID?: number;
  OwnershipTypeID?: number;
  GrowthStageID?: number;
  PriorityLevelID?: number;
  FederalContractor?: boolean;
  ContractorRoleID?: number;
  RDIntensityPct?: number;
  EmailPattern?: string;
  Notes?: string;
  FirstEngagementDate?: string;
  LastMeaningfulEngagement?: string;
  RelationshipLevelID?: number;
  ChampionIdentified?: boolean;
  ExecutiveSponsor?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
  ParentOrganizationID?: number;
  BusinessModelType?: string;
  HQCountry?: string;
  MissouriPresenceFlag?: boolean;
  MissouriCities?: string;
  PrimaryRegion?: string;
  LinkedInURL?: string;
  GeneralEmail?: string;
  MainPhone?: string;
  AnnualRevenueRange?: string;
  EmployeeCountRange?: string;
  NAICSCode?: string;
  PublicPrivateStatus?: string;
  PartnershipStageID?: number;
  EngagementStatus?: string;
  StrategicFitScore?: number;
  WorkforceAlignmentScore?: number;
  ResearchAlignmentScore?: number;
  PhilanthropyPotentialScore?: number;
  GovernmentRelationsRelevance?: number;
  InternshipPotentialFlag?: boolean;
  HiringPotentialFlag?: boolean;
  SponsorshipPotentialFlag?: boolean;
  AdvisoryBoardPotentialFlag?: boolean;
  ResearchCollaborationPotentialFlag?: boolean;
  ExecutiveEngagementLevel?: string;
  AssignedOwner?: string;
  AssignedTeam?: string;
  NextActionDate?: string;
  ArchivedFlag?: boolean;
  StrategicPriorityLevel?: string;
  Projects?: string;
}

export interface Contact {
  ContactID: number;
  OrganizationID?: number;
  FirstName: string;
  LastName: string;
  Title?: string;
  Email?: string;
  Phone?: string;
  WorkPhone?: string;
  CellPhone?: string;
  FunctionalAreaID?: number;
  InfluenceLevelID?: number;
  RiskToleranceID?: number;
  PersonalOrientationID?: number;
  Alumni?: boolean;
  ClearanceFamiliarity?: boolean;
  IsPrimaryContact?: boolean;
  Notes?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  Prefix?: string;
  MiddleName?: string;
  Suffix?: string;
  PreferredName?: string;
  Department?: string;
  SeniorityLevelID?: number;
  SecondaryEmail?: string;
  OfficePhone?: string;
  LinkedInURL?: string;
  AssistantName?: string;
  AssistantEmail?: string;
  City?: string;
  State?: string;
  Country?: string;
  RelationshipOwner?: string;
  ContactTypeID?: number;
  PersonaTypeID?: number;
  DecisionMakerFlag?: boolean;
  ChampionFlag?: boolean;
  DonorFlag?: boolean;
  SpeakerFlag?: boolean;
  AdvisoryBoardFlag?: boolean;
  HiringContactFlag?: boolean;
  InternshipContactFlag?: boolean;
  ResearchContactFlag?: boolean;
  LegislativeContactFlag?: boolean;
  CommunicationPreference?: string;
  EngagementScore?: number;
  RelationshipStrength?: number;
  WarmthStatus?: string;
  LastContactDate?: string;
  NextFollowUpDate?: string;
  ArchivedFlag?: boolean;
}

export interface Faculty {
  FacultyID: number;
  FirstName: string;
  LastName: string;
  Title?: string;
  Email?: string;
  Notes?: string;
  DepartmentID?: number;
  FacultyTitleID?: number;
}

export interface EngagementEvent {
  EngagementEventID: number;
  OrganizationID: number;
  PrimaryContactID?: number;
  EventDate: string;
  OutreachMotionID?: number;
  EngagementTypeID?: number;
  ResponseTimeDays?: number;
  FollowUpCadenceDays?: number;
  Subject?: string;
  Outcome?: string;
  Notes?: string;
  NextStep?: string;
  NextStepDate?: string;
  CreatedAt?: string;
  Channel?: string;
  Direction?: string;
  Sentiment?: string;
  EntryVector?: string;
  ValuePropositionCategory?: string;
  FacultySource?: string;
  CompletedFlag?: boolean;
}

export interface Opportunity {
  OpportunityID: number;
  OrganizationID: number;
  OpportunityName: string;
  OpportunityTypeID?: number;
  StageID?: number;
  StatusID?: number;
  OwnerName?: string;
  EstimatedValue?: number;
  ProbabilityScore?: number;
  StrategicImportanceScore?: number;
  OpenedDate?: string;
  TargetCloseDate?: string;
  ClosedDate?: string;
  NextStep?: string;
  Notes?: string;
}

export interface OrganizationScore {
  OrganizationScoreID: number;
  OrganizationID: number;
  ScoreDate?: string;
  ExecutiveEngagementScore: number;
  MultiTouchpointScore: number;
  FacultyAlignmentScore: number;
  GovernmentOverlayScore: number;
  AdvisoryBoardScore: number;
  PhilanthropicBehaviorScore: number;
  RegionalIdentityScore: number;
  NamingLevelProbabilityScore?: number;
  OverallPartnershipScore: number;
  Notes?: string;
  // Joined field from scores API
  OrganizationName?: string;
}

export interface OrganizationFacultyLinkage {
  OrganizationFacultyLinkageID: number;
  OrganizationID: number;
  FacultyID: number;
  LinkageRoleID?: number;
  ActiveFlag?: boolean;
  Notes?: string;
}

export interface OrganizationGovernmentAlignment {
  OrganizationGovernmentAlignmentID: number;
  OrganizationID: number;
  GovernmentAlignmentTypeID: number;
  Notes?: string;
}

export interface OrganizationStrategicTag {
  OrganizationStrategicTagID: number;
  OrganizationID: number;
  StrategicTagID: number;
}

export interface JourneyLog {
  JourneyLogID: number;
  OrganizationID: number;
  JourneyStageID: number;
  RelatedEngagementEventID?: number;
  LogDate?: string;
  Outcome?: string;
  NextStep?: string;
  NextStepDate?: string;
  ProbabilityScore?: number;
  StrategicImportanceScore?: number;
  Notes?: string;
  ContactID?: number;
  EventType?: string;
  InteractionType?: string;
  Channel?: string;
  Direction?: string;
  Summary?: string;
  Owner?: string;
  FollowUpDueDate?: string;
  CompletedFlag?: boolean;
  StageMovement?: string;
  LinkedOpportunityID?: number;
  Sentiment?: string;
  StrategicRelevance?: string;
}

export interface LookupItem {
  id: number;
  name: string;
  sortOrder?: number;
}

/** Saved user list (contacts or organizations). */
export interface UserList {
  ListID: number;
  Name: string;
  EntityType: 'C' | 'O';
  FilterJson: string | null;
  VisibleColumnKeysJson: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface UserListColumn {
  ColumnID: number;
  ListID: number;
  Label: string;
  SortOrder: number;
  ProcessTier: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface ListMembershipRow {
  membershipId: number;
  contactId?: number;
  organizationId?: number;
  cells: Record<number, number>;
}

export interface StrategicRollup {
  RollupID: number;
  Name: string;
  Description: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface RollupComponent {
  ComponentID: number;
  RollupID: number;
  Label: string;
  SortOrder: number;
  Notes: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface RollupContactRow {
  RollupID: number;
  ContactID: number;
  ComponentID: number | null;
  Notes: string | null;
  FirstName: string;
  LastName: string;
  Email?: string;
  Title?: string;
  OrganizationID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface PartnershipStage {
  PartnershipStageID: number;
  StageName: string;
  StageLevel?: number;
  Description?: string;
}

export interface EcosystemLink {
  EcosystemLinkID: number;
  OrganizationID: number;
  EntityTypeID: number;
  RelatedName: string;
  RelatedOrgID?: number;
  Notes?: string;
  CreatedAt?: string;
}

export interface PartnershipStageHistoryEntry {
  HistoryID: number;
  OrganizationID: number;
  OldStageID?: number;
  NewStageID: number;
  TransitionDate: string;
  Notes?: string;
  CreatedAt?: string;
}

export interface SegmentDefinition {
  SegmentID: number;
  Name: string;
  EntityType: string;
  RulesJson: string;
  Description?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export type LookupTable =
  | 'departments' | 'facultyTitles' | 'contractorRoles' | 'functionalAreas'
  | 'influenceLevels' | 'riskToleranceLevels' | 'personalOrientations'
  | 'orgTypes' | 'ownershipTypes' | 'growthStages' | 'priorityLevels'
  | 'relationshipLevels' | 'outreachMotions' | 'engagementTypes'
  | 'journeyStages' | 'opportunityTypes' | 'opportunityStages'
  | 'opportunityStatuses' | 'governmentAlignmentTypes' | 'strategicTags'
  | 'linkageRoles'
  | 'industrySectors' | 'subsectors' | 'seniorityLevels' | 'contactTypes'
  | 'personaTypes' | 'partnershipStages' | 'ecosystemEntityTypes' | 'interestAreas';

export function calculateOverallScore(s: {
  ExecutiveEngagementScore: number;
  MultiTouchpointScore: number;
  FacultyAlignmentScore: number;
  GovernmentOverlayScore: number;
  AdvisoryBoardScore: number;
  PhilanthropicBehaviorScore: number;
  RegionalIdentityScore: number;
}): number {
  return Math.round(
    (
      (s.ExecutiveEngagementScore ?? 0) * 0.25 +
      (s.MultiTouchpointScore ?? 0) * 0.20 +
      (s.FacultyAlignmentScore ?? 0) * 0.15 +
      (s.GovernmentOverlayScore ?? 0) * 0.10 +
      (s.AdvisoryBoardScore ?? 0) * 0.10 +
      (s.PhilanthropicBehaviorScore ?? 0) * 0.10 +
      (s.RegionalIdentityScore ?? 0) * 0.10
    ) * 20 * 100
  ) / 100;
}

export function getScoreBadge(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'High Potential', color: 'emerald' };
  if (score >= 55) return { label: 'Promising', color: 'blue' };
  if (score >= 35) return { label: 'Emerging', color: 'amber' };
  return { label: 'Low', color: 'slate' };
}
