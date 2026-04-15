/*******************************************************************************
 * Industry Engagement CRM — Azure SQL Schema
 * File: 01_create_tables.sql
 *
 * Creates all lookup tables, production tables, bridge tables, scoring table,
 * and Forms-intake staging tables in dependency-safe order.
 *
 * Target: Azure SQL Database named [IndustryEngagement]
 * Collation: default (SQL_Latin1_General_CP1_CI_AS)
 * Compatibility: SQL Server 2019+ / Azure SQL
 ******************************************************************************/

SET NOCOUNT ON;
GO

-- ============================================================================
-- SECTION 1 — LOOKUP / REFERENCE TABLES
-- These have no foreign-key dependencies and must be created first.
-- ============================================================================

-- 1.01 Departments (academic units)
CREATE TABLE dbo.Departments (
    DepartmentID   INT IDENTITY(1,1) NOT NULL,
    DepartmentName NVARCHAR(150)     NOT NULL,
    IsActive       BIT               NOT NULL DEFAULT 1,
    CreatedAt      DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt      DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Departments PRIMARY KEY (DepartmentID),
    CONSTRAINT UQ_Departments_Name UNIQUE (DepartmentName)
);
GO

-- 1.02 FacultyTitles
CREATE TABLE dbo.FacultyTitles (
    FacultyTitleID   INT IDENTITY(1,1) NOT NULL,
    FacultyTitleName NVARCHAR(150)     NOT NULL,
    IsActive         BIT               NOT NULL DEFAULT 1,
    CreatedAt        DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt        DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_FacultyTitles PRIMARY KEY (FacultyTitleID),
    CONSTRAINT UQ_FacultyTitles_Name UNIQUE (FacultyTitleName)
);
GO

-- 1.03 ContractorRoles
CREATE TABLE dbo.ContractorRoles (
    ContractorRoleID   INT IDENTITY(1,1) NOT NULL,
    ContractorRoleName NVARCHAR(150)     NOT NULL,
    IsActive           BIT               NOT NULL DEFAULT 1,
    CreatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ContractorRoles PRIMARY KEY (ContractorRoleID),
    CONSTRAINT UQ_ContractorRoles_Name UNIQUE (ContractorRoleName)
);
GO

-- 1.04 FunctionalAreas
CREATE TABLE dbo.FunctionalAreas (
    FunctionalAreaID   INT IDENTITY(1,1) NOT NULL,
    FunctionalAreaName NVARCHAR(150)     NOT NULL,
    IsActive           BIT               NOT NULL DEFAULT 1,
    CreatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_FunctionalAreas PRIMARY KEY (FunctionalAreaID),
    CONSTRAINT UQ_FunctionalAreas_Name UNIQUE (FunctionalAreaName)
);
GO

-- 1.05 InfluenceLevels
CREATE TABLE dbo.InfluenceLevels (
    InfluenceLevelID   INT IDENTITY(1,1) NOT NULL,
    InfluenceLevelName NVARCHAR(100)     NOT NULL,
    SortOrder          INT               NOT NULL DEFAULT 0,
    IsActive           BIT               NOT NULL DEFAULT 1,
    CreatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_InfluenceLevels PRIMARY KEY (InfluenceLevelID),
    CONSTRAINT UQ_InfluenceLevels_Name UNIQUE (InfluenceLevelName)
);
GO

-- 1.06 RiskToleranceLevels
CREATE TABLE dbo.RiskToleranceLevels (
    RiskToleranceID   INT IDENTITY(1,1) NOT NULL,
    RiskToleranceName NVARCHAR(100)     NOT NULL,
    SortOrder         INT               NOT NULL DEFAULT 0,
    IsActive          BIT               NOT NULL DEFAULT 1,
    CreatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_RiskToleranceLevels PRIMARY KEY (RiskToleranceID),
    CONSTRAINT UQ_RiskToleranceLevels_Name UNIQUE (RiskToleranceName)
);
GO

-- 1.07 PersonalOrientations
CREATE TABLE dbo.PersonalOrientations (
    PersonalOrientationID   INT IDENTITY(1,1) NOT NULL,
    PersonalOrientationName NVARCHAR(100)     NOT NULL,
    IsActive                BIT               NOT NULL DEFAULT 1,
    CreatedAt               DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt               DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_PersonalOrientations PRIMARY KEY (PersonalOrientationID),
    CONSTRAINT UQ_PersonalOrientations_Name UNIQUE (PersonalOrientationName)
);
GO

-- 1.08 OrgTypes
CREATE TABLE dbo.OrgTypes (
    OrgTypeID   INT IDENTITY(1,1) NOT NULL,
    OrgTypeName NVARCHAR(150)     NOT NULL,
    IsActive    BIT               NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OrgTypes PRIMARY KEY (OrgTypeID),
    CONSTRAINT UQ_OrgTypes_Name UNIQUE (OrgTypeName)
);
GO

-- 1.09 OwnershipTypes
CREATE TABLE dbo.OwnershipTypes (
    OwnershipTypeID   INT IDENTITY(1,1) NOT NULL,
    OwnershipTypeName NVARCHAR(100)     NOT NULL,
    IsActive          BIT               NOT NULL DEFAULT 1,
    CreatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OwnershipTypes PRIMARY KEY (OwnershipTypeID),
    CONSTRAINT UQ_OwnershipTypes_Name UNIQUE (OwnershipTypeName)
);
GO

-- 1.10 GrowthStages
CREATE TABLE dbo.GrowthStages (
    GrowthStageID   INT IDENTITY(1,1) NOT NULL,
    GrowthStageName NVARCHAR(100)     NOT NULL,
    SortOrder       INT               NOT NULL DEFAULT 0,
    IsActive        BIT               NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_GrowthStages PRIMARY KEY (GrowthStageID),
    CONSTRAINT UQ_GrowthStages_Name UNIQUE (GrowthStageName)
);
GO

-- 1.11 PriorityLevels
CREATE TABLE dbo.PriorityLevels (
    PriorityLevelID   INT IDENTITY(1,1) NOT NULL,
    PriorityLevelName NVARCHAR(100)     NOT NULL,
    SortOrder         INT               NOT NULL DEFAULT 0,
    IsActive          BIT               NOT NULL DEFAULT 1,
    CreatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_PriorityLevels PRIMARY KEY (PriorityLevelID),
    CONSTRAINT UQ_PriorityLevels_Name UNIQUE (PriorityLevelName)
);
GO

-- 1.12 RelationshipLevels
CREATE TABLE dbo.RelationshipLevels (
    RelationshipLevelID   INT IDENTITY(1,1) NOT NULL,
    RelationshipLevelName NVARCHAR(100)     NOT NULL,
    SortOrder             INT               NOT NULL DEFAULT 0,
    IsActive              BIT               NOT NULL DEFAULT 1,
    CreatedAt             DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt             DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_RelationshipLevels PRIMARY KEY (RelationshipLevelID),
    CONSTRAINT UQ_RelationshipLevels_Name UNIQUE (RelationshipLevelName)
);
GO

-- 1.13 OutreachMotions
CREATE TABLE dbo.OutreachMotions (
    OutreachMotionID   INT IDENTITY(1,1) NOT NULL,
    OutreachMotionName NVARCHAR(150)     NOT NULL,
    IsActive           BIT               NOT NULL DEFAULT 1,
    CreatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OutreachMotions PRIMARY KEY (OutreachMotionID),
    CONSTRAINT UQ_OutreachMotions_Name UNIQUE (OutreachMotionName)
);
GO

-- 1.14 EngagementTypes
CREATE TABLE dbo.EngagementTypes (
    EngagementTypeID   INT IDENTITY(1,1) NOT NULL,
    EngagementTypeName NVARCHAR(150)     NOT NULL,
    IsActive           BIT               NOT NULL DEFAULT 1,
    CreatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_EngagementTypes PRIMARY KEY (EngagementTypeID),
    CONSTRAINT UQ_EngagementTypes_Name UNIQUE (EngagementTypeName)
);
GO

-- 1.15 JourneyStages
CREATE TABLE dbo.JourneyStages (
    JourneyStageID   INT IDENTITY(1,1) NOT NULL,
    JourneyStageName NVARCHAR(100)     NOT NULL,
    SortOrder        INT               NOT NULL DEFAULT 0,
    IsActive         BIT               NOT NULL DEFAULT 1,
    CreatedAt        DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt        DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_JourneyStages PRIMARY KEY (JourneyStageID),
    CONSTRAINT UQ_JourneyStages_Name UNIQUE (JourneyStageName)
);
GO

-- 1.16 OpportunityTypes
CREATE TABLE dbo.OpportunityTypes (
    OpportunityTypeID   INT IDENTITY(1,1) NOT NULL,
    OpportunityTypeName NVARCHAR(150)     NOT NULL,
    IsActive            BIT               NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt           DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OpportunityTypes PRIMARY KEY (OpportunityTypeID),
    CONSTRAINT UQ_OpportunityTypes_Name UNIQUE (OpportunityTypeName)
);
GO

-- 1.17 OpportunityStages
CREATE TABLE dbo.OpportunityStages (
    StageID   INT IDENTITY(1,1) NOT NULL,
    StageName NVARCHAR(100)     NOT NULL,
    SortOrder INT               NOT NULL DEFAULT 0,
    IsActive  BIT               NOT NULL DEFAULT 1,
    CreatedAt DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OpportunityStages PRIMARY KEY (StageID),
    CONSTRAINT UQ_OpportunityStages_Name UNIQUE (StageName)
);
GO

-- 1.18 OpportunityStatuses
CREATE TABLE dbo.OpportunityStatuses (
    StatusID   INT IDENTITY(1,1) NOT NULL,
    StatusName NVARCHAR(100)     NOT NULL,
    IsActive   BIT               NOT NULL DEFAULT 1,
    CreatedAt  DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt  DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OpportunityStatuses PRIMARY KEY (StatusID),
    CONSTRAINT UQ_OpportunityStatuses_Name UNIQUE (StatusName)
);
GO

-- 1.19 GovernmentAlignmentTypes
CREATE TABLE dbo.GovernmentAlignmentTypes (
    GovernmentAlignmentTypeID   INT IDENTITY(1,1) NOT NULL,
    GovernmentAlignmentTypeName NVARCHAR(200)     NOT NULL,
    IsActive                    BIT               NOT NULL DEFAULT 1,
    CreatedAt                   DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt                   DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_GovernmentAlignmentTypes PRIMARY KEY (GovernmentAlignmentTypeID),
    CONSTRAINT UQ_GovernmentAlignmentTypes_Name UNIQUE (GovernmentAlignmentTypeName)
);
GO

-- 1.20 StrategicTags
CREATE TABLE dbo.StrategicTags (
    StrategicTagID   INT IDENTITY(1,1) NOT NULL,
    StrategicTagName NVARCHAR(150)     NOT NULL,
    IsActive         BIT               NOT NULL DEFAULT 1,
    CreatedAt        DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt        DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StrategicTags PRIMARY KEY (StrategicTagID),
    CONSTRAINT UQ_StrategicTags_Name UNIQUE (StrategicTagName)
);
GO

-- 1.21 LinkageRoles (role a faculty member plays with an organization)
CREATE TABLE dbo.LinkageRoles (
    LinkageRoleID   INT IDENTITY(1,1) NOT NULL,
    LinkageRoleName NVARCHAR(150)     NOT NULL,
    IsActive        BIT               NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_LinkageRoles PRIMARY KEY (LinkageRoleID),
    CONSTRAINT UQ_LinkageRoles_Name UNIQUE (LinkageRoleName)
);
GO


-- ============================================================================
-- SECTION 2 — PRODUCTION TABLES (core entities)
-- Created in dependency order: Organizations first, then dependents.
-- ============================================================================

-- 2.01 Organizations (central entity)
CREATE TABLE dbo.Organizations (
    OrganizationID      INT IDENTITY(1,1) NOT NULL,
    OrganizationName    NVARCHAR(300)     NOT NULL,
    Website             NVARCHAR(500)     NULL,
    HeadquartersCity    NVARCHAR(150)     NULL,
    HeadquartersState   NVARCHAR(50)      NULL,
    HeadquartersCountry NVARCHAR(100)     NULL DEFAULT N'United States',
    EmployeeCount       INT               NULL,
    AnnualRevenue       DECIMAL(18,2)     NULL,
    Industry            NVARCHAR(200)     NULL,
    Description         NVARCHAR(MAX)     NULL,
    Notes               NVARCHAR(MAX)     NULL,

    -- Lookup foreign keys
    OrgTypeID           INT               NULL,
    OwnershipTypeID     INT               NULL,
    GrowthStageID       INT               NULL,
    PriorityLevelID     INT               NULL,
    ContractorRoleID    INT               NULL,
    RelationshipLevelID INT               NULL,

    -- Audit
    CreatedAt           DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt           DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    IsActive            BIT               NOT NULL DEFAULT 1,

    CONSTRAINT PK_Organizations PRIMARY KEY (OrganizationID),
    CONSTRAINT FK_Organizations_OrgType           FOREIGN KEY (OrgTypeID)           REFERENCES dbo.OrgTypes(OrgTypeID),
    CONSTRAINT FK_Organizations_OwnershipType     FOREIGN KEY (OwnershipTypeID)     REFERENCES dbo.OwnershipTypes(OwnershipTypeID),
    CONSTRAINT FK_Organizations_GrowthStage       FOREIGN KEY (GrowthStageID)       REFERENCES dbo.GrowthStages(GrowthStageID),
    CONSTRAINT FK_Organizations_PriorityLevel     FOREIGN KEY (PriorityLevelID)     REFERENCES dbo.PriorityLevels(PriorityLevelID),
    CONSTRAINT FK_Organizations_ContractorRole    FOREIGN KEY (ContractorRoleID)    REFERENCES dbo.ContractorRoles(ContractorRoleID),
    CONSTRAINT FK_Organizations_RelationshipLevel FOREIGN KEY (RelationshipLevelID) REFERENCES dbo.RelationshipLevels(RelationshipLevelID)
);
GO

-- 2.02 Contacts
CREATE TABLE dbo.Contacts (
    ContactID             INT IDENTITY(1,1) NOT NULL,
    FirstName             NVARCHAR(100)     NOT NULL,
    LastName              NVARCHAR(100)     NOT NULL,
    Email                 NVARCHAR(320)     NULL,
    Phone                 NVARCHAR(50)      NULL,
    JobTitle              NVARCHAR(200)     NULL,
    LinkedInURL           NVARCHAR(500)     NULL,
    Notes                 NVARCHAR(MAX)     NULL,

    -- Lookup foreign keys
    OrganizationID        INT               NULL,
    FunctionalAreaID      INT               NULL,
    InfluenceLevelID      INT               NULL,
    RiskToleranceID       INT               NULL,
    PersonalOrientationID INT               NULL,

    -- Audit
    CreatedAt             DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt             DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    IsActive              BIT               NOT NULL DEFAULT 1,

    CONSTRAINT PK_Contacts PRIMARY KEY (ContactID),
    CONSTRAINT FK_Contacts_Organization        FOREIGN KEY (OrganizationID)        REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT FK_Contacts_FunctionalArea      FOREIGN KEY (FunctionalAreaID)      REFERENCES dbo.FunctionalAreas(FunctionalAreaID),
    CONSTRAINT FK_Contacts_InfluenceLevel      FOREIGN KEY (InfluenceLevelID)      REFERENCES dbo.InfluenceLevels(InfluenceLevelID),
    CONSTRAINT FK_Contacts_RiskTolerance       FOREIGN KEY (RiskToleranceID)       REFERENCES dbo.RiskToleranceLevels(RiskToleranceID),
    CONSTRAINT FK_Contacts_PersonalOrientation FOREIGN KEY (PersonalOrientationID) REFERENCES dbo.PersonalOrientations(PersonalOrientationID)
);
GO

-- 2.03 Faculty
CREATE TABLE dbo.Faculty (
    FacultyID      INT IDENTITY(1,1) NOT NULL,
    FirstName      NVARCHAR(100)     NOT NULL,
    LastName       NVARCHAR(100)     NOT NULL,
    Email          NVARCHAR(320)     NULL,
    Phone          NVARCHAR(50)      NULL,
    OfficeLocation NVARCHAR(200)     NULL,
    ResearchAreas  NVARCHAR(MAX)     NULL,
    Notes          NVARCHAR(MAX)     NULL,

    -- Lookup foreign keys
    DepartmentID   INT               NULL,
    FacultyTitleID INT               NULL,

    -- Audit
    CreatedAt      DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt      DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    IsActive       BIT               NOT NULL DEFAULT 1,

    CONSTRAINT PK_Faculty PRIMARY KEY (FacultyID),
    CONSTRAINT FK_Faculty_Department  FOREIGN KEY (DepartmentID)  REFERENCES dbo.Departments(DepartmentID),
    CONSTRAINT FK_Faculty_FacultyTitle FOREIGN KEY (FacultyTitleID) REFERENCES dbo.FacultyTitles(FacultyTitleID)
);
GO

-- 2.04 EngagementEvents
CREATE TABLE dbo.EngagementEvents (
    EngagementEventID  INT IDENTITY(1,1) NOT NULL,
    EventTitle         NVARCHAR(300)     NOT NULL,
    EventDate          DATE              NOT NULL,
    EventEndDate       DATE              NULL,
    Location           NVARCHAR(300)     NULL,
    Description        NVARCHAR(MAX)     NULL,
    Outcome            NVARCHAR(MAX)     NULL,
    FollowUpDate       DATE              NULL,
    FollowUpNotes      NVARCHAR(MAX)     NULL,
    Notes              NVARCHAR(MAX)     NULL,

    -- Lookup foreign keys
    OrganizationID     INT               NOT NULL,
    PrimaryContactID   INT               NULL,
    OutreachMotionID   INT               NULL,
    EngagementTypeID   INT               NULL,

    -- Audit
    CreatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_EngagementEvents PRIMARY KEY (EngagementEventID),
    CONSTRAINT FK_EngagementEvents_Organization   FOREIGN KEY (OrganizationID)   REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT FK_EngagementEvents_PrimaryContact FOREIGN KEY (PrimaryContactID) REFERENCES dbo.Contacts(ContactID),
    CONSTRAINT FK_EngagementEvents_OutreachMotion FOREIGN KEY (OutreachMotionID) REFERENCES dbo.OutreachMotions(OutreachMotionID),
    CONSTRAINT FK_EngagementEvents_EngagementType FOREIGN KEY (EngagementTypeID) REFERENCES dbo.EngagementTypes(EngagementTypeID)
);
GO

-- 2.05 JourneyLog
CREATE TABLE dbo.JourneyLog (
    JourneyLogID              INT IDENTITY(1,1) NOT NULL,
    TransitionDate            DATE              NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    Notes                     NVARCHAR(MAX)     NULL,

    -- Lookup foreign keys
    OrganizationID            INT               NOT NULL,
    JourneyStageID            INT               NOT NULL,
    RelatedEngagementEventID  INT               NULL,

    -- Audit
    CreatedAt                 DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt                 DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_JourneyLog PRIMARY KEY (JourneyLogID),
    CONSTRAINT FK_JourneyLog_Organization     FOREIGN KEY (OrganizationID)           REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT FK_JourneyLog_JourneyStage     FOREIGN KEY (JourneyStageID)           REFERENCES dbo.JourneyStages(JourneyStageID),
    CONSTRAINT FK_JourneyLog_EngagementEvent  FOREIGN KEY (RelatedEngagementEventID) REFERENCES dbo.EngagementEvents(EngagementEventID)
);
GO

-- 2.06 Opportunities
CREATE TABLE dbo.Opportunities (
    OpportunityID     INT IDENTITY(1,1) NOT NULL,
    OpportunityName   NVARCHAR(300)     NOT NULL,
    EstimatedValue    DECIMAL(18,2)     NULL,
    ExpectedCloseDate DATE              NULL,
    Description       NVARCHAR(MAX)     NULL,
    Notes             NVARCHAR(MAX)     NULL,

    -- Lookup foreign keys
    OrganizationID    INT               NOT NULL,
    OpportunityTypeID INT               NULL,
    StageID           INT               NULL,
    StatusID          INT               NULL,

    -- Audit
    CreatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Opportunities PRIMARY KEY (OpportunityID),
    CONSTRAINT FK_Opportunities_Organization    FOREIGN KEY (OrganizationID)    REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT FK_Opportunities_OpportunityType FOREIGN KEY (OpportunityTypeID) REFERENCES dbo.OpportunityTypes(OpportunityTypeID),
    CONSTRAINT FK_Opportunities_Stage           FOREIGN KEY (StageID)           REFERENCES dbo.OpportunityStages(StageID),
    CONSTRAINT FK_Opportunities_Status          FOREIGN KEY (StatusID)          REFERENCES dbo.OpportunityStatuses(StatusID)
);
GO


-- ============================================================================
-- SECTION 3 — SCORING TABLE
-- ============================================================================

-- 3.01 OrganizationScores
-- Stores the seven sub-scores plus the computed OverallPartnershipScore.
CREATE TABLE dbo.OrganizationScores (
    OrganizationScoreID      INT IDENTITY(1,1) NOT NULL,
    OrganizationID           INT               NOT NULL,

    ExecutiveEngagementScore   DECIMAL(5,2)    NULL DEFAULT 0,
    MultiTouchpointScore       DECIMAL(5,2)    NULL DEFAULT 0,
    FacultyAlignmentScore      DECIMAL(5,2)    NULL DEFAULT 0,
    GovernmentOverlayScore     DECIMAL(5,2)    NULL DEFAULT 0,
    AdvisoryBoardScore         DECIMAL(5,2)    NULL DEFAULT 0,
    PhilanthropicBehaviorScore DECIMAL(5,2)    NULL DEFAULT 0,
    RegionalIdentityScore      DECIMAL(5,2)    NULL DEFAULT 0,

    -- Persisted composite score, updated via trigger or Power Automate
    OverallPartnershipScore    AS CAST(
        ROUND(
            (
                ISNULL(ExecutiveEngagementScore, 0)   * 0.25 +
                ISNULL(MultiTouchpointScore, 0)       * 0.20 +
                ISNULL(FacultyAlignmentScore, 0)      * 0.15 +
                ISNULL(GovernmentOverlayScore, 0)     * 0.10 +
                ISNULL(AdvisoryBoardScore, 0)         * 0.10 +
                ISNULL(PhilanthropicBehaviorScore, 0) * 0.10 +
                ISNULL(RegionalIdentityScore, 0)      * 0.10
            ) * 20
        , 2)
    AS DECIMAL(7,2)) PERSISTED,

    ScoredAt                  DATETIME2(2)     NOT NULL DEFAULT SYSUTCDATETIME(),
    Notes                     NVARCHAR(MAX)    NULL,

    -- Audit
    CreatedAt                 DATETIME2(2)     NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt                 DATETIME2(2)     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_OrganizationScores PRIMARY KEY (OrganizationScoreID),
    CONSTRAINT FK_OrganizationScores_Organization FOREIGN KEY (OrganizationID) REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT UQ_OrganizationScores_Org UNIQUE (OrganizationID)
);
GO


-- ============================================================================
-- SECTION 4 — BRIDGE / JUNCTION TABLES (many-to-many)
-- ============================================================================

-- 4.01 OrganizationFacultyLinkages
CREATE TABLE dbo.OrganizationFacultyLinkages (
    OrganizationFacultyLinkageID INT IDENTITY(1,1) NOT NULL,
    OrganizationID               INT               NOT NULL,
    FacultyID                    INT               NOT NULL,
    LinkageRoleID                INT               NULL,
    StartDate                    DATE              NULL,
    EndDate                      DATE              NULL,
    Notes                        NVARCHAR(MAX)     NULL,
    CreatedAt                    DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt                    DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_OrgFacultyLinkages PRIMARY KEY (OrganizationFacultyLinkageID),
    CONSTRAINT FK_OrgFacultyLinkages_Organization FOREIGN KEY (OrganizationID) REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT FK_OrgFacultyLinkages_Faculty      FOREIGN KEY (FacultyID)      REFERENCES dbo.Faculty(FacultyID),
    CONSTRAINT FK_OrgFacultyLinkages_LinkageRole  FOREIGN KEY (LinkageRoleID)  REFERENCES dbo.LinkageRoles(LinkageRoleID),
    CONSTRAINT UQ_OrgFacultyLinkages_Combo UNIQUE (OrganizationID, FacultyID, LinkageRoleID)
);
GO

-- 4.02 OrganizationGovernmentAlignments
CREATE TABLE dbo.OrganizationGovernmentAlignments (
    OrganizationGovernmentAlignmentID INT IDENTITY(1,1) NOT NULL,
    OrganizationID                    INT               NOT NULL,
    GovernmentAlignmentTypeID         INT               NOT NULL,
    Notes                             NVARCHAR(MAX)     NULL,
    CreatedAt                         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt                         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_OrgGovAlignments PRIMARY KEY (OrganizationGovernmentAlignmentID),
    CONSTRAINT FK_OrgGovAlignments_Organization FOREIGN KEY (OrganizationID)            REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT FK_OrgGovAlignments_Type         FOREIGN KEY (GovernmentAlignmentTypeID) REFERENCES dbo.GovernmentAlignmentTypes(GovernmentAlignmentTypeID),
    CONSTRAINT UQ_OrgGovAlignments_Combo UNIQUE (OrganizationID, GovernmentAlignmentTypeID)
);
GO

-- 4.03 OrganizationStrategicTags
CREATE TABLE dbo.OrganizationStrategicTags (
    OrganizationStrategicTagID INT IDENTITY(1,1) NOT NULL,
    OrganizationID             INT               NOT NULL,
    StrategicTagID             INT               NOT NULL,
    Notes                      NVARCHAR(MAX)     NULL,
    CreatedAt                  DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt                  DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_OrgStrategicTags PRIMARY KEY (OrganizationStrategicTagID),
    CONSTRAINT FK_OrgStrategicTags_Organization FOREIGN KEY (OrganizationID) REFERENCES dbo.Organizations(OrganizationID),
    CONSTRAINT FK_OrgStrategicTags_Tag          FOREIGN KEY (StrategicTagID) REFERENCES dbo.StrategicTags(StrategicTagID),
    CONSTRAINT UQ_OrgStrategicTags_Combo UNIQUE (OrganizationID, StrategicTagID)
);
GO


-- ============================================================================
-- SECTION 5 — FORMS INTAKE STAGING TABLES
-- Raw text from Microsoft Forms lands here; Power Automate validates and
-- promotes to production tables.
-- ============================================================================

-- 5.01 Organization intake staging
CREATE TABLE dbo.FormSubmissions_OrganizationIntake (
    SubmissionID        INT IDENTITY(1,1)  NOT NULL,
    FormResponseID      NVARCHAR(200)      NULL,   -- Forms response ID for dedup
    SubmittedAt         DATETIME2(2)       NOT NULL DEFAULT SYSUTCDATETIME(),
    SubmitterEmail      NVARCHAR(320)      NULL,

    -- Raw text fields matching the Form
    OrganizationName    NVARCHAR(300)      NULL,
    Website             NVARCHAR(500)      NULL,
    HeadquartersCity    NVARCHAR(150)      NULL,
    HeadquartersState   NVARCHAR(50)       NULL,
    Industry            NVARCHAR(200)      NULL,
    OrgType             NVARCHAR(150)      NULL,    -- text, resolved to OrgTypeID
    OwnershipType       NVARCHAR(100)      NULL,
    GrowthStage         NVARCHAR(100)      NULL,
    PriorityLevel       NVARCHAR(100)      NULL,
    ContractorRole      NVARCHAR(150)      NULL,
    RelationshipLevel   NVARCHAR(100)      NULL,
    EmployeeCount       NVARCHAR(50)       NULL,    -- text; parsed to INT
    AnnualRevenue       NVARCHAR(100)      NULL,    -- text; parsed to DECIMAL
    Description         NVARCHAR(MAX)      NULL,
    Notes               NVARCHAR(MAX)      NULL,

    -- Processing status
    ProcessedFlag       BIT                NOT NULL DEFAULT 0,
    ProcessedAt         DATETIME2(2)       NULL,
    ErrorMessage        NVARCHAR(MAX)      NULL,
    CreatedOrganizationID INT              NULL,    -- set after successful insert

    CONSTRAINT PK_FormSub_OrgIntake PRIMARY KEY (SubmissionID)
);
GO

-- 5.02 Contact intake staging
CREATE TABLE dbo.FormSubmissions_ContactIntake (
    SubmissionID          INT IDENTITY(1,1) NOT NULL,
    FormResponseID        NVARCHAR(200)     NULL,
    SubmittedAt           DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    SubmitterEmail        NVARCHAR(320)     NULL,

    -- Raw text fields
    FirstName             NVARCHAR(100)     NULL,
    LastName              NVARCHAR(100)     NULL,
    Email                 NVARCHAR(320)     NULL,
    Phone                 NVARCHAR(50)      NULL,
    JobTitle              NVARCHAR(200)     NULL,
    OrganizationName      NVARCHAR(300)     NULL,    -- resolved to OrganizationID
    FunctionalArea        NVARCHAR(150)     NULL,
    InfluenceLevel        NVARCHAR(100)     NULL,
    RiskTolerance         NVARCHAR(100)     NULL,
    PersonalOrientation   NVARCHAR(100)     NULL,
    LinkedInURL           NVARCHAR(500)     NULL,
    Notes                 NVARCHAR(MAX)     NULL,

    -- Processing status
    ProcessedFlag         BIT               NOT NULL DEFAULT 0,
    ProcessedAt           DATETIME2(2)      NULL,
    ErrorMessage          NVARCHAR(MAX)     NULL,
    CreatedContactID      INT               NULL,

    CONSTRAINT PK_FormSub_ContactIntake PRIMARY KEY (SubmissionID)
);
GO

-- 5.03 Engagement intake staging
CREATE TABLE dbo.FormSubmissions_EngagementIntake (
    SubmissionID        INT IDENTITY(1,1) NOT NULL,
    FormResponseID      NVARCHAR(200)     NULL,
    SubmittedAt         DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    SubmitterEmail      NVARCHAR(320)     NULL,

    -- Raw text fields
    EventTitle          NVARCHAR(300)     NULL,
    EventDate           NVARCHAR(50)      NULL,     -- text; parsed to DATE
    Location            NVARCHAR(300)     NULL,
    OrganizationName    NVARCHAR(300)     NULL,
    PrimaryContactName  NVARCHAR(200)     NULL,     -- resolved to ContactID
    OutreachMotion      NVARCHAR(150)     NULL,
    EngagementType      NVARCHAR(150)     NULL,
    Description         NVARCHAR(MAX)     NULL,
    Outcome             NVARCHAR(MAX)     NULL,
    FollowUpDate        NVARCHAR(50)      NULL,
    Notes               NVARCHAR(MAX)     NULL,

    -- Processing status
    ProcessedFlag       BIT               NOT NULL DEFAULT 0,
    ProcessedAt         DATETIME2(2)      NULL,
    ErrorMessage        NVARCHAR(MAX)     NULL,
    CreatedEventID      INT               NULL,

    CONSTRAINT PK_FormSub_EngagementIntake PRIMARY KEY (SubmissionID)
);
GO

PRINT '01_create_tables.sql completed successfully.';
GO
