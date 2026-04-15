# Power Automate — Implementation Guide

> **Companion document to** `automations/flow-by-flow-specs.md` which has the detailed pseudocode.  
> This document provides step-by-step Power Automate builder instructions.

---

## Connector Setup (One-Time)

1. Go to [make.powerautomate.com](https://make.powerautomate.com).
2. Click **Data → Connections** in the left nav.
3. Create these connections if they don't exist:

| Connector | Name it | Auth |
|---|---|---|
| SQL Server | `IE-SQL-Connection` | Your Azure SQL credentials |
| Microsoft Forms | `IE-Forms-Connection` | Your M365 account |
| Office 365 Outlook | `IE-Outlook-Connection` | Your M365 account |

---

## Flow 1: IE-01-OrgFormToStaging

### Create the Flow

1. **+ Create → Automated cloud flow**
2. Name: `IE-01-OrgFormToStaging`
3. Trigger: `When a new response is submitted` (Microsoft Forms)
4. Form ID: paste the Organization form GUID

### Add Actions

**Action 1: Get response details**
- Connector: Microsoft Forms
- Form ID: same as trigger
- Response ID: `triggerOutputs()?['body/resourceData/responseId']`

**Action 2: Execute a SQL query**
- Connector: SQL Server
- Server: `your-server.database.windows.net`
- Database: `IndustryEngagement`
- Query: (paste this, replacing dynamic content references)

```sql
INSERT INTO dbo.FormSubmissions_OrganizationIntake
  (FormResponseID, SubmitterEmail, OrganizationName, Website,
   HeadquartersCity, HeadquartersState, Industry,
   OrgType, OwnershipType, GrowthStage, PriorityLevel,
   ContractorRole, RelationshipLevel,
   EmployeeCount, AnnualRevenue, Description, Notes)
VALUES
  ('@{outputs('Get_response_details')?['body/responseId']}',
   '@{outputs('Get_response_details')?['body/responder']}',
   '@{outputs('Get_response_details')?['body/q1_org_name']}',
   '@{outputs('Get_response_details')?['body/q2_website']}',
   '@{outputs('Get_response_details')?['body/q3_city']}',
   '@{outputs('Get_response_details')?['body/q4_state']}',
   '@{outputs('Get_response_details')?['body/q5_industry']}',
   '@{outputs('Get_response_details')?['body/q6_orgtype']}',
   '@{outputs('Get_response_details')?['body/q7_ownership']}',
   '@{outputs('Get_response_details')?['body/q8_growth']}',
   '@{outputs('Get_response_details')?['body/q9_priority']}',
   '@{outputs('Get_response_details')?['body/q10_contractor']}',
   '@{outputs('Get_response_details')?['body/q11_relationship']}',
   '@{outputs('Get_response_details')?['body/q12_employees']}',
   '@{outputs('Get_response_details')?['body/q13_revenue']}',
   '@{outputs('Get_response_details')?['body/q14_description']}',
   '@{outputs('Get_response_details')?['body/q15_notes']}')
```

> **Note:** The `body/q1_org_name` field names are placeholders. After creating the form and adding the trigger, Power Automate will show the actual field names from your form. Use the dynamic content picker to select them.

**Action 3 (optional): Send confirmation email**
- Connector: Office 365 Outlook
- To: `outputs('Get_response_details')?['body/responder']`
- Subject: `Submission received — New Organization`
- Body: Thank-you message

### Error Handling

1. Select Action 2 → **...** → **Configure run after** → Check "has failed".
2. Add a **Scope** named `Try` around Action 2.
3. Add a parallel **Scope** named `Catch` configured to run after Try has failed.
4. In Catch, add **Send an email** to admin with the error details.

---

## Flow 4: IE-04-ProcessOrgStaging (Most Complex Flow)

### Create the Flow

1. **+ Create → Scheduled cloud flow**
2. Name: `IE-04-ProcessOrgStaging`
3. Recurrence: Every 15 minutes

### Detailed Action List

**Action 1: Get unprocessed rows**
```sql
SELECT TOP 50 *
FROM dbo.FormSubmissions_OrganizationIntake
WHERE ProcessedFlag = 0
ORDER BY SubmittedAt ASC
```

**Action 2: Apply to each** (loop over results)

Inside the loop:

**Action 2a: Check for existing org**
```sql
SELECT TOP 1 OrganizationID
FROM dbo.Organizations
WHERE OrganizationName = '@{items('Apply_to_each')?['OrganizationName']}'
```

**Action 2b: Resolve OrgTypeID**
```sql
SELECT TOP 1 OrgTypeID
FROM dbo.OrgTypes
WHERE OrgTypeName = '@{items('Apply_to_each')?['OrgType']}'
```

Repeat 2b pattern for each lookup: OwnershipType, GrowthStage, PriorityLevel, ContractorRole, RelationshipLevel.

**Action 2c: Compose variables**
Use **Compose** actions to store resolved IDs, handling nulls:
```
// In the expression editor:
if(
  empty(body('Resolve_OrgTypeID')?['resultsets']?['Table1']),
  null,
  first(body('Resolve_OrgTypeID')?['resultsets']?['Table1'])?['OrgTypeID']
)
```

**Action 2d: Condition — Org exists?**

**Yes branch (Update):**
```sql
UPDATE dbo.Organizations
SET Website = '@{items('Apply_to_each')?['Website']}',
    HeadquartersCity = '@{items('Apply_to_each')?['HeadquartersCity']}',
    HeadquartersState = '@{items('Apply_to_each')?['HeadquartersState']}',
    Industry = '@{items('Apply_to_each')?['Industry']}',
    OrgTypeID = @{outputs('Compose_OrgTypeID')},
    OwnershipTypeID = @{outputs('Compose_OwnershipTypeID')},
    GrowthStageID = @{outputs('Compose_GrowthStageID')},
    PriorityLevelID = @{outputs('Compose_PriorityLevelID')},
    ContractorRoleID = @{outputs('Compose_ContractorRoleID')},
    RelationshipLevelID = @{outputs('Compose_RelationshipLevelID')},
    EmployeeCount = @{outputs('Compose_EmployeeCount')},
    Description = '@{items('Apply_to_each')?['Description']}',
    UpdatedAt = SYSUTCDATETIME()
WHERE OrganizationID = @{outputs('Compose_ExistingOrgID')}
```

**No branch (Insert):**
```sql
INSERT INTO dbo.Organizations
  (OrganizationName, Website, HeadquartersCity, HeadquartersState, Industry,
   OrgTypeID, OwnershipTypeID, GrowthStageID, PriorityLevelID,
   ContractorRoleID, RelationshipLevelID, EmployeeCount, Description)
VALUES
  ('@{items('Apply_to_each')?['OrganizationName']}',
   '@{items('Apply_to_each')?['Website']}',
   '@{items('Apply_to_each')?['HeadquartersCity']}',
   '@{items('Apply_to_each')?['HeadquartersState']}',
   '@{items('Apply_to_each')?['Industry']}',
   @{outputs('Compose_OrgTypeID')},
   @{outputs('Compose_OwnershipTypeID')},
   @{outputs('Compose_GrowthStageID')},
   @{outputs('Compose_PriorityLevelID')},
   @{outputs('Compose_ContractorRoleID')},
   @{outputs('Compose_RelationshipLevelID')},
   @{outputs('Compose_EmployeeCount')},
   '@{items('Apply_to_each')?['Description']}');
SELECT SCOPE_IDENTITY() AS NewOrganizationID;
```

**Action 2e: Mark staging row processed**
```sql
UPDATE dbo.FormSubmissions_OrganizationIntake
SET ProcessedFlag = 1,
    ProcessedAt = SYSUTCDATETIME(),
    CreatedOrganizationID = @{outputs('Compose_FinalOrgID')}
WHERE SubmissionID = @{items('Apply_to_each')?['SubmissionID']}
```

### Error Handling in the Loop

Wrap Actions 2a–2e in a **Scope** named `TryProcess`. Add a parallel **Scope** `CatchProcess` that runs after TryProcess fails:

```sql
UPDATE dbo.FormSubmissions_OrganizationIntake
SET ProcessedFlag = 1,
    ProcessedAt = SYSUTCDATETIME(),
    ErrorMessage = '@{result('TryProcess')?[0]?['error']?['message']}'
WHERE SubmissionID = @{items('Apply_to_each')?['SubmissionID']}
```

---

## Flow 8: IE-08-FollowUpReminder

### Create the Flow

1. **Scheduled cloud flow** — Daily at 8:00 AM.

### Actions

**Action 1: Query overdue events**
```sql
SELECT ee.EngagementEventID, ee.EventTitle, ee.FollowUpDate,
       ee.FollowUpNotes, o.OrganizationName,
       c.FirstName + ' ' + c.LastName AS ContactName,
       c.Email AS ContactEmail
FROM dbo.EngagementEvents ee
JOIN dbo.Organizations o ON ee.OrganizationID = o.OrganizationID
LEFT JOIN dbo.Contacts c ON ee.PrimaryContactID = c.ContactID
WHERE ee.FollowUpDate <= CAST(GETUTCDATE() AS DATE)
  AND ee.FollowUpDate IS NOT NULL
```

**Action 2: Condition — any results?**
Expression: `length(body('Execute_query')?['resultsets']?['Table1'])` > 0

**Yes branch:**

**Action 3: Apply to each overdue event**

**Action 4: Send email**
- To: `admin@missouri.edu` (or environment variable)
- Subject: `Follow-up Overdue: @{items('Apply_to_each')?['EventTitle']}`
- Body:
```html
<p><b>Engagement:</b> @{items('Apply_to_each')?['EventTitle']}</p>
<p><b>Organization:</b> @{items('Apply_to_each')?['OrganizationName']}</p>
<p><b>Follow-up due:</b> @{items('Apply_to_each')?['FollowUpDate']}</p>
<p><b>Contact:</b> @{items('Apply_to_each')?['ContactName']}</p>
<p><b>Notes:</b> @{items('Apply_to_each')?['FollowUpNotes']}</p>
```

---

## What to Paste Where (Summary)

| Flow | Action | What to Paste |
|---|---|---|
| All flows | SQL Connection | Server + Database name |
| IE-01, 02, 03 | Trigger | Form ID from Microsoft Forms |
| IE-01, 02, 03 | SQL Query | INSERT INTO staging statements |
| IE-04, 05, 06 | SELECT query | Unprocessed-row queries |
| IE-04, 05, 06 | Lookup resolution | SELECT queries against lookup tables |
| IE-04, 05, 06 | INSERT/UPDATE | Production table write queries |
| IE-04, 05, 06 | Error handler | UPDATE staging SET ErrorMessage query |
| IE-08 | SELECT query | Overdue follow-up query |
| IE-08 | Email body | HTML template |

---

## Manual Steps in Power Platform UI

| Step | Why it can't be automated |
|---|---|
| Create each flow | Power Automate has no code-based deployment for cloud flows without Solutions export |
| Add and authorize connections | Requires interactive OAuth/credential entry |
| Map dynamic content | Form field IDs vary; must use the visual picker |
| Configure run-after for error handling | Must be set in the designer UI |
| Turn flows on | Flows default to Off after creation |
| Set environment variables | Must be created in the Power Platform solution |
