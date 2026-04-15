/*******************************************************************************
 * Industry Engagement CRM — Indexes & Supplemental Constraints
 * File: 03_indexes_constraints.sql
 *
 * Creates non-clustered indexes optimized for:
 *   - Power Apps delegation (filters, sorts on key columns)
 *   - Power BI query performance (JOIN acceleration)
 *   - Common search patterns (name lookups, date ranges)
 *
 * Run after 01_create_tables.sql and 02_seed_lookups.sql.
 ******************************************************************************/

SET NOCOUNT ON;
GO

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_Organizations_Name
    ON dbo.Organizations (OrganizationName);
GO

CREATE NONCLUSTERED INDEX IX_Organizations_OrgType
    ON dbo.Organizations (OrgTypeID)
    INCLUDE (OrganizationName, PriorityLevelID, RelationshipLevelID);
GO

CREATE NONCLUSTERED INDEX IX_Organizations_Priority
    ON dbo.Organizations (PriorityLevelID)
    INCLUDE (OrganizationName, RelationshipLevelID);
GO

CREATE NONCLUSTERED INDEX IX_Organizations_RelationshipLevel
    ON dbo.Organizations (RelationshipLevelID)
    INCLUDE (OrganizationName);
GO

CREATE NONCLUSTERED INDEX IX_Organizations_IsActive
    ON dbo.Organizations (IsActive)
    INCLUDE (OrganizationName, OrgTypeID, PriorityLevelID)
    WHERE IsActive = 1;
GO

CREATE NONCLUSTERED INDEX IX_Organizations_State
    ON dbo.Organizations (HeadquartersState)
    INCLUDE (OrganizationName, HeadquartersCity);
GO

-- ============================================================================
-- CONTACTS
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_Contacts_Organization
    ON dbo.Contacts (OrganizationID)
    INCLUDE (FirstName, LastName, Email, JobTitle);
GO

CREATE NONCLUSTERED INDEX IX_Contacts_LastName
    ON dbo.Contacts (LastName, FirstName)
    INCLUDE (Email, OrganizationID);
GO

CREATE NONCLUSTERED INDEX IX_Contacts_Email
    ON dbo.Contacts (Email)
    WHERE Email IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_Contacts_IsActive
    ON dbo.Contacts (IsActive)
    INCLUDE (FirstName, LastName, OrganizationID)
    WHERE IsActive = 1;
GO

-- ============================================================================
-- FACULTY
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_Faculty_Department
    ON dbo.Faculty (DepartmentID)
    INCLUDE (FirstName, LastName, FacultyTitleID);
GO

CREATE NONCLUSTERED INDEX IX_Faculty_LastName
    ON dbo.Faculty (LastName, FirstName)
    INCLUDE (DepartmentID, FacultyTitleID);
GO

CREATE NONCLUSTERED INDEX IX_Faculty_IsActive
    ON dbo.Faculty (IsActive)
    INCLUDE (FirstName, LastName, DepartmentID)
    WHERE IsActive = 1;
GO

-- ============================================================================
-- ENGAGEMENT EVENTS
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_EngagementEvents_Organization
    ON dbo.EngagementEvents (OrganizationID)
    INCLUDE (EventTitle, EventDate, EngagementTypeID);
GO

CREATE NONCLUSTERED INDEX IX_EngagementEvents_Date
    ON dbo.EngagementEvents (EventDate DESC)
    INCLUDE (OrganizationID, EventTitle, EngagementTypeID);
GO

CREATE NONCLUSTERED INDEX IX_EngagementEvents_FollowUp
    ON dbo.EngagementEvents (FollowUpDate)
    INCLUDE (OrganizationID, EventTitle, PrimaryContactID)
    WHERE FollowUpDate IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_EngagementEvents_PrimaryContact
    ON dbo.EngagementEvents (PrimaryContactID)
    INCLUDE (OrganizationID, EventTitle, EventDate);
GO

-- ============================================================================
-- JOURNEY LOG
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_JourneyLog_Organization
    ON dbo.JourneyLog (OrganizationID)
    INCLUDE (JourneyStageID, TransitionDate);
GO

CREATE NONCLUSTERED INDEX IX_JourneyLog_TransitionDate
    ON dbo.JourneyLog (TransitionDate DESC)
    INCLUDE (OrganizationID, JourneyStageID);
GO

-- ============================================================================
-- OPPORTUNITIES
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_Opportunities_Organization
    ON dbo.Opportunities (OrganizationID)
    INCLUDE (OpportunityName, StageID, StatusID, EstimatedValue);
GO

CREATE NONCLUSTERED INDEX IX_Opportunities_Stage
    ON dbo.Opportunities (StageID)
    INCLUDE (OrganizationID, OpportunityName, StatusID);
GO

CREATE NONCLUSTERED INDEX IX_Opportunities_Status
    ON dbo.Opportunities (StatusID)
    INCLUDE (OrganizationID, OpportunityName, StageID);
GO

CREATE NONCLUSTERED INDEX IX_Opportunities_CloseDate
    ON dbo.Opportunities (ExpectedCloseDate)
    INCLUDE (OrganizationID, OpportunityName, EstimatedValue)
    WHERE ExpectedCloseDate IS NOT NULL;
GO

-- ============================================================================
-- ORGANIZATION SCORES
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_OrgScores_OverallScore
    ON dbo.OrganizationScores (OverallPartnershipScore DESC)
    INCLUDE (OrganizationID);
GO

-- ============================================================================
-- BRIDGE TABLES
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_OrgFacultyLinkages_Faculty
    ON dbo.OrganizationFacultyLinkages (FacultyID)
    INCLUDE (OrganizationID, LinkageRoleID);
GO

CREATE NONCLUSTERED INDEX IX_OrgGovAlignments_Type
    ON dbo.OrganizationGovernmentAlignments (GovernmentAlignmentTypeID)
    INCLUDE (OrganizationID);
GO

CREATE NONCLUSTERED INDEX IX_OrgStrategicTags_Tag
    ON dbo.OrganizationStrategicTags (StrategicTagID)
    INCLUDE (OrganizationID);
GO

-- ============================================================================
-- STAGING TABLES — indexes for unprocessed-row queries
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_FormSub_OrgIntake_Unprocessed
    ON dbo.FormSubmissions_OrganizationIntake (ProcessedFlag)
    INCLUDE (SubmissionID, OrganizationName, SubmittedAt)
    WHERE ProcessedFlag = 0;
GO

CREATE NONCLUSTERED INDEX IX_FormSub_ContactIntake_Unprocessed
    ON dbo.FormSubmissions_ContactIntake (ProcessedFlag)
    INCLUDE (SubmissionID, OrganizationName, FirstName, LastName, SubmittedAt)
    WHERE ProcessedFlag = 0;
GO

CREATE NONCLUSTERED INDEX IX_FormSub_EngagementIntake_Unprocessed
    ON dbo.FormSubmissions_EngagementIntake (ProcessedFlag)
    INCLUDE (SubmissionID, OrganizationName, EventTitle, SubmittedAt)
    WHERE ProcessedFlag = 0;
GO

PRINT '03_indexes_constraints.sql completed successfully.';
GO
