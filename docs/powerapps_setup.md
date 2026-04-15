# Power Apps Setup — Step-by-Step Instructions

> **Goal:** Stand up the Industry Engagement canvas app with full CRUD, combo-box lookups, and navigation.

---

## Step 1: Create the App

1. Go to [make.powerapps.com](https://make.powerapps.com).
2. Click **+ Create** → **Blank app** → **Blank canvas app**.
3. Name it: `Industry Engagement CRM`.
4. Choose **Tablet** format (recommended for data-heavy CRM).
5. Click **Create**.

---

## Step 2: Add the Data Source

1. In the left sidebar, click the **Data** icon (cylinder).
2. Click **Add data** → search for `SQL Server`.
3. Select **SQL Server** connector.
4. Connection type: **Azure SQL (cloud)**.
5. Enter server and database:
   - Server: `your-server.database.windows.net`
   - Database: `IndustryEngagement`
6. Authenticate (SQL auth or Azure AD).
7. In the table picker, **select all tables** (hold Shift or Ctrl to multi-select):
   - All 21 lookup tables
   - All 7 production tables (Organizations, Contacts, Faculty, EngagementEvents, JourneyLog, Opportunities, OrganizationScores)
8. Click **Connect**.

---

## Step 3: Paste App.OnStart

1. In the **Tree view**, click **App**.
2. Select the **OnStart** property in the formula bar.
3. Paste the entire `ClearCollect(...)` block from `powerapps/screen-by-screen-guide.md`, Section 2.
4. Right-click **App** in tree view → **Run OnStart** to execute it.

---

## Step 4: Build the Navigation Bar

1. Insert a **Horizontal container** at the top of Screen1.
2. Set Height: `60`, Fill: `RGBA(0, 51, 102, 1)` (dark blue).
3. Inside, add 5 **Button** controls:

| Button Text | OnSelect |
|---|---|
| Organizations | `Navigate(scrOrganizationsBrowse, ScreenTransition.None)` |
| Contacts | `Navigate(scrContactsBrowse, ScreenTransition.None)` |
| Faculty | `Navigate(scrFacultyBrowse, ScreenTransition.None)` |
| Engagements | `Navigate(scrEngagementsBrowse, ScreenTransition.None)` |
| Opportunities | `Navigate(scrOpportunitiesBrowse, ScreenTransition.None)` |

4. Style buttons: Fill transparent, Color white, FontWeight Bold.
5. **Copy this container to every screen** (paste, or create a component).

---

## Step 5: Organizations Module

### 5A: Browse Screen

1. Add a new screen → rename to `scrOrganizationsBrowse`.
2. Add a **Text input** control → rename to `txtOrgSearch`. Set HintText: `"Search organizations..."`.
3. Add a **Vertical gallery** → rename to `galOrganizations`.
4. Set gallery properties:

| Property | Value |
|---|---|
| Items | `SortByColumns(Filter(Organizations, IsActive = true, OrganizationName in txtOrgSearch.Text), "OrganizationName", SortOrder.Ascending)` |
| TemplateFill | `If(ThisItem.IsSelected, RGBA(0, 51, 102, 0.1), Transparent)` |
| TemplateSize | `80` |

5. Inside the gallery template, add labels:
   - Label 1: `ThisItem.OrganizationName` (bold, 14pt)
   - Label 2: `ThisItem.Industry & " • " & ThisItem.HeadquartersState`
6. Set gallery **OnSelect**:
```
Set(varSelectedOrg, ThisItem);
EditForm(frmOrganization);
Navigate(scrOrganizationDetail, ScreenTransition.None)
```
7. Add a **+ New** button:
```
NewForm(frmOrganization);
Set(varEditMode, true);
Navigate(scrOrganizationDetail, ScreenTransition.None)
```

### 5B: Detail/Edit Screen

1. Add a new screen → rename to `scrOrganizationDetail`.
2. Add an **Edit form** → rename to `frmOrganization`.
3. Set form properties:

| Property | Value |
|---|---|
| DataSource | `Organizations` |
| Item | `varSelectedOrg` |

4. Add data cards for: OrganizationName, Website, HeadquartersCity, HeadquartersState, HeadquartersCountry, EmployeeCount, AnnualRevenue, Industry, Description, Notes.

5. **For each FK field**, unlock the card and replace the text input with a **Combo box**:

#### OrgType Combo Box
- Control name: `cmbOrgType`
- Items: `colOrgTypes`
- DisplayFields: `["OrgTypeName"]`
- SearchFields: `["OrgTypeName"]`
- DefaultSelectedItems: `Filter(colOrgTypes, OrgTypeID = ThisItem.OrgTypeID)`
- **Card Update property**: `cmbOrgType.Selected.OrgTypeID`

#### OwnershipType Combo Box
- Control name: `cmbOwnershipType`
- Items: `colOwnershipTypes`
- DisplayFields: `["OwnershipTypeName"]`
- SearchFields: `["OwnershipTypeName"]`
- DefaultSelectedItems: `Filter(colOwnershipTypes, OwnershipTypeID = ThisItem.OwnershipTypeID)`
- **Card Update**: `cmbOwnershipType.Selected.OwnershipTypeID`

#### GrowthStage Combo Box
- Control name: `cmbGrowthStage`
- Items: `colGrowthStages`
- DisplayFields: `["GrowthStageName"]`
- SearchFields: `["GrowthStageName"]`
- DefaultSelectedItems: `Filter(colGrowthStages, GrowthStageID = ThisItem.GrowthStageID)`
- **Card Update**: `cmbGrowthStage.Selected.GrowthStageID`

#### PriorityLevel Combo Box
- Control name: `cmbPriorityLevel`
- Items: `colPriorityLevels`
- DisplayFields: `["PriorityLevelName"]`
- SearchFields: `["PriorityLevelName"]`
- DefaultSelectedItems: `Filter(colPriorityLevels, PriorityLevelID = ThisItem.PriorityLevelID)`
- **Card Update**: `cmbPriorityLevel.Selected.PriorityLevelID`

#### ContractorRole Combo Box
- Control name: `cmbContractorRole`
- Items: `colContractorRoles`
- DisplayFields: `["ContractorRoleName"]`
- SearchFields: `["ContractorRoleName"]`
- DefaultSelectedItems: `Filter(colContractorRoles, ContractorRoleID = ThisItem.ContractorRoleID)`
- **Card Update**: `cmbContractorRole.Selected.ContractorRoleID`

#### RelationshipLevel Combo Box
- Control name: `cmbRelationshipLevel`
- Items: `colRelationshipLevels`
- DisplayFields: `["RelationshipLevelName"]`
- SearchFields: `["RelationshipLevelName"]`
- DefaultSelectedItems: `Filter(colRelationshipLevels, RelationshipLevelID = ThisItem.RelationshipLevelID)`
- **Card Update**: `cmbRelationshipLevel.Selected.RelationshipLevelID`

6. Add **UpdatedAt card** (hidden): Set its Update property to `Now()`.

7. Add buttons at the bottom:

**Save button OnSelect:**
```
SubmitForm(frmOrganization)
```

**Form OnSuccess:**
```
Notify("Organization saved.", NotificationType.Success);
Refresh(Organizations);
Navigate(scrOrganizationsBrowse, ScreenTransition.None)
```

**Cancel button OnSelect:**
```
ResetForm(frmOrganization);
Back()
```

---

## Step 6: Contacts Module

Repeat the pattern from Step 5 with these specifics:

- Screen names: `scrContactsBrowse`, `scrContactDetail`
- Form: `frmContact`, DataSource: `Contacts`, Item: `varSelectedContact`
- Gallery Items: `SortByColumns(Filter(Contacts, IsActive = true, LastName in txtContactSearch.Text), "LastName", SortOrder.Ascending)`
- **Organization combo box** (searchable, large list):
  - Items: `SortByColumns(Filter(Organizations, IsActive = true), "OrganizationName", SortOrder.Ascending)`
  - DisplayFields: `["OrganizationName"]`
  - IsSearchable: `true`
  - DefaultSelectedItems: `Filter(Organizations, OrganizationID = ThisItem.OrganizationID)`
  - Card Update: `cmbContactOrganization.Selected.OrganizationID`
- Additional combo boxes: FunctionalArea, InfluenceLevel, RiskTolerance, PersonalOrientation (same pattern as org lookups, using the appropriate `col*` collection).

---

## Step 7: Faculty Module

- Screen names: `scrFacultyBrowse`, `scrFacultyDetail`
- Form: `frmFaculty`, DataSource: `Faculty`, Item: `varSelectedFaculty`
- Gallery Items: `SortByColumns(Filter(Faculty, IsActive = true, LastName in txtFacultySearch.Text), "LastName", SortOrder.Ascending)`
- **Department combo box**:
  - Items: `colDepartments`
  - DisplayFields: `["DepartmentName"]`
  - DefaultSelectedItems: `Filter(colDepartments, DepartmentID = ThisItem.DepartmentID)`
  - Card Update: `cmbDepartment.Selected.DepartmentID`
- **FacultyTitle combo box**:
  - Items: `colFacultyTitles`
  - DisplayFields: `["FacultyTitleName"]`
  - DefaultSelectedItems: `Filter(colFacultyTitles, FacultyTitleID = ThisItem.FacultyTitleID)`
  - Card Update: `cmbFacultyTitle.Selected.FacultyTitleID`

---

## Step 8: Engagement Events Module

- Screen names: `scrEngagementsBrowse`, `scrEngagementDetail`
- Form: `frmEngagement`, DataSource: `EngagementEvents`, Item: `varSelectedEngagement`
- **Organization combo box**: same as Contacts module.
- **Primary Contact combo box** (filtered by org):
  - Items: `SortByColumns(Filter(Contacts, OrganizationID = cmbEngOrganization.Selected.OrganizationID, IsActive = true), "LastName", SortOrder.Ascending)`
  - DisplayFields: `["FirstName", "LastName"]`
  - DefaultSelectedItems: `Filter(Contacts, ContactID = ThisItem.PrimaryContactID)`
  - Card Update: `cmbPrimaryContact.Selected.ContactID`
- **OutreachMotion combo box**: uses `colOutreachMotions`.
- **EngagementType combo box**: uses `colEngagementTypes`.

---

## Step 9: Opportunities Module

- Screen names: `scrOpportunitiesBrowse`, `scrOpportunityDetail`
- Form: `frmOpportunity`, DataSource: `Opportunities`, Item: `varSelectedOpportunity`
- Organization combo box: same pattern.
- **OpportunityType combo box**: uses `colOpportunityTypes`.
- **OpportunityStage combo box**: uses `colOpportunityStages`, DisplayFields: `["StageName"]`.
- **OpportunityStatus combo box**: uses `colOpportunityStatuses`, DisplayFields: `["StatusName"]`.

---

## Step 10: App Settings

1. **File → Settings → General**:
   - App name: `Industry Engagement CRM`
   - Icon: choose a handshake or building icon
2. **File → Settings → Upcoming features → Experimental**:
   - Set **Data row limit** to `2000`
3. **File → Settings → Display**:
   - Lock orientation: Landscape
   - Scale to fit: On

---

## Step 11: Save, Publish, Share

1. **Ctrl+S** to save.
2. **File → Publish** → Publish this version.
3. **File → Share** → Add users or security groups → Set permission to "User" (can use) or "Co-owner" (can edit).

---

## Manual Steps in Power Platform UI

These steps **cannot** be automated and must be done by hand in the Power Apps Studio:

| Step | Description |
|---|---|
| Add SQL data source | Authenticate and select tables via the Data panel |
| Create screens | Insert screens and rename them |
| Insert form controls | Add Edit Form control and bind to data source |
| Insert combo boxes | Replace default text inputs in data cards |
| Configure combo box properties | Set Items, DisplayFields, SearchFields, DefaultSelectedItems for each |
| Set card Update properties | Unlock each card and set the Update formula |
| Wire navigation | Set OnSelect for gallery items, buttons, and nav bar |
| Copy nav bar | Paste the navigation container to each screen |
| App.OnStart | Paste the ClearCollect block and run it |
| Publish and share | Manual via Power Apps portal |

---

## Tips for Success

1. **Test one screen at a time.** Get Organizations working end-to-end before building Contacts.
2. **Use the Preview button (F5)** frequently to test saves and navigation.
3. **Check the Monitor tool** (Advanced tools → Monitor) if data isn't loading.
4. **If a combo box shows blank**, verify the `colXxx` collection has data by adding a temporary gallery pointing to it.
5. **If Save fails**, check the formula bar for errors on the form — usually a mismatched Update property.
