import { LookupItem, LookupTable } from '@/types';

const lookupData: Record<LookupTable, LookupItem[]> = {
  departments: [
    { id: 1, name: 'Chemical and Biomedical' },
    { id: 2, name: 'Civil and Environmental' },
    { id: 3, name: 'Electrical Engineering and Computer Science' },
    { id: 4, name: 'Engineering and Information Technology' },
    { id: 5, name: 'Industrial and Systems Engineering' },
    { id: 6, name: 'Mechanical and Aerospace Engineering' },
    { id: 7, name: 'Naval Science' },
    { id: 8, name: 'Other' },
  ],
  facultyTitles: [
    { id: 1, name: 'Professor' }, { id: 2, name: 'Associate Professor' },
    { id: 3, name: 'Assistant Professor' }, { id: 4, name: 'Teaching Professor' },
    { id: 5, name: 'Associate Teaching Professor' }, { id: 6, name: 'Assistant Teaching Professor' },
    { id: 7, name: 'Adjunct Professor' }, { id: 8, name: 'Clinical Professor' },
    { id: 9, name: 'Emeritus Professor' }, { id: 10, name: 'Instructor' },
    { id: 11, name: 'Lecturer' }, { id: 12, name: 'Senior Lecturer' },
    { id: 13, name: 'Research Professor' }, { id: 14, name: 'Research Associate Professor' },
    { id: 15, name: 'Research Assistant Professor' }, { id: 16, name: 'Professor of Practice' },
    { id: 17, name: 'Chair' }, { id: 18, name: 'Director' },
    { id: 19, name: 'Dean' }, { id: 20, name: 'Other' },
  ],
  contractorRoles: [
    { id: 1, name: 'Prime Contractor' }, { id: 2, name: 'Sub-Contractor' },
    { id: 3, name: 'Consultant' }, { id: 4, name: 'Teaming Partner' },
    { id: 5, name: 'SBIR/STTR Partner' }, { id: 6, name: 'Vendor' },
    { id: 7, name: 'Not Applicable' }, { id: 8, name: 'Other' },
  ],
  functionalAreas: [
    { id: 1, name: 'Engineering' }, { id: 2, name: 'Research & Development' },
    { id: 3, name: 'Human Resources / Talent' }, { id: 4, name: 'Executive Leadership' },
    { id: 5, name: 'Government Relations' }, { id: 6, name: 'Corporate Social Responsibility' },
    { id: 7, name: 'Procurement / Supply Chain' }, { id: 8, name: 'Finance' },
    { id: 9, name: 'Marketing / Communications' }, { id: 10, name: 'Legal / Compliance' },
    { id: 11, name: 'Information Technology' }, { id: 12, name: 'Operations' },
    { id: 13, name: 'Sales / Business Development' }, { id: 14, name: 'Product Management' },
    { id: 15, name: 'Other' },
  ],
  influenceLevels: [
    { id: 1, name: 'Decision Maker', sortOrder: 1 }, { id: 2, name: 'Strong Influencer', sortOrder: 2 },
    { id: 3, name: 'Moderate Influencer', sortOrder: 3 }, { id: 4, name: 'Limited Influence', sortOrder: 4 },
    { id: 5, name: 'Unknown', sortOrder: 5 },
  ],
  riskToleranceLevels: [
    { id: 1, name: 'Very High', sortOrder: 1 }, { id: 2, name: 'High', sortOrder: 2 },
    { id: 3, name: 'Moderate', sortOrder: 3 }, { id: 4, name: 'Low', sortOrder: 4 },
    { id: 5, name: 'Very Low', sortOrder: 5 }, { id: 6, name: 'Unknown', sortOrder: 6 },
  ],
  personalOrientations: [
    { id: 1, name: 'Relationship-Driven' }, { id: 2, name: 'Task-Oriented' },
    { id: 3, name: 'Data-Driven / Analytical' }, { id: 4, name: 'Visionary / Strategic' },
    { id: 5, name: 'Community-Focused' }, { id: 6, name: 'Innovation-Focused' },
    { id: 7, name: 'Unknown' },
  ],
  orgTypes: [
    { id: 1, name: 'Corporation' }, { id: 2, name: 'Non-Profit' },
    { id: 3, name: 'Government Agency' }, { id: 4, name: 'Government Contractor' },
    { id: 5, name: 'Startup' }, { id: 6, name: 'Small Business' },
    { id: 7, name: 'University / Academic' }, { id: 8, name: 'Research Lab' },
    { id: 9, name: 'Foundation' }, { id: 10, name: 'Trade Association' },
    { id: 11, name: 'Other' },
  ],
  ownershipTypes: [
    { id: 1, name: 'Public' }, { id: 2, name: 'Private' },
    { id: 3, name: 'Government' }, { id: 4, name: 'Non-Profit' },
    { id: 5, name: 'Cooperative' }, { id: 6, name: 'Other' },
  ],
  growthStages: [
    { id: 1, name: 'Startup / Seed', sortOrder: 1 }, { id: 2, name: 'Early Stage', sortOrder: 2 },
    { id: 3, name: 'Growth', sortOrder: 3 }, { id: 4, name: 'Expansion', sortOrder: 4 },
    { id: 5, name: 'Mature', sortOrder: 5 }, { id: 6, name: 'Decline / Restructuring', sortOrder: 6 },
  ],
  priorityLevels: [
    { id: 1, name: 'Tier 1 — Strategic', sortOrder: 1 }, { id: 2, name: 'Tier 2 — High', sortOrder: 2 },
    { id: 3, name: 'Tier 3 — Medium', sortOrder: 3 }, { id: 4, name: 'Tier 4 — Low', sortOrder: 4 },
    { id: 5, name: 'Tier 5 — Inactive / Watch', sortOrder: 5 },
  ],
  relationshipLevels: [
    { id: 1, name: 'Strategic Partner', sortOrder: 1 }, { id: 2, name: 'Active Relationship', sortOrder: 2 },
    { id: 3, name: 'Developing', sortOrder: 3 }, { id: 4, name: 'Prospect', sortOrder: 4 },
    { id: 5, name: 'Dormant', sortOrder: 5 }, { id: 6, name: 'Lost / Inactive', sortOrder: 6 },
  ],
  outreachMotions: [
    { id: 1, name: 'Inbound Inquiry' }, { id: 2, name: 'Cold Outreach' },
    { id: 3, name: 'Warm Introduction' }, { id: 4, name: 'Conference / Event' },
    { id: 5, name: 'Alumni Connection' }, { id: 6, name: 'Faculty Referral' },
    { id: 7, name: 'Government Program' }, { id: 8, name: 'Career Fair' },
    { id: 9, name: 'Advisory Board Meeting' }, { id: 10, name: 'Other' },
  ],
  engagementTypes: [
    { id: 1, name: 'In-Person Meeting' }, { id: 2, name: 'Virtual Meeting' },
    { id: 3, name: 'Phone Call' }, { id: 4, name: 'Email Exchange' },
    { id: 5, name: 'Site Visit' }, { id: 6, name: 'Campus Visit' },
    { id: 7, name: 'Conference' }, { id: 8, name: 'Career Fair' },
    { id: 9, name: 'Workshop' }, { id: 10, name: 'Guest Lecture' },
    { id: 11, name: 'Advisory Board' }, { id: 12, name: 'Sponsored Research Discussion' },
    { id: 13, name: 'Philanthropy Discussion' }, { id: 14, name: 'MOU / Agreement Signing' },
    { id: 15, name: 'Other' },
  ],
  journeyStages: [
    { id: 1, name: 'Identified', sortOrder: 1 }, { id: 2, name: 'Contacted', sortOrder: 2 },
    { id: 3, name: 'Engaged', sortOrder: 3 }, { id: 4, name: 'Active Partnership', sortOrder: 4 },
    { id: 5, name: 'Strategic Alliance', sortOrder: 5 }, { id: 6, name: 'Dormant', sortOrder: 6 },
    { id: 7, name: 'Lost', sortOrder: 7 },
  ],
  opportunityTypes: [
    { id: 1, name: 'Sponsored Research' }, { id: 2, name: 'Philanthropy / Gift' },
    { id: 3, name: 'Capstone Project' }, { id: 4, name: 'Internship / Co-op Program' },
    { id: 5, name: 'Recruitment Partnership' }, { id: 6, name: 'Advisory Board Seat' },
    { id: 7, name: 'Equipment Donation' }, { id: 8, name: 'Licensing / IP' },
    { id: 9, name: 'Joint Venture' }, { id: 10, name: 'Other' },
  ],
  opportunityStages: [
    { id: 1, name: 'Identified', sortOrder: 1 }, { id: 2, name: 'Qualification', sortOrder: 2 },
    { id: 3, name: 'Proposal / Negotiation', sortOrder: 3 }, { id: 4, name: 'Verbal Commitment', sortOrder: 4 },
    { id: 5, name: 'Closed Won', sortOrder: 5 }, { id: 6, name: 'Closed Lost', sortOrder: 6 },
    { id: 7, name: 'On Hold', sortOrder: 7 },
  ],
  opportunityStatuses: [
    { id: 1, name: 'Active' }, { id: 2, name: 'Paused' },
    { id: 3, name: 'Won' }, { id: 4, name: 'Lost' }, { id: 5, name: 'Cancelled' },
  ],
  governmentAlignmentTypes: [
    { id: 1, name: 'DoD STEM / MEEP' }, { id: 2, name: 'NSF Partnership' },
    { id: 3, name: 'DOE Lab Collaboration' }, { id: 4, name: 'NIH Research Affiliation' },
    { id: 5, name: 'SBIR / STTR' }, { id: 6, name: 'State Economic Development' },
    { id: 7, name: 'Federal Earmark / Appropriation' }, { id: 8, name: 'Defense Industrial Base' },
    { id: 9, name: 'Intelligence Community' }, { id: 10, name: 'NASA Collaboration' },
    { id: 11, name: 'Other Federal' }, { id: 12, name: 'Other State / Local' },
  ],
  strategicTags: [
    { id: 1, name: 'Cybersecurity' }, { id: 2, name: 'Artificial Intelligence / ML' },
    { id: 3, name: 'Autonomous Systems' }, { id: 4, name: 'Advanced Manufacturing' },
    { id: 5, name: 'Energy / Sustainability' }, { id: 6, name: 'Biotechnology' },
    { id: 7, name: 'Microelectronics' }, { id: 8, name: 'Quantum Computing' },
    { id: 9, name: 'Space / Aerospace' }, { id: 10, name: 'Supply Chain / Logistics' },
    { id: 11, name: 'Data Science / Analytics' }, { id: 12, name: '5G / Telecommunications' },
    { id: 13, name: 'Health Technology' }, { id: 14, name: 'Workforce Development' },
    { id: 15, name: 'Diversity & Inclusion Partner' }, { id: 16, name: 'Regional Economic Driver' },
  ],
  linkageRoles: [
    { id: 1, name: 'Principal Investigator' }, { id: 2, name: 'Co-PI' },
    { id: 3, name: 'Advisory Board Liaison' }, { id: 4, name: 'Capstone Mentor' },
    { id: 5, name: 'Industry Speaker' }, { id: 6, name: 'Research Collaborator' },
    { id: 7, name: 'Consultant' }, { id: 8, name: 'Thesis Advisor' },
    { id: 9, name: 'Program Director' }, { id: 10, name: 'Other' },
  ],
  industrySectors: [],
  subsectors: [],
  seniorityLevels: [],
  contactTypes: [],
  personaTypes: [],
  partnershipStages: [],
  ecosystemEntityTypes: [],
  interestAreas: [],
};

export function getLookup(table: LookupTable): LookupItem[] {
  return lookupData[table] ?? [];
}

export function lookupName(table: LookupTable, id?: number): string {
  if (id === undefined || id === null) return '—';
  return lookupData[table]?.find(i => i.id === id)?.name ?? '—';
}

export default lookupData;
