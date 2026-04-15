# Deployment Guide — Industry Engagement CRM

> **Audience:** System administrator or Power Platform maker deploying the CRM for the first time.  
> **Time estimate:** 4–6 hours for a first-time setup.  
> **Prerequisites:** Azure subscription, Power Platform license (E3/E5 or standalone Power Apps + Power Automate), Microsoft Forms access.

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Phase 1: Azure SQL Database](#2-phase-1-azure-sql)
3. [Phase 2: Microsoft Forms](#3-phase-2-forms)
4. [Phase 3: Power Automate Flows](#4-phase-3-power-automate)
5. [Phase 4: Power Apps Canvas App](#5-phase-4-power-apps)
6. [Phase 5: Power BI (Optional)](#6-phase-5-power-bi)
7. [Phase 6: Go-Live Validation](#7-phase-6-validation)
8. [Environment-Specific Values](#8-environment-values)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pre-Deployment Checklist

- [ ] Azure subscription with permission to create SQL databases
- [ ] Power Platform environment (production or sandbox)
- [ ] Power Apps per-user or per-app license for all CRM users
- [ ] Power Automate license (included with most M365 E3/E5)
- [ ] Microsoft Forms access (included with M365)
- [ ] SQL Server Management Studio (SSMS) or Azure Data Studio installed
- [ ] Admin email distribution list for error notifications
- [ ] Decision: SQL authentication vs. Azure AD authentication

---

## 2. Phase 1: Azure SQL Database

### 2.1 Create the Database

1. Go to [Azure Portal](https://portal.azure.com) → **SQL databases** → **Create**.
2. Configure:
   - **Resource group:** Create new or use existing.
   - **Database name:** `IndustryEngagement`
   - **Server:** Create new or use existing Azure SQL server.
   - **Compute:** Start with **Basic** or **S0** tier (scale up later if needed).
   - **Backup redundancy:** Locally-redundant (unless geo-redundancy is required).
3. Under **Networking**:
   - Enable **Allow Azure services and resources to access this server** (required for Power Platform).
   - Add your client IP for SSMS access.
4. Create the database.

### 2.2 Run the SQL Scripts

Connect to the database via SSMS or Azure Data Studio and run the scripts **in order**:

| Order | File | Purpose |
|---|---|---|
| 1 | `sql/01_create_tables.sql` | Creates all tables (lookups, production, staging) |
| 2 | `sql/02_seed_lookups.sql` | Populates lookup tables with reference data |
| 3 | `sql/03_indexes_constraints.sql` | Creates performance indexes |
| 4 | `sql/04_views.sql` | Creates Power BI-friendly denormalized views |
| 5 | `sql/05_sample_data.sql` | Inserts test data (SKIP in production) |

### 2.3 Create a SQL Login for Power Platform

```sql
-- Run on the master database
CREATE LOGIN PowerPlatformSvc WITH PASSWORD = '<STRONG-PASSWORD-HERE>';

-- Run on the IndustryEngagement database
CREATE USER PowerPlatformSvc FOR LOGIN PowerPlatformSvc;
ALTER ROLE db_datareader ADD MEMBER PowerPlatformSvc;
ALTER ROLE db_datawriter ADD MEMBER PowerPlatformSvc;
GRANT EXECUTE TO PowerPlatformSvc;
```

> **Alternative:** Use Azure AD authentication with a service principal or managed identity. This is more secure and avoids password rotation.

### 2.4 Verify

```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME;
-- Should return 31+ tables (21 lookups + 7 production + 3 staging)

SELECT * FROM vw_OrganizationsDisplay;
-- Should return data if sample data was loaded
```

---

## 3. Phase 2: Microsoft Forms

1. Go to [forms.office.com](https://forms.office.com).
2. Create three forms following the specifications in `docs/forms_design.md`:
   - **Industry Engagement — New Organization**
   - **Industry Engagement — New Contact**
   - **Industry Engagement — New Engagement Event**
3. For each form:
   - Add all fields as specified.
   - **Copy the Form ID** from the URL (the GUID in the URL after `/forms/`).
   - Save the Form IDs — you'll need them for Power Automate.
4. Test each form by submitting a sample response.

---

## 4. Phase 3: Power Automate Flows

Create flows in this order (see `automations/flow-by-flow-specs.md` for detailed pseudocode):

### Intake Flows (create first)

| Flow Name | Trigger | Purpose |
|---|---|---|
| IE-01-OrgFormToStaging | Forms submission | Writes org form data to staging |
| IE-02-ContactFormToStaging | Forms submission | Writes contact form data to staging |
| IE-03-EngagementFormToStaging | Forms submission | Writes engagement form data to staging |

### Processing Flows

| Flow Name | Trigger | Purpose |
|---|---|---|
| IE-04-ProcessOrgStaging | Recurrence (15 min) | Validates & upserts orgs to production |
| IE-05-ProcessContactStaging | Recurrence (15 min) | Validates & upserts contacts to production |
| IE-06-ProcessEngagementStaging | Recurrence (15 min) | Validates & inserts events to production |

### Utility Flows

| Flow Name | Trigger | Purpose |
|---|---|---|
| IE-07-ScoreRecalculation | Row modified / Daily | Monitors score changes |
| IE-08-FollowUpReminder | Daily at 8 AM | Emails overdue follow-up alerts |
| IE-09-ConfirmationEmail | Chained from IE-01–03 | Sends thank-you to submitter |

### For each flow:

1. Create a new **Cloud flow** in Power Automate.
2. Set the trigger as specified.
3. Add the SQL Server connection (use the connection created in Phase 1).
4. Paste the SQL queries from the specs.
5. Replace placeholder values (Form IDs, server name, database name, admin email).
6. Test with sample data.
7. Turn on the flow.

---

## 5. Phase 4: Power Apps Canvas App

1. Open [make.powerapps.com](https://make.powerapps.com).
2. Create a new **Canvas app** → Tablet layout (recommended for CRM).
3. Add the **SQL Server** data source pointing to your `IndustryEngagement` database.
4. Add **all tables** listed in `powerapps/screen-by-screen-guide.md`, Section 1.
5. Build screens following the guide:
   - Copy/paste **App.OnStart** formulas.
   - Create browse screens with galleries.
   - Create detail/edit screens with forms.
   - Configure combo boxes with the exact formulas provided.
   - Wire up navigation, save, cancel, and delete buttons.
6. Set **App Settings → Experimental → Data row limit** to `2000`.
7. Test all CRUD operations.
8. **Save and publish** the app.
9. **Share** with users via the Power Apps portal.

---

## 6. Phase 5: Power BI (Optional)

1. Open **Power BI Desktop**.
2. **Get Data → Azure SQL Database**.
3. Connect to your server and database.
4. Import these views:
   - `vw_OrganizationsDisplay`
   - `vw_ContactsDisplay`
   - `vw_EngagementEventsDisplay`
   - `vw_FacultyDisplay`
   - `vw_OpportunitiesDisplay`
   - `vw_JourneyLogDisplay`
   - `vw_OrganizationFacultyLinkagesDisplay`
5. Build reports (or start from the existing `Industry Engagement.pbix` file).
6. Publish to Power BI Service.

---

## 7. Phase 6: Go-Live Validation

### Functional Tests

- [ ] Submit each Microsoft Form and verify data appears in staging tables
- [ ] Let processing flows run and verify production tables are populated
- [ ] Open Power Apps and verify all browse screens show data
- [ ] Create a new Organization via Power Apps and verify it saves
- [ ] Create a new Contact linked to an existing Organization
- [ ] Log an Engagement Event with organization and contact lookups
- [ ] Verify combo boxes display names and save IDs
- [ ] Verify follow-up reminder flow triggers for overdue events
- [ ] Verify staging error view (`vw_StagingErrors`) for any processing failures
- [ ] Verify score calculation by updating sub-scores and checking OverallPartnershipScore

### Performance Tests

- [ ] Organization gallery loads in <3 seconds with sample data
- [ ] Combo box search is responsive with lookup data
- [ ] Power BI views return results in <5 seconds

---

## 8. Environment-Specific Values

Replace these placeholders before deployment:

| Placeholder | Where Used | Example |
|---|---|---|
| `your-server.database.windows.net` | SQL connections, Power Automate | `ie-prod-server.database.windows.net` |
| `IndustryEngagement` | Database name everywhere | `IndustryEngagement` |
| `<STRONG-PASSWORD-HERE>` | SQL login creation | (generate a strong password) |
| `[New Organization Form ID]` | Power Automate Flow 1 | GUID from Forms URL |
| `[New Contact Form ID]` | Power Automate Flow 2 | GUID from Forms URL |
| `[New Engagement Form ID]` | Power Automate Flow 3 | GUID from Forms URL |
| `admin@missouri.edu` | Error notification emails | Your admin DL |

---

## 9. Troubleshooting

| Issue | Likely Cause | Fix |
|---|---|---|
| Power Apps can't connect to SQL | Firewall or auth | Enable "Allow Azure services" on SQL server; verify credentials |
| Combo boxes show blank | Missing lookup seed data | Run `02_seed_lookups.sql` again |
| Forms data not appearing in staging | Flow not turned on | Check Power Automate → turn on flow |
| Staging rows have errors | Lookup text doesn't match | Ensure Form choices exactly match lookup table values |
| Score not updating | Sub-scores are all NULL | Update at least one sub-score in OrganizationScores |
| Gallery shows delegation warning | Filter/Sort on non-delegable column | Use indexed columns; increase delegation limit |
| Follow-up reminders not sending | Flow off or no overdue events | Check flow run history; insert a test event with past FollowUpDate |
