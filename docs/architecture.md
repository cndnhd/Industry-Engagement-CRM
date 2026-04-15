# Architecture — Industry Engagement CRM

---

## System Overview

The Industry Engagement CRM is a Microsoft-stack solution for tracking university-industry partnerships, contacts, faculty linkages, engagement events, opportunities, and organizational scoring.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        End Users                                    │
│         (University staff, partnership managers, faculty)            │
└───────────┬──────────────────────┬───────────────────┬──────────────┘
            │                      │                   │
            ▼                      ▼                   ▼
   ┌─────────────────┐   ┌──────────────────┐   ┌──────────────┐
   │  Power Apps      │   │ Microsoft Forms   │   │  Power BI    │
   │  (Canvas App)    │   │ (Intake Forms)    │   │  (Reports)   │
   │                  │   │                   │   │              │
   │  • Browse/Edit   │   │  • Org Intake     │   │  • Dashboards│
   │  • CRUD ops      │   │  • Contact Intake │   │  • KPIs      │
   │  • Combo boxes   │   │  • Engagement     │   │  • Drill-down│
   │    with FK IDs   │   │    Intake         │   │              │
   └────────┬─────────┘   └────────┬──────────┘   └───────┬──────┘
            │                      │                       │
            │ SQL Server           │ Power Automate         │ DirectQuery
            │ Connector            │ (Cloud Flows)          │ / Import
            │                      │                       │
            ▼                      ▼                       ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                      Azure SQL Database                          │
   │                     [IndustryEngagement]                         │
   │                                                                  │
   │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
   │  │ Lookup Tables │  │  Production  │  │    Staging Tables     │  │
   │  │ (21 tables)   │  │  Tables (7)  │  │ (3 FormSubmissions_*) │  │
   │  │              │  │              │  │                       │  │
   │  │ • OrgTypes    │  │ • Orgs       │  │ • _OrganizationIntake │  │
   │  │ • Departments │  │ • Contacts   │  │ • _ContactIntake      │  │
   │  │ • etc.        │  │ • Faculty    │  │ • _EngagementIntake   │  │
   │  │              │  │ • Events     │  │                       │  │
   │  │              │  │ • Journey    │  │ ProcessedFlag = 0/1   │  │
   │  │              │  │ • Opps       │  │ ErrorMessage          │  │
   │  │              │  │ • Scores     │  │                       │  │
   │  └──────────────┘  └──────────────┘  └───────────────────────┘  │
   │                                                                  │
   │  ┌──────────────┐  ┌──────────────┐                             │
   │  │ Bridge Tables │  │ SQL Views    │                             │
   │  │ (3 tables)    │  │ (8 views)    │                             │
   │  │              │  │              │                             │
   │  │ • OrgFaculty  │  │ • vw_Orgs    │                             │
   │  │ • OrgGovAlign │  │ • vw_Contacts│                             │
   │  │ • OrgStratTag │  │ • vw_Events  │                             │
   │  │              │  │ • vw_Faculty │                             │
   │  │              │  │ • vw_Opps    │                             │
   │  │              │  │ • etc.       │                             │
   │  └──────────────┘  └──────────────┘                             │
   └──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Path A: Direct Entry (Power Apps)

```
User → Power Apps Form → SQL Server Connector → Production Table
```

- User selects lookup values via combo boxes (displays name, saves ID).
- `SubmitForm()` writes directly to the production table.
- Immediate; no staging needed.

### Path B: Forms Intake (Microsoft Forms + Power Automate)

```
User → Microsoft Form → Power Automate (IE-01/02/03) → Staging Table
                                                             │
                         Power Automate (IE-04/05/06)        │
                         (Recurrence every 15 min)           │
                                                             ▼
                         Resolve text → FK IDs → Validate → Production Table
                                                             │
                                                     Set ProcessedFlag = 1
                                                     Log ErrorMessage if any
```

- Forms capture raw text (not IDs).
- Intake flows (IE-01–03) write to staging tables immediately.
- Processing flows (IE-04–06) run on a schedule, resolve lookups, and upsert.
- Errors are logged on the staging row, not thrown to the user.

### Path C: Reporting (Power BI)

```
Power BI → DirectQuery / Import → SQL Views (vw_*) → Dashboards
```

- Views denormalize all FK relationships.
- No raw IDs in reports; all human-readable names.

---

## Table Inventory

### Lookup Tables (21)

| Table | PK | Display Column | Used By |
|---|---|---|---|
| Departments | DepartmentID | DepartmentName | Faculty |
| FacultyTitles | FacultyTitleID | FacultyTitleName | Faculty |
| ContractorRoles | ContractorRoleID | ContractorRoleName | Organizations |
| FunctionalAreas | FunctionalAreaID | FunctionalAreaName | Contacts |
| InfluenceLevels | InfluenceLevelID | InfluenceLevelName | Contacts |
| RiskToleranceLevels | RiskToleranceID | RiskToleranceName | Contacts |
| PersonalOrientations | PersonalOrientationID | PersonalOrientationName | Contacts |
| OrgTypes | OrgTypeID | OrgTypeName | Organizations |
| OwnershipTypes | OwnershipTypeID | OwnershipTypeName | Organizations |
| GrowthStages | GrowthStageID | GrowthStageName | Organizations |
| PriorityLevels | PriorityLevelID | PriorityLevelName | Organizations |
| RelationshipLevels | RelationshipLevelID | RelationshipLevelName | Organizations |
| OutreachMotions | OutreachMotionID | OutreachMotionName | EngagementEvents |
| EngagementTypes | EngagementTypeID | EngagementTypeName | EngagementEvents |
| JourneyStages | JourneyStageID | JourneyStageName | JourneyLog |
| OpportunityTypes | OpportunityTypeID | OpportunityTypeName | Opportunities |
| OpportunityStages | StageID | StageName | Opportunities |
| OpportunityStatuses | StatusID | StatusName | Opportunities |
| GovernmentAlignmentTypes | GovernmentAlignmentTypeID | GovernmentAlignmentTypeName | OrgGovAlignments |
| StrategicTags | StrategicTagID | StrategicTagName | OrgStrategicTags |
| LinkageRoles | LinkageRoleID | LinkageRoleName | OrgFacultyLinkages |

### Production Tables (7)

| Table | PK | Key FKs |
|---|---|---|
| Organizations | OrganizationID | OrgType, Ownership, Growth, Priority, Contractor, Relationship |
| Contacts | ContactID | Organization, FunctionalArea, Influence, Risk, Orientation |
| Faculty | FacultyID | Department, FacultyTitle |
| EngagementEvents | EngagementEventID | Organization, PrimaryContact, OutreachMotion, EngagementType |
| JourneyLog | JourneyLogID | Organization, JourneyStage, RelatedEngagementEvent |
| Opportunities | OpportunityID | Organization, OpportunityType, Stage, Status |
| OrganizationScores | OrganizationScoreID | Organization (1:1, unique constraint) |

### Bridge Tables (3)

| Table | PK | Composite Key |
|---|---|---|
| OrganizationFacultyLinkages | OrganizationFacultyLinkageID | Org + Faculty + LinkageRole |
| OrganizationGovernmentAlignments | OrganizationGovernmentAlignmentID | Org + GovernmentAlignmentType |
| OrganizationStrategicTags | OrganizationStrategicTagID | Org + StrategicTag |

### Staging Tables (3)

| Table | PK | Purpose |
|---|---|---|
| FormSubmissions_OrganizationIntake | SubmissionID | Raw org form data |
| FormSubmissions_ContactIntake | SubmissionID | Raw contact form data |
| FormSubmissions_EngagementIntake | SubmissionID | Raw engagement form data |

---

## Scoring Model

The `OrganizationScores` table stores seven sub-scores (0–5 scale) and computes the `OverallPartnershipScore` as a **persisted computed column**:

```
OverallPartnershipScore =
    ROUND(
        (
            ExecutiveEngagementScore   × 0.25 +
            MultiTouchpointScore       × 0.20 +
            FacultyAlignmentScore      × 0.15 +
            GovernmentOverlayScore     × 0.10 +
            AdvisoryBoardScore         × 0.10 +
            PhilanthropicBehaviorScore × 0.10 +
            RegionalIdentityScore      × 0.10
        ) × 20
    , 2)
```

**Max possible score:** 100.00 (all sub-scores = 5.0)

The score recalculates automatically when any sub-score is written to the database.

---

## Security Model

| Layer | Mechanism |
|---|---|
| Azure SQL | SQL login or Azure AD; `db_datareader` + `db_datawriter` roles |
| Power Apps | Shared with specific users/security groups via Power Apps portal |
| Power Automate | Flows owned by a service account; connections use shared credentials |
| Microsoft Forms | Configured per-form: "Anyone in my organization" or restricted |
| Power BI | Row-level security (RLS) can be added in Power BI if needed |

---

## Design Decisions & Assumptions

1. **Soft deletes:** All production tables have `IsActive BIT DEFAULT 1`. Records are deactivated, not deleted.
2. **UTC timestamps:** All `CreatedAt` / `UpdatedAt` use `SYSUTCDATETIME()` for consistency across time zones.
3. **Persisted computed column for scores:** Avoids trigger complexity and ensures the score is always consistent.
4. **Staging + processing pattern for Forms:** Decouples intake from validation. Prevents bad data from reaching production tables directly.
5. **NVARCHAR throughout:** Supports international characters in organization and contact names.
6. **Lookup tables have IsActive flags:** Allows retiring values without breaking historical FK references.
7. **No multi-select comma storage:** Bridge tables handle all many-to-many relationships properly.

---

## Known Limitations

1. **Power Apps delegation limit:** Default 500 rows; set to 2000 in app settings. For tables exceeding 2000 rows, use server-side filtering.
2. **Microsoft Forms cannot use lookup IDs:** Forms present text choices; the processing flow must resolve them. If a choice value is misspelled or changed in the form but not the lookup table, the FK will be NULL.
3. **No real-time sync between Forms and Power Apps:** The 15-minute recurrence delay means form submissions don't appear in the app instantly. Reduce the interval if needed (minimum 1 minute).
4. **Power Automate SQL connector limitations:** Maximum 2048 characters per query parameter. Very long Notes fields may need truncation.
5. **No built-in audit trail beyond CreatedAt/UpdatedAt:** For full audit history, consider adding a change-log table or using Azure SQL auditing.
