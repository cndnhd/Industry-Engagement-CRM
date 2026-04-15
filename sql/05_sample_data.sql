/*******************************************************************************
 * Industry Engagement CRM — Sample / Test Data
 * File: 05_sample_data.sql
 *
 * Inserts realistic sample records for development and testing.
 * Assumes 02_seed_lookups.sql has already run.
 *
 * WARNING: Do NOT run in production if you already have real data.
 ******************************************************************************/

SET NOCOUNT ON;
GO

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
SET IDENTITY_INSERT dbo.Organizations ON;

INSERT INTO dbo.Organizations
    (OrganizationID, OrganizationName, Website, HeadquartersCity, HeadquartersState, HeadquartersCountry,
     EmployeeCount, AnnualRevenue, Industry, Description,
     OrgTypeID, OwnershipTypeID, GrowthStageID, PriorityLevelID, ContractorRoleID, RelationshipLevelID)
VALUES
    (1, N'Northrop Grumman',    N'https://www.northropgrumman.com',  N'Falls Church',   N'VA', N'United States',
     90000,  36600000000.00, N'Aerospace & Defense',  N'Global defense technology company.',
     1, 1, 5, 1, 1, 1),

    (2, N'Boeing',              N'https://www.boeing.com',           N'Arlington',      N'VA', N'United States',
     150000, 66600000000.00, N'Aerospace & Defense',  N'Aerospace manufacturer and defense contractor.',
     1, 1, 5, 1, 1, 2),

    (3, N'Garmin',              N'https://www.garmin.com',           N'Olathe',         N'KS', N'United States',
     19500,  5230000000.00,  N'Technology / Navigation', N'GPS and wearable technology company.',
     1, 1, 5, 2, 7, 2),

    (4, N'Burns & McDonnell',   N'https://www.burnsmcd.com',         N'Kansas City',    N'MO', N'United States',
     12000,  6000000000.00,  N'Engineering & Construction', N'Employee-owned EPC firm.',
     1, 2, 4, 2, 2, 3),

    (5, N'Black & Veatch',      N'https://www.bv.com',               N'Overland Park',  N'KS', N'United States',
     10000,  4200000000.00,  N'Engineering & Construction', N'Infrastructure company.',
     1, 2, 5, 3, 2, 3),

    (6, N'Cerner (Oracle Health)', N'https://www.oracle.com/health', N'Kansas City',    N'MO', N'United States',
     28000, 5800000000.00,   N'Health IT',            N'Health information technology solutions.',
     1, 1, 5, 2, 7, 2),

    (7, N'MU Research Reactor', N'https://www.murr.missouri.edu',    N'Columbia',        N'MO', N'United States',
     120,   NULL,            N'Research / Nuclear',   N'University research reactor facility.',
     8, 3, 5, 1, 7, 1),

    (8, N'Acme Robotics',       N'https://www.acmerobotics.example', N'St. Louis',      N'MO', N'United States',
     45,    3500000.00,      N'Robotics / Autonomous', N'Early-stage autonomous systems startup.',
     5, 2, 2, 4, 5, 4),

    (9, N'Missouri Technology Corporation', N'https://www.missouritechnology.com', N'Columbia', N'MO', N'United States',
     25,    NULL,            N'Economic Development', N'State-funded tech-based economic development org.',
     2, 3, 5, 3, 7, 2),

    (10, N'Leidos',             N'https://www.leidos.com',           N'Reston',         N'VA', N'United States',
     47000, 15400000000.00,  N'IT / Defense',         N'Defense, aviation, IT, and biomedical research.',
     1, 1, 5, 2, 1, 3);

SET IDENTITY_INSERT dbo.Organizations OFF;
GO

-- ============================================================================
-- CONTACTS
-- ============================================================================
SET IDENTITY_INSERT dbo.Contacts ON;

INSERT INTO dbo.Contacts
    (ContactID, FirstName, LastName, Email, Phone, JobTitle, OrganizationID,
     FunctionalAreaID, InfluenceLevelID, RiskToleranceID, PersonalOrientationID)
VALUES
    (1,  N'Sarah',   N'Mitchell',  N'sarah.mitchell@northropgrumman.com',   N'703-555-0101', N'VP University Relations',         1, 2, 1, 2, 4),
    (2,  N'David',   N'Chen',      N'david.chen@northropgrumman.com',       N'703-555-0102', N'Senior Recruiter',                1, 3, 3, 3, 2),
    (3,  N'James',   N'Rodriguez', N'james.rodriguez@boeing.com',           N'314-555-0201', N'Director, Engineering Talent',    2, 1, 1, 3, 1),
    (4,  N'Emily',   N'Tanaka',    N'emily.tanaka@garmin.com',              N'913-555-0301', N'R&D Program Manager',             3, 2, 2, 2, 6),
    (5,  N'Robert',  N'Williams',  N'robert.williams@burnsmcd.com',         N'816-555-0401', N'Chief Innovation Officer',        4, 4, 1, 1, 4),
    (6,  N'Maria',   N'Gonzalez',  N'maria.gonzalez@bv.com',               N'913-555-0501', N'University Partnerships Manager', 5, 3, 2, 3, 1),
    (7,  N'Michael', N'Patel',     N'michael.patel@oracle.com',             N'816-555-0601', N'Director of Health Informatics',  6, 11, 1, 2, 3),
    (8,  N'Li',      N'Wei',       N'li.wei@murr.missouri.edu',             N'573-555-0701', N'Associate Director',              7, 2, 2, 3, 3),
    (9,  N'Jasmine', N'Carter',    N'jasmine.carter@acmerobotics.example',  N'314-555-0801', N'CEO / Co-Founder',                8, 4, 1, 1, 6),
    (10, N'Kevin',   N'Brown',     N'kevin.brown@leidos.com',               N'703-555-1001', N'STEM Outreach Lead',              10, 5, 2, 3, 5);

SET IDENTITY_INSERT dbo.Contacts OFF;
GO

-- ============================================================================
-- FACULTY
-- ============================================================================
SET IDENTITY_INSERT dbo.Faculty ON;

INSERT INTO dbo.Faculty
    (FacultyID, FirstName, LastName, Email, Phone, OfficeLocation, ResearchAreas, DepartmentID, FacultyTitleID)
VALUES
    (1, N'Amelia',    N'Harper',    N'harpera@missouri.edu',   N'573-882-0001', N'Lafferre Hall 210',  N'Cybersecurity, Network Defense',              3, 1),
    (2, N'Benjamin',  N'Clark',     N'clarkb@missouri.edu',    N'573-882-0002', N'E2437 EBE',          N'Autonomous Systems, Machine Learning',        3, 2),
    (3, N'Catherine', N'Davis',     N'davisc@missouri.edu',    N'573-882-0003', N'W1024 EBW',          N'Structural Engineering, Resilient Infra',     2, 1),
    (4, N'Derrick',   N'Evans',     N'evansd@missouri.edu',    N'573-882-0004', N'E1413 EBE',          N'Propulsion, Aerospace Structures',            6, 3),
    (5, N'Elena',     N'Foster',    N'fostere@missouri.edu',   N'573-882-0005', N'W2001 EBW',          N'Supply Chain, Lean Manufacturing',            5, 2),
    (6, N'Frank',     N'Green',     N'greenf@missouri.edu',    N'573-882-0006', N'Chemical Eng 305',   N'Biomaterials, Drug Delivery',                 1, 1),
    (7, N'Grace',     N'Hernandez', N'hernandezg@missouri.edu',N'573-882-0007', N'Lafferre Hall 340',  N'AI / NLP, Data Mining',                       3, 4),
    (8, N'Harold',    N'Iverson',   N'iversonh@missouri.edu',  N'573-882-0008', N'Naka Hall 200',      N'Thermodynamics, Energy Systems',              6, 17);

SET IDENTITY_INSERT dbo.Faculty OFF;
GO

-- ============================================================================
-- ENGAGEMENT EVENTS
-- ============================================================================
INSERT INTO dbo.EngagementEvents
    (EventTitle, EventDate, Location, Description, Outcome, FollowUpDate,
     OrganizationID, PrimaryContactID, OutreachMotionID, EngagementTypeID)
VALUES
    (N'Northrop Grumman Campus Visit — Spring 2026',
     '2026-03-10', N'Lafferre Hall, Mizzou', N'Full-day campus visit with lab tours and leadership meeting.',
     N'Agreed to sponsor senior capstone team.', '2026-04-15', 1, 1, 3, 6),

    (N'Boeing STEM Advisory Call',
     '2026-02-20', N'Virtual — Teams', N'Quarterly check-in with Boeing STEM outreach team.',
     N'Discussed expansion of summer intern pipeline.', '2026-05-20', 2, 3, 3, 2),

    (N'Garmin R&D Workshop',
     '2026-01-15', N'Garmin HQ, Olathe KS', N'Hands-on workshop on embedded systems with Garmin engineers.',
     N'Identified two joint research projects.', '2026-03-01', 3, 4, 4, 9),

    (N'Burns & McDonnell Career Fair',
     '2026-02-05', N'MU Student Center', N'Annual engineering career fair participation.',
     N'40+ student interviews conducted.', NULL, 4, 5, 8, 8),

    (N'Leidos Government Programs Briefing',
     '2026-03-25', N'Virtual — Teams', N'Briefing on Leidos DoD programs relevant to Mizzou research.',
     N'Exploring SBIR/STTR teaming arrangement.', '2026-04-30', 10, 10, 7, 2),

    (N'MU Research Reactor Industry Day',
     '2026-03-01', N'MURR Facility', N'Open house for prospective industry partners.',
     N'Three new NDAs in discussion.', '2026-04-10', 7, 8, 1, 5),

    (N'Acme Robotics Startup Pitch',
     '2025-11-12', N'Mizzou Innovation Center', N'Acme presented autonomous navigation tech to faculty panel.',
     N'Faculty expressed interest; no formal agreement yet.', '2026-01-15', 8, 9, 1, 1),

    (N'Oracle Health Guest Lecture',
     '2026-03-18', N'CS Auditorium', N'Michael Patel delivered guest lecture on health informatics.',
     N'Students highly engaged; follow-up internship discussion planned.', '2026-04-20', 6, 7, 6, 10);
GO

-- ============================================================================
-- JOURNEY LOG
-- ============================================================================
INSERT INTO dbo.JourneyLog
    (OrganizationID, JourneyStageID, TransitionDate, RelatedEngagementEventID, Notes)
VALUES
    (1, 4, '2025-06-01', NULL,  N'Long-standing active partnership.'),
    (1, 5, '2026-03-10', 1,     N'Elevated to strategic after Spring campus visit.'),
    (2, 3, '2025-09-15', NULL,  N'Engaged through advisory board.'),
    (3, 3, '2025-12-01', NULL,  N'Active engagement after R&D workshop.'),
    (8, 2, '2025-11-12', 7,     N'Initial contact through startup pitch event.'),
    (10, 2, '2026-03-25', 5,    N'Contacted via government programs briefing.');
GO

-- ============================================================================
-- OPPORTUNITIES
-- ============================================================================
INSERT INTO dbo.Opportunities
    (OpportunityName, OrganizationID, OpportunityTypeID, StageID, StatusID,
     EstimatedValue, ExpectedCloseDate, Description)
VALUES
    (N'Northrop Grumman Capstone Sponsorship FY27', 1, 3, 4, 1,
     25000.00, '2026-08-01', N'Sponsorship of two senior capstone teams in EECS.'),

    (N'Boeing Summer Intern Pipeline Expansion',    2, 4, 3, 1,
     NULL,     '2026-06-15', N'Double intern placements from 10 to 20 for Summer 2027.'),

    (N'Garmin Joint Research — Embedded AI',        3, 1, 2, 1,
     150000.00, '2026-09-30', N'Co-funded research on edge AI for navigation systems.'),

    (N'Burns & McDonnell Scholarship Endowment',    4, 2, 3, 1,
     500000.00, '2026-12-31', N'Endowed scholarship fund for civil engineering students.'),

    (N'Leidos SBIR Teaming — Cyber Range',          10, 1, 2, 1,
     75000.00,  '2026-07-15', N'SBIR Phase II teaming for cyber range simulation.'),

    (N'Acme Robotics Equipment Loan',               8, 7, 1, 1,
     10000.00,  NULL,         N'Loan of autonomous navigation test platform to ISE lab.');
GO

-- ============================================================================
-- ORGANIZATION SCORES
-- ============================================================================
INSERT INTO dbo.OrganizationScores
    (OrganizationID, ExecutiveEngagementScore, MultiTouchpointScore, FacultyAlignmentScore,
     GovernmentOverlayScore, AdvisoryBoardScore, PhilanthropicBehaviorScore, RegionalIdentityScore, Notes)
VALUES
    (1,  4.5, 4.0, 3.5, 4.0, 5.0, 3.0, 2.0, N'Top-tier defense partner.'),
    (2,  3.5, 3.0, 2.5, 3.0, 4.0, 2.0, 2.0, N'Strong but room to deepen faculty ties.'),
    (3,  3.0, 3.5, 2.0, 1.0, 2.0, 1.5, 4.0, N'Strong regional presence.'),
    (4,  3.0, 2.5, 2.0, 1.5, 3.0, 4.0, 5.0, N'High philanthropic and regional alignment.'),
    (5,  2.0, 2.0, 1.5, 1.0, 2.0, 2.0, 4.5, N'Regional presence strong; engagement developing.'),
    (6,  3.5, 3.0, 2.0, 1.5, 2.5, 2.0, 4.0, N'Health IT alignment with Mizzou strengths.'),
    (7,  4.0, 3.5, 5.0, 4.5, 3.0, 1.0, 5.0, N'Deep faculty alignment as internal facility.'),
    (8,  1.0, 1.0, 1.5, 0.5, 0.0, 0.0, 3.0, N'Early-stage startup; low engagement so far.'),
    (10, 2.5, 2.0, 1.5, 4.0, 1.0, 1.0, 1.5, N'Government overlay is primary strength.');
GO

-- ============================================================================
-- ORGANIZATION-FACULTY LINKAGES
-- ============================================================================
INSERT INTO dbo.OrganizationFacultyLinkages
    (OrganizationID, FacultyID, LinkageRoleID, StartDate, Notes)
VALUES
    (1,  1, 1, '2024-08-15', N'PI on Northrop Grumman cyber research grant.'),
    (1,  2, 6, '2025-01-10', N'Collaborating on autonomous systems project.'),
    (2,  4, 4, '2025-09-01', N'Capstone mentor for Boeing-sponsored team.'),
    (3,  2, 6, '2026-01-15', N'Joint research on embedded AI.'),
    (3,  7, 5, '2025-11-01', N'Guest speaker at Garmin internal tech talk.'),
    (4,  3, 3, '2023-06-01', N'Advisory board liaison for B&McD partnership.'),
    (7,  6, 1, '2022-01-01', N'PI on MURR biomaterials research.'),
    (7,  8, 9, '2024-06-01', N'Program director for MURR energy research track.'),
    (8,  2, 7, '2025-11-12', N'Advising Acme on autonomous navigation.'),
    (10, 1, 6, '2026-03-25', N'Exploring Leidos cyber range collaboration.');
GO

-- ============================================================================
-- ORGANIZATION GOVERNMENT ALIGNMENTS
-- ============================================================================
INSERT INTO dbo.OrganizationGovernmentAlignments
    (OrganizationID, GovernmentAlignmentTypeID, Notes)
VALUES
    (1,  1,  N'Active DoD STEM / MEEP participant.'),
    (1,  8,  N'Major defense industrial base contractor.'),
    (2,  8,  N'Defense industrial base — aviation.'),
    (2,  1,  N'DoD STEM engagement.'),
    (7,  3,  N'DOE lab collaboration via MURR.'),
    (7,  4,  N'NIH-funded research programs.'),
    (10, 8,  N'Defense IT and intelligence systems.'),
    (10, 9,  N'IC community work.'),
    (10, 5,  N'Active SBIR/STTR portfolio.'),
    (8,  5,  N'Exploring SBIR Phase I.'),
    (9,  6,  N'Missouri state economic development programs.');
GO

-- ============================================================================
-- ORGANIZATION STRATEGIC TAGS
-- ============================================================================
INSERT INTO dbo.OrganizationStrategicTags
    (OrganizationID, StrategicTagID, Notes)
VALUES
    (1,  1,  NULL),   -- Northrop: Cybersecurity
    (1,  3,  NULL),   -- Northrop: Autonomous Systems
    (2,  9,  NULL),   -- Boeing: Space / Aerospace
    (2,  4,  NULL),   -- Boeing: Advanced Manufacturing
    (3,  2,  NULL),   -- Garmin: AI / ML
    (3, 11,  NULL),   -- Garmin: Data Science
    (4,  5,  NULL),   -- B&McD: Energy / Sustainability
    (4, 14,  NULL),   -- B&McD: Workforce Development
    (6, 13,  NULL),   -- Oracle Health: Health Technology
    (7,  5,  NULL),   -- MURR: Energy
    (7,  6,  NULL),   -- MURR: Biotech
    (8,  3,  NULL),   -- Acme: Autonomous Systems
    (8,  2,  NULL),   -- Acme: AI / ML
    (10, 1,  NULL),   -- Leidos: Cybersecurity
    (10, 2,  NULL);   -- Leidos: AI / ML
GO

-- ============================================================================
-- STAGING TABLE SAMPLE (to test processing flow)
-- ============================================================================
INSERT INTO dbo.FormSubmissions_OrganizationIntake
    (FormResponseID, SubmitterEmail, OrganizationName, Website, HeadquartersCity,
     HeadquartersState, Industry, OrgType, OwnershipType, GrowthStage,
     PriorityLevel, Description)
VALUES
    (N'FORM-ORG-001', N'admin@missouri.edu', N'SpaceX', N'https://www.spacex.com',
     N'Hawthorne', N'CA', N'Aerospace', N'Corporation', N'Private', N'Growth',
     N'Tier 2 — High', N'Rocket and spacecraft manufacturer.');
GO

INSERT INTO dbo.FormSubmissions_ContactIntake
    (FormResponseID, SubmitterEmail, FirstName, LastName, Email, JobTitle,
     OrganizationName, FunctionalArea, InfluenceLevel)
VALUES
    (N'FORM-CON-001', N'admin@missouri.edu', N'Elon', N'TestContact',
     N'elon.test@spacex.example', N'Head of University Programs',
     N'SpaceX', N'Engineering', N'Strong Influencer');
GO

INSERT INTO dbo.FormSubmissions_EngagementIntake
    (FormResponseID, SubmitterEmail, EventTitle, EventDate, OrganizationName,
     OutreachMotion, EngagementType, Description)
VALUES
    (N'FORM-ENG-001', N'admin@missouri.edu', N'SpaceX Exploratory Call',
     N'2026-04-15', N'SpaceX', N'Cold Outreach', N'Phone Call',
     N'Initial exploratory call with SpaceX university relations.');
GO

PRINT '05_sample_data.sql completed successfully.';
GO
