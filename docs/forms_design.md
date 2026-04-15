# Microsoft Forms — Intake Form Designs

> **Purpose:** These three Forms serve as the intake layer for the Industry Engagement CRM. They collect raw text data from submitters and feed it into staging tables via Power Automate. The staging-to-production flows (IE-04 through IE-06) validate and resolve text values to proper FK IDs.

---

## Form 1: Industry Engagement — New Organization

**URL slug:** `new-organization`  
**Staging table:** `FormSubmissions_OrganizationIntake`

### Field Specifications

| # | Form Question | Question Type | Required | Maps to Staging Column | Choices (if applicable) |
|---|---|---|---|---|---|
| 1 | Organization Name | Text (short) | Yes | OrganizationName | — |
| 2 | Website | Text (short) | No | Website | — |
| 3 | Headquarters City | Text (short) | No | HeadquartersCity | — |
| 4 | Headquarters State | Choice (dropdown) | No | HeadquartersState | All 50 US states + DC + "International" |
| 5 | Industry | Text (short) | No | Industry | — |
| 6 | Organization Type | Choice (dropdown) | No | OrgType | Corporation, Non-Profit, Government Agency, Government Contractor, Startup, Small Business, University / Academic, Research Lab, Foundation, Trade Association, Other |
| 7 | Ownership Type | Choice (dropdown) | No | OwnershipType | Public, Private, Government, Non-Profit, Cooperative, Other |
| 8 | Growth Stage | Choice (dropdown) | No | GrowthStage | Startup / Seed, Early Stage, Growth, Expansion, Mature, Decline / Restructuring |
| 9 | Priority Level | Choice (dropdown) | No | PriorityLevel | Tier 1 — Strategic, Tier 2 — High, Tier 3 — Medium, Tier 4 — Low, Tier 5 — Inactive / Watch |
| 10 | Contractor Role | Choice (dropdown) | No | ContractorRole | Prime Contractor, Sub-Contractor, Consultant, Teaming Partner, SBIR/STTR Partner, Vendor, Not Applicable, Other |
| 11 | Relationship Level | Choice (dropdown) | No | RelationshipLevel | Strategic Partner, Active Relationship, Developing, Prospect, Dormant, Lost / Inactive |
| 12 | Approximate Employee Count | Text (short) | No | EmployeeCount | — |
| 13 | Approximate Annual Revenue | Text (short) | No | AnnualRevenue | — |
| 14 | Description | Text (long) | No | Description | — |
| 15 | Additional Notes | Text (long) | No | Notes | — |

### Important Setup Notes

- The **Choice dropdown values must exactly match** the seed data in the lookup tables. This is how Power Automate resolves text to IDs.
- Set **"Record name for responses"** to include `Organization Name` for easy identification.
- Enable **"Get email notification of each response"** for the CRM administrator.
- Under **Settings**, enable "Anyone with the link can respond" or restrict to your organization as appropriate.

---

## Form 2: Industry Engagement — New Contact

**URL slug:** `new-contact`  
**Staging table:** `FormSubmissions_ContactIntake`

### Field Specifications

| # | Form Question | Question Type | Required | Maps to Staging Column | Choices (if applicable) |
|---|---|---|---|---|---|
| 1 | First Name | Text (short) | Yes | FirstName | — |
| 2 | Last Name | Text (short) | Yes | LastName | — |
| 3 | Email Address | Text (short) | No | Email | — |
| 4 | Phone Number | Text (short) | No | Phone | — |
| 5 | Job Title | Text (short) | No | JobTitle | — |
| 6 | Organization Name | Text (short) | Yes | OrganizationName | — |
| 7 | Functional Area | Choice (dropdown) | No | FunctionalArea | Engineering, Research & Development, Human Resources / Talent, Executive Leadership, Government Relations, Corporate Social Responsibility, Procurement / Supply Chain, Finance, Marketing / Communications, Legal / Compliance, Information Technology, Operations, Sales / Business Development, Product Management, Other |
| 8 | Influence Level | Choice (dropdown) | No | InfluenceLevel | Decision Maker, Strong Influencer, Moderate Influencer, Limited Influence, Unknown |
| 9 | Risk Tolerance | Choice (dropdown) | No | RiskTolerance | Very High, High, Moderate, Low, Very Low, Unknown |
| 10 | Personal Orientation | Choice (dropdown) | No | PersonalOrientation | Relationship-Driven, Task-Oriented, Data-Driven / Analytical, Visionary / Strategic, Community-Focused, Innovation-Focused, Unknown |
| 11 | LinkedIn URL | Text (short) | No | LinkedInURL | — |
| 12 | Additional Notes | Text (long) | No | Notes | — |

### Important Notes

- **Organization Name** is free text, not a dropdown. Power Automate resolves it against the Organizations table. If the org doesn't exist yet, the processing flow logs an error.
- Consider adding a subtitle: *"Please enter the Organization Name exactly as it appears in the CRM."*

---

## Form 3: Industry Engagement — New Engagement Event

**URL slug:** `new-engagement`  
**Staging table:** `FormSubmissions_EngagementIntake`

### Field Specifications

| # | Form Question | Question Type | Required | Maps to Staging Column | Choices (if applicable) |
|---|---|---|---|---|---|
| 1 | Event Title | Text (short) | Yes | EventTitle | — |
| 2 | Event Date | Date | Yes | EventDate | — |
| 3 | Location | Text (short) | No | Location | — |
| 4 | Organization Name | Text (short) | Yes | OrganizationName | — |
| 5 | Primary Contact Name | Text (short) | No | PrimaryContactName | — |
| 6 | Outreach Motion | Choice (dropdown) | No | OutreachMotion | Inbound Inquiry, Cold Outreach, Warm Introduction, Conference / Event, Alumni Connection, Faculty Referral, Government Program, Career Fair, Advisory Board Meeting, Other |
| 7 | Engagement Type | Choice (dropdown) | No | EngagementType | In-Person Meeting, Virtual Meeting, Phone Call, Email Exchange, Site Visit, Campus Visit, Conference, Career Fair, Workshop, Guest Lecture, Advisory Board, Sponsored Research Discussion, Philanthropy Discussion, MOU / Agreement Signing, Other |
| 8 | Description | Text (long) | No | Description | — |
| 9 | Outcome / Results | Text (long) | No | Outcome | — |
| 10 | Follow-Up Date | Date | No | FollowUpDate | — |
| 11 | Additional Notes | Text (long) | No | Notes | — |

---

## Staging-to-Production Mapping Summary

| Form Field (text) | Staging Column | Resolved To (Production) | Lookup Table |
|---|---|---|---|
| Organization Type | OrgType | OrgTypeID | OrgTypes |
| Ownership Type | OwnershipType | OwnershipTypeID | OwnershipTypes |
| Growth Stage | GrowthStage | GrowthStageID | GrowthStages |
| Priority Level | PriorityLevel | PriorityLevelID | PriorityLevels |
| Contractor Role | ContractorRole | ContractorRoleID | ContractorRoles |
| Relationship Level | RelationshipLevel | RelationshipLevelID | RelationshipLevels |
| Functional Area | FunctionalArea | FunctionalAreaID | FunctionalAreas |
| Influence Level | InfluenceLevel | InfluenceLevelID | InfluenceLevels |
| Risk Tolerance | RiskTolerance | RiskToleranceID | RiskToleranceLevels |
| Personal Orientation | PersonalOrientation | PersonalOrientationID | PersonalOrientations |
| Outreach Motion | OutreachMotion | OutreachMotionID | OutreachMotions |
| Engagement Type | EngagementType | EngagementTypeID | EngagementTypes |
| Organization Name | OrganizationName | OrganizationID | Organizations |
| Primary Contact Name | PrimaryContactName | PrimaryContactID | Contacts |

---

## Manual Steps in Power Platform UI

1. **Create each form manually** in Microsoft Forms — forms cannot be created via API.
2. **Copy the Form ID** from the URL bar after creating each form. Paste it into the corresponding Power Automate flow trigger.
3. **Ensure Choice values match exactly** — copy-paste from the tables above. Any mismatch causes a NULL FK during processing (logged as a warning, not a hard failure).
4. **Test each form** by submitting a sample response, then verify the staging table received the data.
