/*******************************************************************************
 * Industry Engagement CRM — Power BI-Friendly Views
 * File: 04_views.sql
 *
 * Denormalized views that resolve all FK IDs to human-readable names.
 * Designed for:
 *   - Power BI DirectQuery / Import
 *   - Power Apps read-only galleries (where delegation permits)
 *   - Ad-hoc reporting in SSMS / Azure Data Studio
 ******************************************************************************/

SET NOCOUNT ON;
GO

-- ============================================================================
-- vw_OrganizationsDisplay
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_OrganizationsDisplay
AS
SELECT
    o.OrganizationID,
    o.OrganizationName,
    o.Website,
    o.HeadquartersCity,
    o.HeadquartersState,
    o.HeadquartersCountry,
    o.EmployeeCount,
    o.AnnualRevenue,
    o.Industry,
    o.Description,
    o.Notes,
    o.IsActive,
    o.CreatedAt,
    o.UpdatedAt,

    -- Resolved lookups
    ot.OrgTypeName,
    ow.OwnershipTypeName,
    gs.GrowthStageName,
    pl.PriorityLevelName,
    cr.ContractorRoleName,
    rl.RelationshipLevelName,

    -- Score
    sc.OverallPartnershipScore,
    sc.ExecutiveEngagementScore,
    sc.MultiTouchpointScore,
    sc.FacultyAlignmentScore,
    sc.GovernmentOverlayScore,
    sc.AdvisoryBoardScore,
    sc.PhilanthropicBehaviorScore,
    sc.RegionalIdentityScore,

    -- Aggregates
    (SELECT COUNT(*) FROM dbo.Contacts c WHERE c.OrganizationID = o.OrganizationID AND c.IsActive = 1)
        AS ActiveContactCount,
    (SELECT COUNT(*) FROM dbo.EngagementEvents ee WHERE ee.OrganizationID = o.OrganizationID)
        AS EngagementEventCount,
    (SELECT MAX(ee.EventDate) FROM dbo.EngagementEvents ee WHERE ee.OrganizationID = o.OrganizationID)
        AS LastEngagementDate,
    (SELECT COUNT(*) FROM dbo.Opportunities op WHERE op.OrganizationID = o.OrganizationID)
        AS OpportunityCount,
    (SELECT COUNT(*) FROM dbo.OrganizationFacultyLinkages fl WHERE fl.OrganizationID = o.OrganizationID)
        AS FacultyLinkageCount

FROM dbo.Organizations o
LEFT JOIN dbo.OrgTypes            ot ON o.OrgTypeID           = ot.OrgTypeID
LEFT JOIN dbo.OwnershipTypes      ow ON o.OwnershipTypeID     = ow.OwnershipTypeID
LEFT JOIN dbo.GrowthStages        gs ON o.GrowthStageID       = gs.GrowthStageID
LEFT JOIN dbo.PriorityLevels      pl ON o.PriorityLevelID     = pl.PriorityLevelID
LEFT JOIN dbo.ContractorRoles     cr ON o.ContractorRoleID    = cr.ContractorRoleID
LEFT JOIN dbo.RelationshipLevels  rl ON o.RelationshipLevelID = rl.RelationshipLevelID
LEFT JOIN dbo.OrganizationScores  sc ON o.OrganizationID      = sc.OrganizationID;
GO

-- ============================================================================
-- vw_ContactsDisplay
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_ContactsDisplay
AS
SELECT
    c.ContactID,
    c.FirstName,
    c.LastName,
    c.FirstName + N' ' + c.LastName   AS FullName,
    c.Email,
    c.Phone,
    c.JobTitle,
    c.LinkedInURL,
    c.Notes,
    c.IsActive,
    c.CreatedAt,
    c.UpdatedAt,

    -- Parent organization
    c.OrganizationID,
    o.OrganizationName,

    -- Resolved lookups
    fa.FunctionalAreaName,
    il.InfluenceLevelName,
    rt.RiskToleranceName,
    po.PersonalOrientationName

FROM dbo.Contacts c
LEFT JOIN dbo.Organizations        o  ON c.OrganizationID        = o.OrganizationID
LEFT JOIN dbo.FunctionalAreas      fa ON c.FunctionalAreaID      = fa.FunctionalAreaID
LEFT JOIN dbo.InfluenceLevels      il ON c.InfluenceLevelID      = il.InfluenceLevelID
LEFT JOIN dbo.RiskToleranceLevels  rt ON c.RiskToleranceID       = rt.RiskToleranceID
LEFT JOIN dbo.PersonalOrientations po ON c.PersonalOrientationID = po.PersonalOrientationID;
GO

-- ============================================================================
-- vw_EngagementEventsDisplay
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_EngagementEventsDisplay
AS
SELECT
    ee.EngagementEventID,
    ee.EventTitle,
    ee.EventDate,
    ee.EventEndDate,
    ee.Location,
    ee.Description,
    ee.Outcome,
    ee.FollowUpDate,
    ee.FollowUpNotes,
    ee.Notes,
    ee.CreatedAt,
    ee.UpdatedAt,

    -- Parent organization
    ee.OrganizationID,
    o.OrganizationName,

    -- Primary contact
    ee.PrimaryContactID,
    pc.FirstName + N' ' + pc.LastName AS PrimaryContactName,
    pc.Email                          AS PrimaryContactEmail,

    -- Resolved lookups
    om.OutreachMotionName,
    et.EngagementTypeName,

    -- Stale flag: follow-up is past due
    CASE
        WHEN ee.FollowUpDate IS NOT NULL AND ee.FollowUpDate < CAST(SYSUTCDATETIME() AS DATE)
        THEN 1 ELSE 0
    END AS IsFollowUpOverdue

FROM dbo.EngagementEvents ee
LEFT JOIN dbo.Organizations   o  ON ee.OrganizationID   = o.OrganizationID
LEFT JOIN dbo.Contacts        pc ON ee.PrimaryContactID  = pc.ContactID
LEFT JOIN dbo.OutreachMotions om ON ee.OutreachMotionID  = om.OutreachMotionID
LEFT JOIN dbo.EngagementTypes et ON ee.EngagementTypeID  = et.EngagementTypeID;
GO

-- ============================================================================
-- vw_FacultyDisplay
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_FacultyDisplay
AS
SELECT
    f.FacultyID,
    f.FirstName,
    f.LastName,
    f.FirstName + N' ' + f.LastName AS FullName,
    f.Email,
    f.Phone,
    f.OfficeLocation,
    f.ResearchAreas,
    f.Notes,
    f.IsActive,
    f.CreatedAt,
    f.UpdatedAt,

    -- Resolved lookups
    d.DepartmentName,
    ft.FacultyTitleName,

    -- Linkage count
    (SELECT COUNT(*) FROM dbo.OrganizationFacultyLinkages fl WHERE fl.FacultyID = f.FacultyID)
        AS OrganizationLinkageCount

FROM dbo.Faculty f
LEFT JOIN dbo.Departments   d  ON f.DepartmentID  = d.DepartmentID
LEFT JOIN dbo.FacultyTitles ft ON f.FacultyTitleID = ft.FacultyTitleID;
GO

-- ============================================================================
-- vw_OpportunitiesDisplay
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_OpportunitiesDisplay
AS
SELECT
    op.OpportunityID,
    op.OpportunityName,
    op.EstimatedValue,
    op.ExpectedCloseDate,
    op.Description,
    op.Notes,
    op.CreatedAt,
    op.UpdatedAt,

    -- Parent organization
    op.OrganizationID,
    o.OrganizationName,

    -- Resolved lookups
    oty.OpportunityTypeName,
    os.StageName        AS OpportunityStageName,
    ost.StatusName      AS OpportunityStatusName,

    -- Days until close
    CASE
        WHEN op.ExpectedCloseDate IS NOT NULL
        THEN DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), op.ExpectedCloseDate)
        ELSE NULL
    END AS DaysUntilClose

FROM dbo.Opportunities op
LEFT JOIN dbo.Organizations       o   ON op.OrganizationID    = o.OrganizationID
LEFT JOIN dbo.OpportunityTypes    oty ON op.OpportunityTypeID = oty.OpportunityTypeID
LEFT JOIN dbo.OpportunityStages   os  ON op.StageID           = os.StageID
LEFT JOIN dbo.OpportunityStatuses ost ON op.StatusID          = ost.StatusID;
GO

-- ============================================================================
-- vw_JourneyLogDisplay (bonus — useful for timeline/funnel reporting)
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_JourneyLogDisplay
AS
SELECT
    jl.JourneyLogID,
    jl.TransitionDate,
    jl.Notes,
    jl.CreatedAt,

    -- Parent organization
    jl.OrganizationID,
    o.OrganizationName,

    -- Journey stage
    js.JourneyStageName,
    js.SortOrder AS JourneyStageSortOrder,

    -- Related engagement
    jl.RelatedEngagementEventID,
    ee.EventTitle AS RelatedEventTitle

FROM dbo.JourneyLog jl
LEFT JOIN dbo.Organizations    o  ON jl.OrganizationID           = o.OrganizationID
LEFT JOIN dbo.JourneyStages    js ON jl.JourneyStageID           = js.JourneyStageID
LEFT JOIN dbo.EngagementEvents ee ON jl.RelatedEngagementEventID = ee.EngagementEventID;
GO

-- ============================================================================
-- vw_OrganizationFacultyLinkagesDisplay (bonus — useful for network analysis)
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_OrganizationFacultyLinkagesDisplay
AS
SELECT
    fl.OrganizationFacultyLinkageID,
    fl.StartDate,
    fl.EndDate,
    fl.Notes,
    fl.CreatedAt,

    -- Organization
    fl.OrganizationID,
    o.OrganizationName,

    -- Faculty
    fl.FacultyID,
    f.FirstName + N' ' + f.LastName AS FacultyFullName,
    d.DepartmentName,
    ft.FacultyTitleName,

    -- Linkage role
    lr.LinkageRoleName

FROM dbo.OrganizationFacultyLinkages fl
LEFT JOIN dbo.Organizations  o  ON fl.OrganizationID = o.OrganizationID
LEFT JOIN dbo.Faculty        f  ON fl.FacultyID      = f.FacultyID
LEFT JOIN dbo.Departments    d  ON f.DepartmentID    = d.DepartmentID
LEFT JOIN dbo.FacultyTitles  ft ON f.FacultyTitleID  = ft.FacultyTitleID
LEFT JOIN dbo.LinkageRoles   lr ON fl.LinkageRoleID  = lr.LinkageRoleID;
GO

-- ============================================================================
-- vw_StagingErrors (admin view for monitoring Form-intake failures)
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_StagingErrors
AS
SELECT 'Organization' AS IntakeType, SubmissionID, SubmittedAt, SubmitterEmail,
       OrganizationName AS PrimaryIdentifier, ErrorMessage, ProcessedAt
FROM dbo.FormSubmissions_OrganizationIntake
WHERE ProcessedFlag = 1 AND ErrorMessage IS NOT NULL

UNION ALL

SELECT 'Contact', SubmissionID, SubmittedAt, SubmitterEmail,
       FirstName + N' ' + LastName, ErrorMessage, ProcessedAt
FROM dbo.FormSubmissions_ContactIntake
WHERE ProcessedFlag = 1 AND ErrorMessage IS NOT NULL

UNION ALL

SELECT 'Engagement', SubmissionID, SubmittedAt, SubmitterEmail,
       EventTitle, ErrorMessage, ProcessedAt
FROM dbo.FormSubmissions_EngagementIntake
WHERE ProcessedFlag = 1 AND ErrorMessage IS NOT NULL;
GO

PRINT '04_views.sql completed successfully.';
GO
