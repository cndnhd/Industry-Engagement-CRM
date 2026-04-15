/*******************************************************************************
 * Industry Engagement CRM — Lookup Seed Data
 * File: 02_seed_lookups.sql
 *
 * Populates all lookup/reference tables with production-ready seed values.
 * Safe to re-run: uses MERGE to avoid duplicates.
 ******************************************************************************/

SET NOCOUNT ON;
GO

-- ============================================================================
-- Departments
-- ============================================================================
MERGE dbo.Departments AS tgt
USING (VALUES
    (N'Chemical and Biomedical'),
    (N'Civil and Environmental'),
    (N'Electrical Engineering and Computer Science'),
    (N'Engineering and Information Technology'),
    (N'Industrial and Systems Engineering'),
    (N'Mechanical and Aerospace Engineering'),
    (N'Naval Science'),
    (N'Other')
) AS src (DepartmentName)
ON tgt.DepartmentName = src.DepartmentName
WHEN NOT MATCHED THEN INSERT (DepartmentName) VALUES (src.DepartmentName);
GO

-- ============================================================================
-- FacultyTitles
-- ============================================================================
MERGE dbo.FacultyTitles AS tgt
USING (VALUES
    (N'Professor'),
    (N'Associate Professor'),
    (N'Assistant Professor'),
    (N'Teaching Professor'),
    (N'Associate Teaching Professor'),
    (N'Assistant Teaching Professor'),
    (N'Adjunct Professor'),
    (N'Clinical Professor'),
    (N'Emeritus Professor'),
    (N'Instructor'),
    (N'Lecturer'),
    (N'Senior Lecturer'),
    (N'Research Professor'),
    (N'Research Associate Professor'),
    (N'Research Assistant Professor'),
    (N'Professor of Practice'),
    (N'Chair'),
    (N'Director'),
    (N'Dean'),
    (N'Other')
) AS src (FacultyTitleName)
ON tgt.FacultyTitleName = src.FacultyTitleName
WHEN NOT MATCHED THEN INSERT (FacultyTitleName) VALUES (src.FacultyTitleName);
GO

-- ============================================================================
-- ContractorRoles
-- ============================================================================
MERGE dbo.ContractorRoles AS tgt
USING (VALUES
    (N'Prime Contractor'),
    (N'Sub-Contractor'),
    (N'Consultant'),
    (N'Teaming Partner'),
    (N'SBIR/STTR Partner'),
    (N'Vendor'),
    (N'Not Applicable'),
    (N'Other')
) AS src (ContractorRoleName)
ON tgt.ContractorRoleName = src.ContractorRoleName
WHEN NOT MATCHED THEN INSERT (ContractorRoleName) VALUES (src.ContractorRoleName);
GO

-- ============================================================================
-- FunctionalAreas
-- ============================================================================
MERGE dbo.FunctionalAreas AS tgt
USING (VALUES
    (N'Engineering'),
    (N'Research & Development'),
    (N'Human Resources / Talent'),
    (N'Executive Leadership'),
    (N'Government Relations'),
    (N'Corporate Social Responsibility'),
    (N'Procurement / Supply Chain'),
    (N'Finance'),
    (N'Marketing / Communications'),
    (N'Legal / Compliance'),
    (N'Information Technology'),
    (N'Operations'),
    (N'Sales / Business Development'),
    (N'Product Management'),
    (N'Other')
) AS src (FunctionalAreaName)
ON tgt.FunctionalAreaName = src.FunctionalAreaName
WHEN NOT MATCHED THEN INSERT (FunctionalAreaName) VALUES (src.FunctionalAreaName);
GO

-- ============================================================================
-- InfluenceLevels
-- ============================================================================
MERGE dbo.InfluenceLevels AS tgt
USING (VALUES
    (N'Decision Maker', 1),
    (N'Strong Influencer', 2),
    (N'Moderate Influencer', 3),
    (N'Limited Influence', 4),
    (N'Unknown', 5)
) AS src (InfluenceLevelName, SortOrder)
ON tgt.InfluenceLevelName = src.InfluenceLevelName
WHEN NOT MATCHED THEN INSERT (InfluenceLevelName, SortOrder) VALUES (src.InfluenceLevelName, src.SortOrder);
GO

-- ============================================================================
-- RiskToleranceLevels
-- ============================================================================
MERGE dbo.RiskToleranceLevels AS tgt
USING (VALUES
    (N'Very High', 1),
    (N'High', 2),
    (N'Moderate', 3),
    (N'Low', 4),
    (N'Very Low', 5),
    (N'Unknown', 6)
) AS src (RiskToleranceName, SortOrder)
ON tgt.RiskToleranceName = src.RiskToleranceName
WHEN NOT MATCHED THEN INSERT (RiskToleranceName, SortOrder) VALUES (src.RiskToleranceName, src.SortOrder);
GO

-- ============================================================================
-- PersonalOrientations
-- ============================================================================
MERGE dbo.PersonalOrientations AS tgt
USING (VALUES
    (N'Relationship-Driven'),
    (N'Task-Oriented'),
    (N'Data-Driven / Analytical'),
    (N'Visionary / Strategic'),
    (N'Community-Focused'),
    (N'Innovation-Focused'),
    (N'Unknown')
) AS src (PersonalOrientationName)
ON tgt.PersonalOrientationName = src.PersonalOrientationName
WHEN NOT MATCHED THEN INSERT (PersonalOrientationName) VALUES (src.PersonalOrientationName);
GO

-- ============================================================================
-- OrgTypes
-- ============================================================================
MERGE dbo.OrgTypes AS tgt
USING (VALUES
    (N'Corporation'),
    (N'Non-Profit'),
    (N'Government Agency'),
    (N'Government Contractor'),
    (N'Startup'),
    (N'Small Business'),
    (N'University / Academic'),
    (N'Research Lab'),
    (N'Foundation'),
    (N'Trade Association'),
    (N'Other')
) AS src (OrgTypeName)
ON tgt.OrgTypeName = src.OrgTypeName
WHEN NOT MATCHED THEN INSERT (OrgTypeName) VALUES (src.OrgTypeName);
GO

-- ============================================================================
-- OwnershipTypes
-- ============================================================================
MERGE dbo.OwnershipTypes AS tgt
USING (VALUES
    (N'Public'),
    (N'Private'),
    (N'Government'),
    (N'Non-Profit'),
    (N'Cooperative'),
    (N'Other')
) AS src (OwnershipTypeName)
ON tgt.OwnershipTypeName = src.OwnershipTypeName
WHEN NOT MATCHED THEN INSERT (OwnershipTypeName) VALUES (src.OwnershipTypeName);
GO

-- ============================================================================
-- GrowthStages
-- ============================================================================
MERGE dbo.GrowthStages AS tgt
USING (VALUES
    (N'Startup / Seed', 1),
    (N'Early Stage', 2),
    (N'Growth', 3),
    (N'Expansion', 4),
    (N'Mature', 5),
    (N'Decline / Restructuring', 6)
) AS src (GrowthStageName, SortOrder)
ON tgt.GrowthStageName = src.GrowthStageName
WHEN NOT MATCHED THEN INSERT (GrowthStageName, SortOrder) VALUES (src.GrowthStageName, src.SortOrder);
GO

-- ============================================================================
-- PriorityLevels
-- ============================================================================
MERGE dbo.PriorityLevels AS tgt
USING (VALUES
    (N'Tier 1 — Strategic', 1),
    (N'Tier 2 — High', 2),
    (N'Tier 3 — Medium', 3),
    (N'Tier 4 — Low', 4),
    (N'Tier 5 — Inactive / Watch', 5)
) AS src (PriorityLevelName, SortOrder)
ON tgt.PriorityLevelName = src.PriorityLevelName
WHEN NOT MATCHED THEN INSERT (PriorityLevelName, SortOrder) VALUES (src.PriorityLevelName, src.SortOrder);
GO

-- ============================================================================
-- RelationshipLevels
-- ============================================================================
MERGE dbo.RelationshipLevels AS tgt
USING (VALUES
    (N'Strategic Partner', 1),
    (N'Active Relationship', 2),
    (N'Developing', 3),
    (N'Prospect', 4),
    (N'Dormant', 5),
    (N'Lost / Inactive', 6)
) AS src (RelationshipLevelName, SortOrder)
ON tgt.RelationshipLevelName = src.RelationshipLevelName
WHEN NOT MATCHED THEN INSERT (RelationshipLevelName, SortOrder) VALUES (src.RelationshipLevelName, src.SortOrder);
GO

-- ============================================================================
-- OutreachMotions
-- ============================================================================
MERGE dbo.OutreachMotions AS tgt
USING (VALUES
    (N'Inbound Inquiry'),
    (N'Cold Outreach'),
    (N'Warm Introduction'),
    (N'Conference / Event'),
    (N'Alumni Connection'),
    (N'Faculty Referral'),
    (N'Government Program'),
    (N'Career Fair'),
    (N'Advisory Board Meeting'),
    (N'Other')
) AS src (OutreachMotionName)
ON tgt.OutreachMotionName = src.OutreachMotionName
WHEN NOT MATCHED THEN INSERT (OutreachMotionName) VALUES (src.OutreachMotionName);
GO

-- ============================================================================
-- EngagementTypes
-- ============================================================================
MERGE dbo.EngagementTypes AS tgt
USING (VALUES
    (N'In-Person Meeting'),
    (N'Virtual Meeting'),
    (N'Phone Call'),
    (N'Email Exchange'),
    (N'Site Visit'),
    (N'Campus Visit'),
    (N'Conference'),
    (N'Career Fair'),
    (N'Workshop'),
    (N'Guest Lecture'),
    (N'Advisory Board'),
    (N'Sponsored Research Discussion'),
    (N'Philanthropy Discussion'),
    (N'MOU / Agreement Signing'),
    (N'Other')
) AS src (EngagementTypeName)
ON tgt.EngagementTypeName = src.EngagementTypeName
WHEN NOT MATCHED THEN INSERT (EngagementTypeName) VALUES (src.EngagementTypeName);
GO

-- ============================================================================
-- JourneyStages
-- ============================================================================
MERGE dbo.JourneyStages AS tgt
USING (VALUES
    (N'Identified', 1),
    (N'Contacted', 2),
    (N'Engaged', 3),
    (N'Active Partnership', 4),
    (N'Strategic Alliance', 5),
    (N'Dormant', 6),
    (N'Lost', 7)
) AS src (JourneyStageName, SortOrder)
ON tgt.JourneyStageName = src.JourneyStageName
WHEN NOT MATCHED THEN INSERT (JourneyStageName, SortOrder) VALUES (src.JourneyStageName, src.SortOrder);
GO

-- ============================================================================
-- OpportunityTypes
-- ============================================================================
MERGE dbo.OpportunityTypes AS tgt
USING (VALUES
    (N'Sponsored Research'),
    (N'Philanthropy / Gift'),
    (N'Capstone Project'),
    (N'Internship / Co-op Program'),
    (N'Recruitment Partnership'),
    (N'Advisory Board Seat'),
    (N'Equipment Donation'),
    (N'Licensing / IP'),
    (N'Joint Venture'),
    (N'Other')
) AS src (OpportunityTypeName)
ON tgt.OpportunityTypeName = src.OpportunityTypeName
WHEN NOT MATCHED THEN INSERT (OpportunityTypeName) VALUES (src.OpportunityTypeName);
GO

-- ============================================================================
-- OpportunityStages
-- ============================================================================
MERGE dbo.OpportunityStages AS tgt
USING (VALUES
    (N'Identified', 1),
    (N'Qualification', 2),
    (N'Proposal / Negotiation', 3),
    (N'Verbal Commitment', 4),
    (N'Closed Won', 5),
    (N'Closed Lost', 6),
    (N'On Hold', 7)
) AS src (StageName, SortOrder)
ON tgt.StageName = src.StageName
WHEN NOT MATCHED THEN INSERT (StageName, SortOrder) VALUES (src.StageName, src.SortOrder);
GO

-- ============================================================================
-- OpportunityStatuses
-- ============================================================================
MERGE dbo.OpportunityStatuses AS tgt
USING (VALUES
    (N'Active'),
    (N'Paused'),
    (N'Won'),
    (N'Lost'),
    (N'Cancelled')
) AS src (StatusName)
ON tgt.StatusName = src.StatusName
WHEN NOT MATCHED THEN INSERT (StatusName) VALUES (src.StatusName);
GO

-- ============================================================================
-- GovernmentAlignmentTypes
-- ============================================================================
MERGE dbo.GovernmentAlignmentTypes AS tgt
USING (VALUES
    (N'DoD STEM / MEEP'),
    (N'NSF Partnership'),
    (N'DOE Lab Collaboration'),
    (N'NIH Research Affiliation'),
    (N'SBIR / STTR'),
    (N'State Economic Development'),
    (N'Federal Earmark / Appropriation'),
    (N'Defense Industrial Base'),
    (N'Intelligence Community'),
    (N'NASA Collaboration'),
    (N'Other Federal'),
    (N'Other State / Local')
) AS src (GovernmentAlignmentTypeName)
ON tgt.GovernmentAlignmentTypeName = src.GovernmentAlignmentTypeName
WHEN NOT MATCHED THEN INSERT (GovernmentAlignmentTypeName) VALUES (src.GovernmentAlignmentTypeName);
GO

-- ============================================================================
-- StrategicTags
-- ============================================================================
MERGE dbo.StrategicTags AS tgt
USING (VALUES
    (N'Cybersecurity'),
    (N'Artificial Intelligence / ML'),
    (N'Autonomous Systems'),
    (N'Advanced Manufacturing'),
    (N'Energy / Sustainability'),
    (N'Biotechnology'),
    (N'Microelectronics'),
    (N'Quantum Computing'),
    (N'Space / Aerospace'),
    (N'Supply Chain / Logistics'),
    (N'Data Science / Analytics'),
    (N'5G / Telecommunications'),
    (N'Health Technology'),
    (N'Workforce Development'),
    (N'Diversity & Inclusion Partner'),
    (N'Regional Economic Driver')
) AS src (StrategicTagName)
ON tgt.StrategicTagName = src.StrategicTagName
WHEN NOT MATCHED THEN INSERT (StrategicTagName) VALUES (src.StrategicTagName);
GO

-- ============================================================================
-- LinkageRoles
-- ============================================================================
MERGE dbo.LinkageRoles AS tgt
USING (VALUES
    (N'Principal Investigator'),
    (N'Co-PI'),
    (N'Advisory Board Liaison'),
    (N'Capstone Mentor'),
    (N'Industry Speaker'),
    (N'Research Collaborator'),
    (N'Consultant'),
    (N'Thesis Advisor'),
    (N'Program Director'),
    (N'Other')
) AS src (LinkageRoleName)
ON tgt.LinkageRoleName = src.LinkageRoleName
WHEN NOT MATCHED THEN INSERT (LinkageRoleName) VALUES (src.LinkageRoleName);
GO

PRINT '02_seed_lookups.sql completed successfully.';
GO
