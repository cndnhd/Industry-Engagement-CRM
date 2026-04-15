# Power Apps — Screen-by-Screen Implementation Guide

> **App type:** Canvas App  
> **Data source:** Azure SQL (SQL Server connector)  
> **Tables used:** All production tables + lookup tables from `IndustryEngagement` database  

---

## Table of Contents

1. [Data Source Setup](#1-data-source-setup)
2. [App-Level OnStart](#2-app-level-onstart)
3. [Organizations Module](#3-organizations-module)
4. [Contacts Module](#4-contacts-module)
5. [Faculty Module](#5-faculty-module)
6. [Engagement Events Module](#6-engagement-events-module)
7. [Opportunities Module](#7-opportunities-module)
8. [Common Patterns & Reusable Formulas](#8-common-patterns)
9. [What to Paste Where](#9-what-to-paste-where)

---

## 1. Data Source Setup

### Manual Steps in Power Platform UI

1. Open **Power Apps Studio** → Create a **Canvas App** (tablet or responsive layout).
2. Go to **Data** panel → **Add data** → Search for **SQL Server**.
3. Choose **Azure SQL** as connection type.
4. Enter:
   - **Server:** `your-server.database.windows.net`
   - **Database:** `IndustryEngagement`
   - **Authentication:** Use Azure AD or SQL authentication as configured.
5. Add these tables (check all):

| Production Tables | Lookup Tables |
|---|---|
| Organizations | Departments |
| Contacts | FacultyTitles |
| Faculty | ContractorRoles |
| EngagementEvents | FunctionalAreas |
| JourneyLog | InfluenceLevels |
| Opportunities | RiskToleranceLevels |
| OrganizationScores | PersonalOrientations |
| OrganizationFacultyLinkages | OrgTypes |
| OrganizationGovernmentAlignments | OwnershipTypes |
| OrganizationStrategicTags | GrowthStages |
| | PriorityLevels |
| | RelationshipLevels |
| | OutreachMotions |
| | EngagementTypes |
| | JourneyStages |
| | OpportunityTypes |
| | OpportunityStages |
| | OpportunityStatuses |
| | GovernmentAlignmentTypes |
| | StrategicTags |
| | LinkageRoles |

---

## 2. App-Level OnStart

Paste into **App.OnStart** to cache lookup tables for fast combo-box performance:

```
ClearCollect(colDepartments,
    SortByColumns(
        Filter(Departments, IsActive = true),
        "DepartmentName", SortOrder.Ascending
    )
);
ClearCollect(colFacultyTitles,
    SortByColumns(
        Filter(FacultyTitles, IsActive = true),
        "FacultyTitleName", SortOrder.Ascending
    )
);
ClearCollect(colOrgTypes,
    SortByColumns(
        Filter(OrgTypes, IsActive = true),
        "OrgTypeName", SortOrder.Ascending
    )
);
ClearCollect(colOwnershipTypes,
    SortByColumns(
        Filter(OwnershipTypes, IsActive = true),
        "OwnershipTypeName", SortOrder.Ascending
    )
);
ClearCollect(colGrowthStages,
    SortByColumns(
        Filter(GrowthStages, IsActive = true),
        "SortOrder", SortOrder.Ascending
    )
);
ClearCollect(colPriorityLevels,
    SortByColumns(
        Filter(PriorityLevels, IsActive = true),
        "SortOrder", SortOrder.Ascending
    )
);
ClearCollect(colContractorRoles,
    SortByColumns(
        Filter(ContractorRoles, IsActive = true),
        "ContractorRoleName", SortOrder.Ascending
    )
);
ClearCollect(colRelationshipLevels,
    SortByColumns(
        Filter(RelationshipLevels, IsActive = true),
        "SortOrder", SortOrder.Ascending
    )
);
ClearCollect(colFunctionalAreas,
    SortByColumns(
        Filter(FunctionalAreas, IsActive = true),
        "FunctionalAreaName", SortOrder.Ascending
    )
);
ClearCollect(colInfluenceLevels,
    SortByColumns(
        Filter(InfluenceLevels, IsActive = true),
        "SortOrder", SortOrder.Ascending
    )
);
ClearCollect(colRiskToleranceLevels,
    SortByColumns(
        Filter(RiskToleranceLevels, IsActive = true),
        "SortOrder", SortOrder.Ascending
    )
);
ClearCollect(colPersonalOrientations,
    SortByColumns(
        Filter(PersonalOrientations, IsActive = true),
        "PersonalOrientationName", SortOrder.Ascending
    )
);
ClearCollect(colOutreachMotions,
    SortByColumns(
        Filter(OutreachMotions, IsActive = true),
        "OutreachMotionName", SortOrder.Ascending
    )
);
ClearCollect(colEngagementTypes,
    SortByColumns(
        Filter(EngagementTypes, IsActive = true),
        "EngagementTypeName", SortOrder.Ascending
    )
);
ClearCollect(colJourneyStages,
    SortByColumns(
        Filter(JourneyStages, IsActive = true),
        "SortOrder", SortOrder.Ascending
    )
);
ClearCollect(colOpportunityTypes,
    SortByColumns(
        Filter(OpportunityTypes, IsActive = true),
        "OpportunityTypeName", SortOrder.Ascending
    )
);
ClearCollect(colOpportunityStages,
    SortByColumns(
        Filter(OpportunityStages, IsActive = true),
        "SortOrder", SortOrder.Ascending
    )
);
ClearCollect(colOpportunityStatuses,
    SortByColumns(
        Filter(OpportunityStatuses, IsActive = true),
        "StatusName", SortOrder.Ascending
    )
);
ClearCollect(colLinkageRoles,
    SortByColumns(
        Filter(LinkageRoles, IsActive = true),
        "LinkageRoleName", SortOrder.Ascending
    )
);
ClearCollect(colGovernmentAlignmentTypes,
    SortByColumns(
        Filter(GovernmentAlignmentTypes, IsActive = true),
        "GovernmentAlignmentTypeName", SortOrder.Ascending
    )
);
ClearCollect(colStrategicTags,
    SortByColumns(
        Filter(StrategicTags, IsActive = true),
        "StrategicTagName", SortOrder.Ascending
    )
);

// Navigation context variable
Set(varEditMode, false);
```

---

## 3. Organizations Module

### 3A. Browse Screen — `scrOrganizationsBrowse`

**Gallery control:** `galOrganizations`

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(Filter(Organizations, IsActive = true, OrganizationName in txtOrgSearch.Text), "OrganizationName", SortOrder.Ascending)` |
| **Template fields** | `ThisItem.OrganizationName`, `ThisItem.Industry`, `ThisItem.HeadquartersState` |

**Search box:** `txtOrgSearch`  
Keep the `in` operator for delegation-friendly substring search.

**"New" button OnSelect:**
```
NewForm(frmOrganization);
Set(varEditMode, true);
Navigate(scrOrganizationDetail, ScreenTransition.None)
```

**Gallery item OnSelect:**
```
Set(varSelectedOrg, ThisItem);
EditForm(frmOrganization);
Set(varEditMode, true);
Navigate(scrOrganizationDetail, ScreenTransition.None)
```

### 3B. Detail/Edit Screen — `scrOrganizationDetail`

**Edit Form:** `frmOrganization`

| Property | Formula |
|---|---|
| **DataSource** | `Organizations` |
| **Item** | `varSelectedOrg` |

#### Combo Box: OrgType

| Property | Formula |
|---|---|
| **Items** | `colOrgTypes` |
| **DisplayFields** | `["OrgTypeName"]` |
| **SearchFields** | `["OrgTypeName"]` |
| **DefaultSelectedItems** | `Filter(colOrgTypes, OrgTypeID = ThisItem.OrgTypeID)` |

**Card Update property:**
```
cmbOrgType.Selected.OrgTypeID
```

#### Combo Box: OwnershipType

| Property | Formula |
|---|---|
| **Items** | `colOwnershipTypes` |
| **DisplayFields** | `["OwnershipTypeName"]` |
| **SearchFields** | `["OwnershipTypeName"]` |
| **DefaultSelectedItems** | `Filter(colOwnershipTypes, OwnershipTypeID = ThisItem.OwnershipTypeID)` |

**Card Update:**
```
cmbOwnershipType.Selected.OwnershipTypeID
```

#### Combo Box: GrowthStage

| Property | Formula |
|---|---|
| **Items** | `colGrowthStages` |
| **DisplayFields** | `["GrowthStageName"]` |
| **SearchFields** | `["GrowthStageName"]` |
| **DefaultSelectedItems** | `Filter(colGrowthStages, GrowthStageID = ThisItem.GrowthStageID)` |

**Card Update:**
```
cmbGrowthStage.Selected.GrowthStageID
```

#### Combo Box: PriorityLevel

| Property | Formula |
|---|---|
| **Items** | `colPriorityLevels` |
| **DisplayFields** | `["PriorityLevelName"]` |
| **SearchFields** | `["PriorityLevelName"]` |
| **DefaultSelectedItems** | `Filter(colPriorityLevels, PriorityLevelID = ThisItem.PriorityLevelID)` |

**Card Update:**
```
cmbPriorityLevel.Selected.PriorityLevelID
```

#### Combo Box: ContractorRole

| Property | Formula |
|---|---|
| **Items** | `colContractorRoles` |
| **DisplayFields** | `["ContractorRoleName"]` |
| **SearchFields** | `["ContractorRoleName"]` |
| **DefaultSelectedItems** | `Filter(colContractorRoles, ContractorRoleID = ThisItem.ContractorRoleID)` |

**Card Update:**
```
cmbContractorRole.Selected.ContractorRoleID
```

#### Combo Box: RelationshipLevel

| Property | Formula |
|---|---|
| **Items** | `colRelationshipLevels` |
| **DisplayFields** | `["RelationshipLevelName"]` |
| **SearchFields** | `["RelationshipLevelName"]` |
| **DefaultSelectedItems** | `Filter(colRelationshipLevels, RelationshipLevelID = ThisItem.RelationshipLevelID)` |

**Card Update:**
```
cmbRelationshipLevel.Selected.RelationshipLevelID
```

#### Save Button OnSelect:
```
SubmitForm(frmOrganization);
```

#### Form OnSuccess:
```
Notify("Organization saved successfully.", NotificationType.Success);
Set(varEditMode, false);
Navigate(scrOrganizationsBrowse, ScreenTransition.None)
```

#### Cancel Button OnSelect:
```
ResetForm(frmOrganization);
Set(varEditMode, false);
Back()
```

---

## 4. Contacts Module

### 4A. Browse Screen — `scrContactsBrowse`

**Gallery:** `galContacts`

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(Filter(Contacts, IsActive = true, LastName in txtContactSearch.Text), "LastName", SortOrder.Ascending)` |
| **Template fields** | `ThisItem.FirstName & " " & ThisItem.LastName`, `ThisItem.Email`, `ThisItem.JobTitle` |

**Gallery OnSelect:**
```
Set(varSelectedContact, ThisItem);
EditForm(frmContact);
Navigate(scrContactDetail, ScreenTransition.None)
```

**"New" button OnSelect:**
```
NewForm(frmContact);
Navigate(scrContactDetail, ScreenTransition.None)
```

### 4B. Detail/Edit Screen — `scrContactDetail`

**Form:** `frmContact`

| Property | Formula |
|---|---|
| **DataSource** | `Contacts` |
| **Item** | `varSelectedContact` |

#### Combo Box: Organization (searchable — large list)

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(Filter(Organizations, IsActive = true), "OrganizationName", SortOrder.Ascending)` |
| **DisplayFields** | `["OrganizationName"]` |
| **SearchFields** | `["OrganizationName"]` |
| **IsSearchable** | `true` |
| **DefaultSelectedItems** | `Filter(Organizations, OrganizationID = ThisItem.OrganizationID)` |

**Card Update:**
```
cmbContactOrganization.Selected.OrganizationID
```

> **Delegation note:** For Organizations >500 records, set App Settings → Delegation limit to 2000. The `in` operator delegates to SQL Server.

#### Combo Box: FunctionalArea

| Property | Formula |
|---|---|
| **Items** | `colFunctionalAreas` |
| **DisplayFields** | `["FunctionalAreaName"]` |
| **SearchFields** | `["FunctionalAreaName"]` |
| **DefaultSelectedItems** | `Filter(colFunctionalAreas, FunctionalAreaID = ThisItem.FunctionalAreaID)` |

**Card Update:**
```
cmbFunctionalArea.Selected.FunctionalAreaID
```

#### Combo Box: InfluenceLevel

| Property | Formula |
|---|---|
| **Items** | `colInfluenceLevels` |
| **DisplayFields** | `["InfluenceLevelName"]` |
| **SearchFields** | `["InfluenceLevelName"]` |
| **DefaultSelectedItems** | `Filter(colInfluenceLevels, InfluenceLevelID = ThisItem.InfluenceLevelID)` |

**Card Update:**
```
cmbInfluenceLevel.Selected.InfluenceLevelID
```

#### Combo Box: RiskTolerance

| Property | Formula |
|---|---|
| **Items** | `colRiskToleranceLevels` |
| **DisplayFields** | `["RiskToleranceName"]` |
| **SearchFields** | `["RiskToleranceName"]` |
| **DefaultSelectedItems** | `Filter(colRiskToleranceLevels, RiskToleranceID = ThisItem.RiskToleranceID)` |

**Card Update:**
```
cmbRiskTolerance.Selected.RiskToleranceID
```

#### Combo Box: PersonalOrientation

| Property | Formula |
|---|---|
| **Items** | `colPersonalOrientations` |
| **DisplayFields** | `["PersonalOrientationName"]` |
| **SearchFields** | `["PersonalOrientationName"]` |
| **DefaultSelectedItems** | `Filter(colPersonalOrientations, PersonalOrientationID = ThisItem.PersonalOrientationID)` |

**Card Update:**
```
cmbPersonalOrientation.Selected.PersonalOrientationID
```

#### Save / Cancel: Same pattern as Organizations (substitute `frmContact`).

---

## 5. Faculty Module

### 5A. Browse Screen — `scrFacultyBrowse`

**Gallery:** `galFaculty`

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(Filter(Faculty, IsActive = true, LastName in txtFacultySearch.Text), "LastName", SortOrder.Ascending)` |
| **Template fields** | `ThisItem.FirstName & " " & ThisItem.LastName`, `LookUp(Departments, DepartmentID = ThisItem.DepartmentID, DepartmentName)` |

### 5B. Detail/Edit Screen — `scrFacultyDetail`

**Form:** `frmFaculty`

| Property | Formula |
|---|---|
| **DataSource** | `Faculty` |
| **Item** | `varSelectedFaculty` |

#### Combo Box: Department

| Property | Formula |
|---|---|
| **Items** | `colDepartments` |
| **DisplayFields** | `["DepartmentName"]` |
| **SearchFields** | `["DepartmentName"]` |
| **DefaultSelectedItems** | `Filter(colDepartments, DepartmentID = ThisItem.DepartmentID)` |

**Card Update:**
```
cmbDepartment.Selected.DepartmentID
```

#### Combo Box: FacultyTitle

| Property | Formula |
|---|---|
| **Items** | `colFacultyTitles` |
| **DisplayFields** | `["FacultyTitleName"]` |
| **SearchFields** | `["FacultyTitleName"]` |
| **DefaultSelectedItems** | `Filter(colFacultyTitles, FacultyTitleID = ThisItem.FacultyTitleID)` |

**Card Update:**
```
cmbFacultyTitle.Selected.FacultyTitleID
```

---

## 6. Engagement Events Module

### 6A. Browse Screen — `scrEngagementsBrowse`

**Gallery:** `galEngagements`

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(EngagementEvents, "EventDate", SortOrder.Descending)` |
| **Template fields** | `ThisItem.EventTitle`, `Text(ThisItem.EventDate, "[$-en-US]mmm d, yyyy")`, `LookUp(Organizations, OrganizationID = ThisItem.OrganizationID, OrganizationName)` |

### 6B. Detail/Edit Screen — `scrEngagementDetail`

**Form:** `frmEngagement`

| Property | Formula |
|---|---|
| **DataSource** | `EngagementEvents` |
| **Item** | `varSelectedEngagement` |

#### Combo Box: Organization

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(Filter(Organizations, IsActive = true), "OrganizationName", SortOrder.Ascending)` |
| **DisplayFields** | `["OrganizationName"]` |
| **SearchFields** | `["OrganizationName"]` |
| **IsSearchable** | `true` |
| **DefaultSelectedItems** | `Filter(Organizations, OrganizationID = ThisItem.OrganizationID)` |

**Card Update:**
```
cmbEngOrganization.Selected.OrganizationID
```

#### Combo Box: PrimaryContact (filtered by selected org)

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(Filter(Contacts, OrganizationID = cmbEngOrganization.Selected.OrganizationID, IsActive = true), "LastName", SortOrder.Ascending)` |
| **DisplayFields** | `["FirstName", "LastName"]` |
| **SearchFields** | `["LastName", "FirstName"]` |
| **DefaultSelectedItems** | `Filter(Contacts, ContactID = ThisItem.PrimaryContactID)` |

**Card Update:**
```
cmbPrimaryContact.Selected.ContactID
```

> **UX note:** When the user changes the Organization combo box, the Contact combo box automatically re-filters to show only contacts belonging to that organization.

#### Combo Box: OutreachMotion

| Property | Formula |
|---|---|
| **Items** | `colOutreachMotions` |
| **DisplayFields** | `["OutreachMotionName"]` |
| **SearchFields** | `["OutreachMotionName"]` |
| **DefaultSelectedItems** | `Filter(colOutreachMotions, OutreachMotionID = ThisItem.OutreachMotionID)` |

**Card Update:**
```
cmbOutreachMotion.Selected.OutreachMotionID
```

#### Combo Box: EngagementType

| Property | Formula |
|---|---|
| **Items** | `colEngagementTypes` |
| **DisplayFields** | `["EngagementTypeName"]` |
| **SearchFields** | `["EngagementTypeName"]` |
| **DefaultSelectedItems** | `Filter(colEngagementTypes, EngagementTypeID = ThisItem.EngagementTypeID)` |

**Card Update:**
```
cmbEngagementType.Selected.EngagementTypeID
```

---

## 7. Opportunities Module

### 7A. Browse Screen — `scrOpportunitiesBrowse`

**Gallery:** `galOpportunities`

| Property | Formula |
|---|---|
| **Items** | `SortByColumns(Opportunities, "ExpectedCloseDate", SortOrder.Ascending)` |
| **Template fields** | `ThisItem.OpportunityName`, `Text(ThisItem.EstimatedValue, "$#,##0")`, `LookUp(Organizations, OrganizationID = ThisItem.OrganizationID, OrganizationName)` |

### 7B. Detail/Edit Screen — `scrOpportunityDetail`

**Form:** `frmOpportunity`

| Property | Formula |
|---|---|
| **DataSource** | `Opportunities` |
| **Item** | `varSelectedOpportunity` |

#### Combo Box: Organization

Same pattern as Engagements module — searchable Organizations combo.

**Card Update:**
```
cmbOppOrganization.Selected.OrganizationID
```

#### Combo Box: OpportunityType

| Property | Formula |
|---|---|
| **Items** | `colOpportunityTypes` |
| **DisplayFields** | `["OpportunityTypeName"]` |
| **SearchFields** | `["OpportunityTypeName"]` |
| **DefaultSelectedItems** | `Filter(colOpportunityTypes, OpportunityTypeID = ThisItem.OpportunityTypeID)` |

**Card Update:**
```
cmbOpportunityType.Selected.OpportunityTypeID
```

#### Combo Box: OpportunityStage

| Property | Formula |
|---|---|
| **Items** | `colOpportunityStages` |
| **DisplayFields** | `["StageName"]` |
| **SearchFields** | `["StageName"]` |
| **DefaultSelectedItems** | `Filter(colOpportunityStages, StageID = ThisItem.StageID)` |

**Card Update:**
```
cmbOppStage.Selected.StageID
```

#### Combo Box: OpportunityStatus

| Property | Formula |
|---|---|
| **Items** | `colOpportunityStatuses` |
| **DisplayFields** | `["StatusName"]` |
| **SearchFields** | `["StatusName"]` |
| **DefaultSelectedItems** | `Filter(colOpportunityStatuses, StatusID = ThisItem.StatusID)` |

**Card Update:**
```
cmbOppStatus.Selected.StatusID
```

---

## 8. Common Patterns

### Pattern: UpdatedAt Timestamp

For every edit form, add a hidden label or card whose **Update** property is:
```
Now()
```
Map this card to the `UpdatedAt` column. This ensures every save updates the audit timestamp.

### Pattern: Navigation Bar

Create a component or horizontal container with buttons for each module:

```
// OnSelect for each nav button:
Navigate(scrOrganizationsBrowse, ScreenTransition.None)
Navigate(scrContactsBrowse, ScreenTransition.None)
Navigate(scrFacultyBrowse, ScreenTransition.None)
Navigate(scrEngagementsBrowse, ScreenTransition.None)
Navigate(scrOpportunitiesBrowse, ScreenTransition.None)
```

### Pattern: Delete (Soft Delete)

Instead of removing records, set `IsActive = false`:
```
Patch(
    Organizations,
    varSelectedOrg,
    {IsActive: false, UpdatedAt: Now()}
);
Notify("Record deactivated.", NotificationType.Warning);
Back()
```

### Pattern: Refresh After Save

On `Form.OnSuccess`, refresh the gallery data:
```
Refresh(Organizations);
Navigate(scrOrganizationsBrowse, ScreenTransition.None)
```

---

## 9. What to Paste Where

| Where | What to paste |
|---|---|
| **App.OnStart** | The full `ClearCollect(...)` block from Section 2 |
| **Each combo box → Items** | The `colXxx` collection name or inline Filter |
| **Each combo box → DisplayFields** | The array like `["OrgTypeName"]` |
| **Each combo box → SearchFields** | The array like `["OrgTypeName"]` |
| **Each combo box → DefaultSelectedItems** | The `Filter(colXxx, XxxID = ThisItem.XxxID)` formula |
| **Each data card → Update** | The `cmbXxx.Selected.XxxID` formula |
| **Save button → OnSelect** | `SubmitForm(frmXxx)` |
| **Form → OnSuccess** | The Notify + Navigate formula |
| **Cancel button → OnSelect** | `ResetForm(frmXxx); Back()` |
| **Gallery → OnSelect** | `Set(varSelectedXxx, ThisItem); EditForm(frmXxx); Navigate(...)` |
| **New button → OnSelect** | `NewForm(frmXxx); Navigate(...)` |
| **Delete button → OnSelect** | The soft-delete `Patch(...)` pattern |
