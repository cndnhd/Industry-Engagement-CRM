# Testing Checklist — Industry Engagement CRM

---

## Pre-Test Setup

- [ ] All SQL scripts have been run successfully (01 through 04)
- [ ] Sample data loaded (05_sample_data.sql) — or production data exists
- [ ] All three Microsoft Forms created and accessible
- [ ] All Power Automate flows created and turned on
- [ ] Power Apps canvas app published and shared with test user
- [ ] SQL connection verified from Power Apps and Power Automate

---

## 1. Database Integrity Tests

Run these queries in SSMS or Azure Data Studio:

### 1.1 Table count verification
```sql
SELECT COUNT(*) AS TableCount
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';
-- Expected: 31 (21 lookup + 7 production + 3 staging)
```

### 1.2 Lookup data verification
```sql
SELECT 'Departments' AS Tbl, COUNT(*) AS Cnt FROM Departments
UNION ALL SELECT 'FacultyTitles', COUNT(*) FROM FacultyTitles
UNION ALL SELECT 'OrgTypes', COUNT(*) FROM OrgTypes
UNION ALL SELECT 'PriorityLevels', COUNT(*) FROM PriorityLevels
UNION ALL SELECT 'EngagementTypes', COUNT(*) FROM EngagementTypes;
-- Verify counts match seed data
```

### 1.3 FK integrity
```sql
-- Should return 0 rows (no orphaned FKs)
SELECT c.ContactID, c.OrganizationID
FROM Contacts c
LEFT JOIN Organizations o ON c.OrganizationID = o.OrganizationID
WHERE c.OrganizationID IS NOT NULL AND o.OrganizationID IS NULL;
```

### 1.4 Score computation
```sql
SELECT OrganizationID,
       ExecutiveEngagementScore, MultiTouchpointScore,
       OverallPartnershipScore
FROM OrganizationScores
WHERE OrganizationID = 1;
-- Verify OverallPartnershipScore matches manual calculation
```

### 1.5 Views return data
```sql
SELECT TOP 5 * FROM vw_OrganizationsDisplay;
SELECT TOP 5 * FROM vw_ContactsDisplay;
SELECT TOP 5 * FROM vw_EngagementEventsDisplay;
SELECT TOP 5 * FROM vw_FacultyDisplay;
SELECT TOP 5 * FROM vw_OpportunitiesDisplay;
```

---

## 2. Microsoft Forms Tests

### 2.1 Organization Form
- [ ] Submit with all fields filled → verify row in `FormSubmissions_OrganizationIntake`
- [ ] Submit with only required fields (name) → verify row is created with NULLs
- [ ] Submit with a misspelled OrgType → verify staging row captures the text as-is
- [ ] Verify `ProcessedFlag = 0` on new submissions
- [ ] Verify `SubmitterEmail` captured correctly

### 2.2 Contact Form
- [ ] Submit with valid organization name → verify staging row
- [ ] Submit with nonexistent organization name → will become an error during processing
- [ ] Verify all dropdown choices appear correctly

### 2.3 Engagement Form
- [ ] Submit with date and required fields → verify staging row
- [ ] Verify the date is stored as text in staging (parsed later)

---

## 3. Power Automate Flow Tests

### 3.1 Intake flows (IE-01, IE-02, IE-03)
- [ ] Submit each form → verify the corresponding staging table gets a new row within 5 minutes
- [ ] Check flow run history → all runs show "Succeeded"
- [ ] Verify no SQL errors in run details

### 3.2 Processing flows (IE-04, IE-05, IE-06)
- [ ] Wait for scheduled run (or trigger manually)
- [ ] Verify `ProcessedFlag` changes from 0 to 1
- [ ] Verify `ProcessedAt` is populated
- [ ] Verify production table has the new record
- [ ] Check `CreatedOrganizationID` / `CreatedContactID` / `CreatedEventID` populated
- [ ] Submit a form with a bad lookup value → verify `ErrorMessage` is set

### 3.3 Dedup test (IE-04)
- [ ] Submit the same organization name twice via Forms
- [ ] Verify the second submission updates (not duplicates) the production record

### 3.4 Follow-up reminder (IE-08)
- [ ] Insert an engagement event with `FollowUpDate` in the past
- [ ] Wait for or manually trigger IE-08
- [ ] Verify reminder email is sent to admin

### 3.5 Score recalculation (IE-07)
- [ ] Update a sub-score in OrganizationScores
- [ ] Verify OverallPartnershipScore recalculates (it's a persisted column — automatic)
- [ ] If the notification flow is active, verify email is sent for significant changes

---

## 4. Power Apps Tests

### 4.1 Organizations
- [ ] Browse screen loads and shows organization names
- [ ] Search filters organizations by name
- [ ] Tap an org → detail screen shows correct data
- [ ] All combo boxes display the correct current value
- [ ] Change OrgType via combo box → Save → verify DB updated
- [ ] Create a new organization → verify it appears in browse
- [ ] Cancel editing → verify no changes saved
- [ ] Deactivate an organization → verify `IsActive = 0` in DB

### 4.2 Contacts
- [ ] Browse screen loads contacts
- [ ] Organization combo box is searchable and shows org names
- [ ] Save a contact linked to an org → verify `OrganizationID` in DB
- [ ] All lookup combo boxes resolve correctly

### 4.3 Faculty
- [ ] Browse screen loads faculty
- [ ] Department and Title combo boxes work correctly
- [ ] Create a new faculty member → verify in DB

### 4.4 Engagement Events
- [ ] Browse screen shows events sorted by date descending
- [ ] Organization combo box works
- [ ] Contact combo box filters by selected organization
- [ ] Save a new event → verify in DB

### 4.5 Opportunities
- [ ] Browse screen shows opportunities
- [ ] Estimated value displays formatted as currency
- [ ] Stage and Status combo boxes work
- [ ] Save and verify

### 4.6 Cross-module navigation
- [ ] Navigate between all modules via nav bar
- [ ] Back button works correctly
- [ ] No stale data after navigating between screens

---

## 5. Power BI Tests (if applicable)

- [ ] Connect to Azure SQL and import views
- [ ] All views return data
- [ ] Organization score shows in reports
- [ ] Filter by PriorityLevel works
- [ ] Date-based filtering works for engagement events

---

## 6. Performance Benchmarks

| Test | Target | Pass/Fail |
|---|---|---|
| Organization gallery load (100 records) | < 3 sec | |
| Combo box search response | < 1 sec | |
| Form save (new org) | < 2 sec | |
| View query (vw_OrganizationsDisplay, 100 rows) | < 2 sec | |
| Processing flow (10 staging rows) | < 5 min | |

---

## 7. Error Scenario Tests

- [ ] Disconnect SQL → verify Power Apps shows a user-friendly error
- [ ] Submit form with SQL injection attempt → verify parameterized queries prevent it
- [ ] Submit form with very long text (>4000 chars) → verify staging handles NVARCHAR(MAX)
- [ ] Turn off processing flow → submit forms → turn on → verify backlog processes
- [ ] Delete a lookup value that's referenced by a FK → verify SQL prevents it

---

## Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Database Admin | | | |
| Power Platform Maker | | | |
| Business Owner | | | |
| QA Tester | | | |
