# Power Automate — Flow-by-Flow Specifications

> **Environment:** Power Automate Cloud Flows  
> **Connectors required:** SQL Server (Azure SQL), Microsoft Forms, Office 365 Outlook, Approvals (optional)  
> **Naming convention:** `IE-{FlowNumber}-{ShortName}`

---

## Table of Contents

1. [Flow 1: Organization Form → Staging](#flow-1)
2. [Flow 2: Contact Form → Staging](#flow-2)
3. [Flow 3: Engagement Form → Staging](#flow-3)
4. [Flow 4: Process Organization Staging → Production](#flow-4)
5. [Flow 5: Process Contact Staging → Production](#flow-5)
6. [Flow 6: Process Engagement Staging → Production](#flow-6)
7. [Flow 7: Score Recalculation](#flow-7)
8. [Flow 8: Follow-Up Reminder](#flow-8)
9. [Flow 9: Confirmation Email](#flow-9)
10. [Connection & Environment Setup](#connection-setup)

---

<a name="flow-1"></a>
## Flow 1: IE-01-OrgFormToStaging

**Trigger:** When a new response is submitted — Microsoft Forms  
**Form:** "Industry Engagement — New Organization"

### Steps

```
Trigger: When a new response is submitted
  └─ Form ID: [New Organization Form ID]

Action 1: Get response details
  └─ Form ID: same
  └─ Response ID: triggerOutputs()?['body/resourceData/responseId']

Action 2: Execute a SQL query (Insert into staging)
  └─ Server: your-server.database.windows.net
  └─ Database: IndustryEngagement
  └─ Query:
      INSERT INTO dbo.FormSubmissions_OrganizationIntake
        (FormResponseID, SubmitterEmail, OrganizationName, Website,
         HeadquartersCity, HeadquartersState, Industry,
         OrgType, OwnershipType, GrowthStage, PriorityLevel,
         ContractorRole, RelationshipLevel,
         EmployeeCount, AnnualRevenue, Description, Notes)
      VALUES
        ('@{outputs('Get_response_details')?['body/responseId']}',
         '@{outputs('Get_response_details')?['body/responder']}',
         '@{outputs('Get_response_details')?['body/OrganizationName']}',
         '@{outputs('Get_response_details')?['body/Website']}',
         '@{outputs('Get_response_details')?['body/HeadquartersCity']}',
         '@{outputs('Get_response_details')?['body/HeadquartersState']}',
         '@{outputs('Get_response_details')?['body/Industry']}',
         '@{outputs('Get_response_details')?['body/OrgType']}',
         '@{outputs('Get_response_details')?['body/OwnershipType']}',
         '@{outputs('Get_response_details')?['body/GrowthStage']}',
         '@{outputs('Get_response_details')?['body/PriorityLevel']}',
         '@{outputs('Get_response_details')?['body/ContractorRole']}',
         '@{outputs('Get_response_details')?['body/RelationshipLevel']}',
         '@{outputs('Get_response_details')?['body/EmployeeCount']}',
         '@{outputs('Get_response_details')?['body/AnnualRevenue']}',
         '@{outputs('Get_response_details')?['body/Description']}',
         '@{outputs('Get_response_details')?['body/Notes']}')
```

**Error handling:** Wrap in a Try/Catch (Scope with Configure Run After → Has Failed). On failure, send email to admin.

---

<a name="flow-2"></a>
## Flow 2: IE-02-ContactFormToStaging

**Trigger:** When a new response is submitted — "Industry Engagement — New Contact"

### Steps

Same pattern as Flow 1, inserting into `FormSubmissions_ContactIntake`:

```
INSERT INTO dbo.FormSubmissions_ContactIntake
  (FormResponseID, SubmitterEmail, FirstName, LastName, Email, Phone,
   JobTitle, OrganizationName, FunctionalArea, InfluenceLevel,
   RiskTolerance, PersonalOrientation, LinkedInURL, Notes)
VALUES
  (@FormResponseID, @SubmitterEmail, @FirstName, @LastName, @Email, @Phone,
   @JobTitle, @OrganizationName, @FunctionalArea, @InfluenceLevel,
   @RiskTolerance, @PersonalOrientation, @LinkedInURL, @Notes)
```

---

<a name="flow-3"></a>
## Flow 3: IE-03-EngagementFormToStaging

**Trigger:** When a new response is submitted — "Industry Engagement — New Engagement"

### Steps

Same pattern, inserting into `FormSubmissions_EngagementIntake`:

```
INSERT INTO dbo.FormSubmissions_EngagementIntake
  (FormResponseID, SubmitterEmail, EventTitle, EventDate, Location,
   OrganizationName, PrimaryContactName, OutreachMotion, EngagementType,
   Description, Outcome, FollowUpDate, Notes)
VALUES
  (@FormResponseID, @SubmitterEmail, @EventTitle, @EventDate, @Location,
   @OrganizationName, @PrimaryContactName, @OutreachMotion, @EngagementType,
   @Description, @Outcome, @FollowUpDate, @Notes)
```

---

<a name="flow-4"></a>
## Flow 4: IE-04-ProcessOrgStaging

**Trigger:** Recurrence — Every 15 minutes (or on-demand)

### Detailed Steps (Pseudocode)

```
1. GET unprocessed rows
   SQL: SELECT * FROM FormSubmissions_OrganizationIntake
        WHERE ProcessedFlag = 0
        ORDER BY SubmittedAt ASC

2. FOR EACH row:

   2a. CHECK for duplicate org
       SQL: SELECT OrganizationID FROM Organizations
            WHERE OrganizationName = @row.OrganizationName
       → If found, set existingOrgID

   2b. RESOLVE lookup IDs (one query per lookup)
       SQL: SELECT OrgTypeID FROM OrgTypes
            WHERE OrgTypeName = @row.OrgType
       → Store as resolvedOrgTypeID (NULL if not found)

       Repeat for: OwnershipType, GrowthStage, PriorityLevel,
                    ContractorRole, RelationshipLevel

   2c. VALIDATE required fields
       → OrganizationName must not be blank
       → If any lookup text was provided but did not resolve,
         log warning (but still proceed with NULL)

   2d. INSERT or UPDATE organization
       IF existingOrgID IS NOT NULL:
           UPDATE Organizations SET ...
           WHERE OrganizationID = @existingOrgID
       ELSE:
           INSERT INTO Organizations (...)
           VALUES (...)
           → Capture SCOPE_IDENTITY() as newOrgID

   2e. MARK staging row as processed
       UPDATE FormSubmissions_OrganizationIntake
       SET ProcessedFlag = 1,
           ProcessedAt = SYSUTCDATETIME(),
           CreatedOrganizationID = @newOrgID,
           ErrorMessage = CASE WHEN @hadWarnings THEN @warningText ELSE NULL END
       WHERE SubmissionID = @row.SubmissionID

3. IF any row fails:
   → Set ErrorMessage on that row
   → Set ProcessedFlag = 1 (so it doesn't retry forever)
   → Continue to next row
```

### Implementation Notes

- Use the **Execute a SQL query** action for each lookup resolution.
- Use **Compose** actions to build the resolved ID variables.
- Use **Condition** controls for the duplicate check.
- The `SCOPE_IDENTITY()` capture requires a separate query:
  ```sql
  INSERT INTO Organizations (...) VALUES (...);
  SELECT SCOPE_IDENTITY() AS NewOrganizationID;
  ```
- Wrap the Apply-to-each in a **Scope** for error handling.

---

<a name="flow-5"></a>
## Flow 5: IE-05-ProcessContactStaging

**Trigger:** Recurrence — Every 15 minutes

### Detailed Steps

```
1. GET unprocessed rows from FormSubmissions_ContactIntake

2. FOR EACH row:

   2a. RESOLVE OrganizationID from OrganizationName
       SQL: SELECT TOP 1 OrganizationID FROM Organizations
            WHERE OrganizationName = @row.OrganizationName
       → CRITICAL: If org not found, set ErrorMessage =
         'Organization not found: [name]' and skip

   2b. RESOLVE lookup IDs:
       - FunctionalAreaID from FunctionalArea text
       - InfluenceLevelID from InfluenceLevel text
       - RiskToleranceID from RiskTolerance text
       - PersonalOrientationID from PersonalOrientation text

   2c. CHECK for duplicate contact
       SQL: SELECT ContactID FROM Contacts
            WHERE Email = @row.Email AND Email IS NOT NULL
       → If found, UPDATE existing; else INSERT new

   2d. INSERT or UPDATE contact

   2e. MARK staging row processed with CreatedContactID
```

**Key rule:** Parent (Organization) must exist before child (Contact) can be inserted. If the Organization was submitted via Forms at the same time, Flow 4 must run first. The 15-minute recurrence handles this naturally — or chain Flow 5 to run after Flow 4.

---

<a name="flow-6"></a>
## Flow 6: IE-06-ProcessEngagementStaging

**Trigger:** Recurrence — Every 15 minutes (or chained after Flow 4 and 5)

### Detailed Steps

```
1. GET unprocessed rows from FormSubmissions_EngagementIntake

2. FOR EACH row:

   2a. RESOLVE OrganizationID
       → Error if not found

   2b. RESOLVE PrimaryContactID from PrimaryContactName
       SQL: SELECT TOP 1 ContactID FROM Contacts
            WHERE (FirstName + ' ' + LastName) = @row.PrimaryContactName
              AND OrganizationID = @resolvedOrgID
       → NULL if not found (not a hard error)

   2c. RESOLVE lookup IDs:
       - OutreachMotionID from OutreachMotion text
       - EngagementTypeID from EngagementType text

   2d. PARSE EventDate from text to DATE
       → Use expression: formatDateTime(@row.EventDate, 'yyyy-MM-dd')
       → If parse fails, set ErrorMessage

   2e. INSERT into EngagementEvents

   2f. MARK staging row processed
```

---

<a name="flow-7"></a>
## Flow 7: IE-07-ScoreRecalculation

**Trigger:** When an item is modified — SQL Server → OrganizationScores table  
**Alternative trigger:** Recurrence — Daily at 6:00 AM

### Steps

```
Note: The OverallPartnershipScore column is a PERSISTED computed column
in the database. It recalculates automatically whenever any of the seven
sub-score columns is updated.

This flow exists to:
  a) Notify stakeholders when a score changes significantly
  b) Optionally log score history

1. Trigger fires on OrganizationScores row modification

2. GET the updated row
   → Read OverallPartnershipScore

3. CONDITION: Did score change by more than 5 points?
   → Compare to a stored previous value (or skip if not tracking deltas)

4. IF significant change:
   → Send notification email to partnership manager
   → Optionally insert into a ScoreHistory table (you can add this later)

5. ALTERNATIVE (batch recurrence):
   → Query all OrganizationScores
   → The persisted column is always current
   → Use this flow to generate a daily summary email or dashboard refresh
```

### Manual Step

The computed column handles the math automatically. No Power Automate calculation needed unless you want to override the SQL formula. If you need to update sub-scores from Power Automate:

```sql
UPDATE OrganizationScores
SET ExecutiveEngagementScore = @newValue,
    UpdatedAt = SYSUTCDATETIME()
WHERE OrganizationID = @orgID
```

The `OverallPartnershipScore` persisted column recalculates on the next read.

---

<a name="flow-8"></a>
## Flow 8: IE-08-FollowUpReminder

**Trigger:** Recurrence — Daily at 8:00 AM

### Steps

```
1. QUERY overdue follow-ups
   SQL:
   SELECT ee.EngagementEventID, ee.EventTitle, ee.FollowUpDate,
          ee.FollowUpNotes, o.OrganizationName,
          pc.FirstName + ' ' + pc.LastName AS PrimaryContactName,
          pc.Email AS ContactEmail
   FROM EngagementEvents ee
   JOIN Organizations o ON ee.OrganizationID = o.OrganizationID
   LEFT JOIN Contacts pc ON ee.PrimaryContactID = pc.ContactID
   WHERE ee.FollowUpDate <= CAST(GETUTCDATE() AS DATE)
     AND ee.FollowUpDate IS NOT NULL

2. IF rows returned > 0:

3. FOR EACH overdue event:
   → Send email to [CRM administrator email] with:
     Subject: "Follow-up overdue: @{EventTitle} — @{OrganizationName}"
     Body:
       "The following engagement has a past-due follow-up:
        Event: @{EventTitle}
        Organization: @{OrganizationName}
        Follow-up was due: @{FollowUpDate}
        Contact: @{PrimaryContactName}
        Notes: @{FollowUpNotes}"

4. OPTIONAL: Also send a summary digest email listing all overdue items
```

### Recommended Enhancements

- Add a `FollowUpCompleted` BIT column to EngagementEvents to exclude completed follow-ups.
- Add a Teams notification via the Teams connector instead of (or in addition to) email.

---

<a name="flow-9"></a>
## Flow 9: IE-09-ConfirmationEmail

**Trigger:** Chained — runs at the end of Flows 1, 2, or 3 (after staging insert succeeds)

### Steps

```
1. Receive trigger from parent flow (or use "When an item is created" on staging table)

2. GET submitter email from staging row

3. SEND email via Office 365 Outlook:
   To: @{SubmitterEmail}
   Subject: "Submission received — @{FormType}"
   Body:
     "Thank you for your submission to the Industry Engagement system.

      What you submitted:
        Type: @{FormType}
        Key field: @{OrganizationName or ContactName or EventTitle}
        Submitted at: @{SubmittedAt}

      Your submission is being processed and will appear in the CRM shortly.
      If you notice any errors, please contact [admin email].

      — Industry Engagement Team"
```

### Implementation Option

Instead of a separate flow, add the email action at the end of Flows 1–3 (inside the success branch of the Try scope). This reduces the number of flows to maintain.

---

<a name="connection-setup"></a>
## Connection & Environment Setup

### Required Connections

| Connector | Purpose | Auth Type |
|---|---|---|
| SQL Server | Read/write Azure SQL | Azure AD or SQL Auth |
| Microsoft Forms | Trigger on form submission | Office 365 account |
| Office 365 Outlook | Send emails | Office 365 account |
| Approvals (optional) | For future approval workflows | Built-in |

### Environment Variables (Recommended)

Create these as **Environment Variables** in your Power Platform solution:

| Name | Type | Example Value |
|---|---|---|
| `SQLServerName` | Text | `your-server.database.windows.net` |
| `SQLDatabaseName` | Text | `IndustryEngagement` |
| `AdminEmail` | Text | `admin@missouri.edu` |
| `OrgFormID` | Text | `[Forms ID for org intake]` |
| `ContactFormID` | Text | `[Forms ID for contact intake]` |
| `EngagementFormID` | Text | `[Forms ID for engagement intake]` |

### What to Paste Where

| Flow | Where | What |
|---|---|---|
| IE-01 through IE-03 | Trigger → Form ID | Paste the Microsoft Forms ID |
| IE-01 through IE-03 | SQL Action → Server/DB | Paste server name and database name |
| IE-01 through IE-03 | SQL Action → Query | Paste the INSERT statement from the spec above |
| IE-04 through IE-06 | Recurrence → Interval | Set to 15 minutes |
| IE-04 through IE-06 | SQL queries | Paste the SELECT/INSERT/UPDATE statements |
| IE-07 | Trigger | Set to the OrganizationScores table or daily recurrence |
| IE-08 | Recurrence | Set to daily at 8:00 AM |
| IE-08 | SQL query | Paste the overdue follow-up query |
| IE-09 | Email action | Paste the email template |

### Manual Steps in Power Platform UI

1. **Create each flow manually** in Power Automate — flows cannot be deployed via code.
2. **Set the Form IDs** after creating the Microsoft Forms (see `forms_design.md`).
3. **Authorize connections** — each connector requires first-run authorization.
4. **Test with sample data** — use the staging table sample rows from `05_sample_data.sql`.
5. **Turn on flows** — new flows default to "Off"; toggle them on after testing.
