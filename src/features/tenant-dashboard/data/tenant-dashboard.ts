import type { TenantDashboard } from "../types";
import {
  buildBillingUnitRecords,
  buildComplaintCases,
  buildFeedbackItems,
  buildStrataRegistration,
  buildUserApprovals,
  buildVisitorApprovals,
  buildVisitorBuildingConfigs,
} from "./shared-property-adapters";

export const tenantDashboardData: TenantDashboard = {
  tenantName: "Serene Heights Management",
  unitLabel: "Building Admin • Portfolio View",
  greeting: "Building Operations Dashboard",
  overview:
    "A building-admin workspace for communications, complaints, visitor control, document governance, billing operations, and building records.",
  stats: [
    {
      id: "cases",
      label: "Open Complaints",
      value: "12",
      hint: "Resident cases awaiting assignment, field action, or closure",
      tone: "warning"
    },
    {
      id: "visitors",
      label: "Pending Visitor Requests",
      value: "7",
      hint: "Guest approvals still pending parking or host validation",
      tone: "brand"
    },
    {
      id: "announcements",
      label: "Live Announcements",
      value: "4",
      hint: "Active resident-facing notices currently published",
      tone: "success"
    }
  ],
  actions: [
    {
      id: "publish-announcement",
      title: "Publish Notice",
      description: "Create and publish a building-wide resident communication."
    },
    {
      id: "review-complaints",
      title: "Review Complaints",
      description: "Assign vendors, track status, and review resident evidence."
    },
    {
      id: "upload-documents",
      title: "Upload Documents",
      description: "Add circulars, statements, by-laws, and building reference files."
    },
    {
      id: "configure-strata",
      title: "Update Building Structure",
      description: "Add buildings, areas, and units into the managed structure."
    },
    {
      id: "billing-import",
      title: "Import Billing",
      description: "Upload charges from CSV and validate targeting before release."
    },
    {
      id: "approvals",
      title: "Review Approvals",
      description: "Approve submitted occupants and household records at unit level."
    }
  ],
  modules: [
    {
      id: "announcements",
      title: "Communications",
      status: "Core",
      description: "Resident communications for urgent notices, maintenance alerts, and circulars.",
      items: ["Publish notice", "Archive", "Audience context", "Attachments"]
    },
    {
      id: "support",
      title: "Complaint Operations",
      status: "Core",
      description: "Service-case operations with vendor assignment and case progression.",
      items: ["Complaint queue", "Evidence review", "Status control", "Vendor matching"]
    },
    {
      id: "visitors",
      title: "Visitor Control",
      status: "Core",
      description: "Approval and capacity controls for guest access and parking.",
      items: ["Approval queue", "Date schedule", "Quota control", "Calendar view"]
    },
    {
      id: "documents",
      title: "Document Repository",
      status: "Core",
      description: "Management-owned documents and reference files visible to building stakeholders.",
      items: ["Category filter", "Search", "Upload flow", "View/download"]
    },
    {
      id: "billing",
      title: "Billing Operations",
      status: "Shared",
      description: "Charge imports and release controls before billing is pushed to units.",
      items: ["Batch import", "Validation", "Error review", "Push control"]
    },
    {
      id: "strata",
      title: "Strata Structure",
      status: "Admin",
      description: "The building and unit registry used by downstream admin workflows.",
      items: ["Building tree", "Area management", "Unit records", "Operational settings"]
    }
  ],
  activities: [
    {
      id: "notice-published",
      title: "Water disruption notice published for Tower A and Tower B",
      meta: "Today • 09:15 AM",
      tone: "warning"
    },
    {
      id: "visitor-approved",
      title: "Three visitor requests approved for tomorrow’s arrivals",
      meta: "Today • 08:40 AM",
      tone: "success"
    },
    {
      id: "billing-batch",
      title: "April maintenance billing batch imported for validation",
      meta: "24 Apr 2026 • 11:00 AM",
      tone: "brand"
    }
  ],
  pages: {
    overview: {
      title: "Overview",
      description: "A control-desk view of the building team’s active operational priorities.",
      sections: [
        {
          id: "attention",
          title: "Needs Attention",
          description: "Immediate items that should stay visible on the landing page.",
          ctaLabel: "Review all",
          items: [
            {
              id: "due-balance",
              title: "Outstanding balance due in 5 days",
              description: "RM 412.00 across maintenance, sinking fund and water bill.",
              meta: "Finance"
            },
            {
              id: "support-case",
              title: "Lift lobby complaint awaiting management update",
              description: "Case SC-203 remains open and requires review.",
              meta: "Support"
            }
          ]
        },
        {
          id: "recent-moves",
          title: "Operational Activity",
          description: "Recent admin-side actions across the building workflow.",
          items: [
            {
              id: "visitor",
              title: "Visitor pass approved for Hannah Lee",
              description: "Guest pass is ready for guard house validation.",
              meta: "Yesterday • 06:40 PM",
              tone: "success"
            },
            {
              id: "notice",
              title: "Water supply interruption acknowledged",
              description: "Tower A maintenance notice marked as read.",
              meta: "Today • 09:15 AM",
              tone: "warning"
            }
          ]
        }
      ]
    },
    billing: {
      title: "Billing Import",
      description: "Push validated charges, review billing by unit, track payment status, and record offline transactions when needed.",
      sections: [
        {
          id: "import-policy",
          title: "Import Rules",
          description: "Use resident code as the primary match key and fall back to unit code only when needed.",
          ctaLabel: "Download sample CSV",
          items: [
            {
              id: "match-1",
              title: "Primary match via resident code",
              description: "A valid resident code should push billing to the exact approved unit member.",
              meta: "Preferred key"
            },
            {
              id: "match-2",
              title: "Fallback match via unit code",
              description: "If resident code is blank, the system can still target the unit-level record.",
              meta: "Fallback path"
            },
            {
              id: "match-3",
              title: "Do not push invalid rows",
              description: "Rows missing amount, due date, billing type or both matching keys should stay blocked.",
              meta: "Validation"
            }
          ]
        },
        {
          id: "batch-behaviour",
          title: "Batch Behaviour",
          description: "Every imported CSV stays in a batch so admin can review and push later.",
          items: [
            {
              id: "batch-1",
              title: "Draft batch",
              description: "Rows remain editable in principle until the admin confirms the push action.",
              meta: "Pre-push state"
            },
            {
              id: "batch-2",
              title: "Ready rows only",
              description: "Only validated rows should be included when pushing billing to tenants.",
              meta: "Push rule"
            }
          ]
        }
      ]
    },
    visitors: {
      title: "Visitor Approvals",
      description: "Review visitor requests and control building parking quota before approval.",
      sections: [
        {
          id: "quota-policy",
          title: "Quota Policy",
          description: "Parking approval must respect the configured building quota before the pass is confirmed.",
          ctaLabel: "Review quota",
          items: [
            {
              id: "quota-1",
              title: "Parking quota is building-specific",
              description: "Each building keeps its own visitor parking limit and remaining balance.",
              meta: "Building-level setting"
            },
            {
              id: "quota-2",
              title: "Pending requests do not consume slots",
              description: "Only approved visitor requests should reduce the parking quota left.",
              meta: "Allocation rule",
              tone: "warning"
            }
          ]
        },
        {
          id: "visitor-review",
          title: "Visitor Review Notes",
          description: "Admin should validate host, visit window, and parking demand before approval.",
          items: [
            {
              id: "review-1",
              title: "Match to resident and unit",
              description: "The visitor request must still point to a valid host resident and exact unit.",
              meta: "Host check"
            },
            {
              id: "review-2",
              title: "Escalate large vehicle demand",
              description: "Requests needing multiple parking slots should be reviewed carefully against remaining quota.",
              meta: "Parking review"
            }
          ]
        }
      ]
    },
    documents: {
      title: "Document Centre",
      description: "Management-owned building documents, circulars, and downloadable reference files.",
      sections: [
        {
          id: "requests",
          title: "Document Requests",
          description: "The request form entry and request queue should live here.",
          ctaLabel: "Request document",
          items: [
            {
              id: "statement",
              title: "Account Statement",
              description: "Requested monthly statement for loan documentation.",
              meta: "Submitted • 24 Apr 2026"
            },
            {
              id: "residence-letter",
              title: "Residence Confirmation Letter",
              description: "Pending management preparation and signature.",
              meta: "In progress"
            }
          ]
        },
        {
          id: "library",
          title: "Available Files",
          description: "Skeleton list of downloadable files and previews.",
          items: [
            {
              id: "house-rules",
              title: "House Rules Handbook",
              description: "Latest community guidelines and move-in policy.",
              meta: "PDF • 1.8 MB"
            },
            {
              id: "renovation-form",
              title: "Renovation Form",
              description: "Template for renovation approval submission.",
              meta: "DOCX • 220 KB"
            }
          ]
        }
      ]
    },
    support: {
      title: "Complaint Management",
      description: "Review resident-submitted complaints, assign vendors, and track service execution.",
      sections: [
        {
          id: "assignment-policy",
          title: "Assignment Policy",
          description: "Each complaint should be assigned to the correct vendor trade and tracked with a clear status.",
          ctaLabel: "Review vendors",
          items: [
            {
              id: "assign-1",
              title: "Vendor assignment should match trade",
              description: "Electrical, plumbing, security and facilities complaints should route to the right vendor pool.",
              meta: "Dispatch rule"
            },
            {
              id: "assign-2",
              title: "Status must reflect field progress",
              description: "Move from new to assigned, in progress, resolved and closed as the case advances.",
              meta: "Workflow",
              tone: "brand"
            }
          ]
        },
        {
          id: "response-policy",
          title: "Response Notes",
          description: "Keep resident visibility and vendor follow-through aligned.",
          items: [
            {
              id: "response-1",
              title: "High priority cases first",
              description: "Critical resident-impact complaints should be assigned immediately.",
              meta: "Priority rule",
              tone: "warning"
            },
            {
              id: "response-2",
              title: "Update latest action visibly",
              description: "Every case should show the most recent operational update for management review.",
              meta: "Audit trail"
            }
          ]
        }
      ]
    },
    feedback: {
      title: "Building Feedback",
      description: "Review management-building feedback, understand sentiment, and inspect the original submission payload.",
      sections: [
        {
          id: "triage",
          title: "Triage Policy",
          description: "Feedback should be classified quickly so product, operations, and support teams can act on the right issues.",
          ctaLabel: "Review payload",
          items: [
            {
              id: "triage-1",
              title: "Check category and sentiment first",
              description: "Separate bug reports from feature requests and general experience feedback before routing internally.",
              meta: "Initial review"
            },
            {
              id: "triage-2",
              title: "Preserve raw submission context",
              description: "Portal metadata such as version, active form, and submission source should stay visible for audit and debugging.",
              meta: "Submission integrity",
              tone: "brand"
            }
          ]
        },
        {
          id: "follow-up",
          title: "Follow-Up Notes",
          description: "Not every message needs a direct reply, but critical issues should leave a clear audit trail.",
          items: [
            {
              id: "follow-up-1",
              title: "Escalate repeat bugs immediately",
              description: "Repeated failures tied to one release or device cohort should be grouped and shared with engineering.",
              meta: "Release watch",
              tone: "warning"
            },
            {
              id: "follow-up-2",
              title: "Use resident language in summaries",
              description: "Keep the short summary close to the user’s own wording so downstream teams understand the actual complaint.",
              meta: "Context retention"
            }
          ]
        }
      ]
    },
    announcements: {
      title: "Announcements",
      description: "Featured notices, maintenance alerts and read/archive management.",
      sections: [
        {
          id: "featured",
          title: "Featured Notices",
          description: "Hero notices and urgent building updates should be elevated here.",
          items: [
            {
              id: "water-main",
              title: "Domestic water pipe rectification",
              description: "Water supply to Tower A and Tower B will be interrupted from 10:00 AM to 4:00 PM.",
              meta: "Urgent maintenance",
              tone: "warning"
            },
            {
              id: "lift-refurbishment",
              title: "Lift interior refurbishment",
              description: "Tower C refurbishment works begin next Monday with one lift remaining active.",
              meta: "Community update",
              tone: "brand"
            }
          ]
        },
        {
          id: "archive",
          title: "Archive Skeleton",
          description: "Filterable rows for older communications.",
          items: [
            {
              id: "archive-1",
              title: "Swimming pool maintenance notice",
              description: "Routine cleaning and closure schedule.",
              meta: "18 Apr 2026"
            },
            {
              id: "archive-2",
              title: "Festive parcel room extension",
              description: "Temporary extension of parcel room operating hours.",
              meta: "10 Apr 2026"
            }
          ]
        }
      ]
    },
    access: {
      title: "Admin Access",
      description: "Manage building-admin accounts, role permissions, security controls, and access audit activity.",
      sections: [
        {
          id: "admin-users",
          title: "Admin Users",
          description: "Operations, finance, communications, and guardhouse staff should each have the correct access scope.",
          ctaLabel: "Add admin",
          items: [
            {
              id: "mgr-1",
              title: "Building manager account",
              description: "The primary building manager should keep full operations visibility across all modules.",
              meta: "Core admin"
            },
            {
              id: "ops-1",
              title: "Operations desk account",
              description: "Complaint and visitor-review users should not inherit finance publishing permissions.",
              meta: "Scoped role"
            }
          ]
        },
        {
          id: "security",
          title: "Security Controls",
          description: "Sensitive actions should stay behind verification, approval rules, and visible audit trails.",
          items: [
            {
              id: "security-1",
              title: "Enforce MFA for privileged roles",
              description: "Super admins, finance staff, and building managers should always authenticate with MFA.",
              meta: "Security baseline",
              tone: "warning"
            },
            {
              id: "security-2",
              title: "Track every billing push and role change",
              description: "The audit log should preserve who changed permissions and who released financial actions.",
              meta: "Accountability"
            }
          ]
        }
      ]
    },
    strata: {
      title: "Building Registration",
      description: "Manage the building structure, browse areas and units in one tree, and keep the operational registry clean.",
      sections: [
        {
          id: "registration-overview",
          title: "Registration Overview",
          description: "Administrative notes and validation reminders for the building setup workflow.",
          items: [
            {
              id: "overview-1",
              title: "Keep the hierarchy clean",
              description: "Buildings should contain areas or blocks, and areas should contain unit records only.",
              meta: "Validation rule"
            },
            {
              id: "overview-2",
              title: "Uploads are node-specific",
              description: "Documents attached to an area stay scoped to that area. Unit uploads stay with the unit record.",
              meta: "Attachment mapping"
            }
          ]
        }
      ]
    },
    approvals: {
      title: "Occupant Approvals",
      description: "Review submitted occupants before they are attached to the final unit record.",
      sections: [
        {
          id: "approval-policy",
          title: "Approval Policy",
          description: "Keep review at the member-to-unit level so only the exact person is approved.",
          items: [
            {
              id: "policy-1",
              title: "Approve per member",
              description: "Do not activate a whole household record when only one unit member is under review.",
              meta: "Unit-level control"
            },
            {
              id: "policy-2",
              title: "Reject incomplete records",
              description: "Missing or expired documents should block unit access until re-submission.",
              meta: "Compliance",
              tone: "warning"
            }
          ]
        }
      ]
    }
  },
  strata: buildStrataRegistration(),
  approvals: {
    title: "Unit Member Approval Queue",
    description: "Tenant admin reviews the smallest unit member registration before access is activated.",
    approvals: buildUserApprovals()
  },
  billingAdmin: {
    title: "Billing Records & Push Control",
    description: "Review billing in a building tree, add single unit charges when needed, push validated charges, and record offline settlement received by management.",
    helperTitle: "Billing Record Detail",
    helperDescription: "Review the unit ledger first, then record offline settlement only when the management office has verified the payment.",
    batches: [
      {
        id: "billing-batch-seed-apr-2026",
        fileName: "april-2026-maintenance.csv",
        importedAt: "27 Apr 2026 • 10:15 AM",
        status: "ready",
        rows: [
          {
            id: "billing-row-1",
            residentCode: "RES-A1208-2026",
            unitCode: "A-12-08",
            billingType: "Maintenance",
            amount: 220,
            dueDate: "2026-05-05",
            description: "April 2026 maintenance charges",
            reference: "APR-MTN-A1208",
            matchSource: "resident_code",
            status: "ready",
            errors: []
          },
          {
            id: "billing-row-2",
            residentCode: "",
            unitCode: "B-04-11",
            billingType: "Water",
            amount: 72,
            dueDate: "2026-05-05",
            description: "March 2026 metered water bill",
            reference: "APR-WTR-B0411",
            matchSource: "unit_code",
            status: "ready",
            errors: []
          },
          {
            id: "billing-row-3",
            residentCode: "",
            unitCode: "",
            billingType: "Sinking Fund",
            amount: 120,
            dueDate: "2026-05-05",
            description: "April 2026 sinking fund contribution",
            reference: "APR-SNK-UNMATCHED",
            matchSource: "unmatched",
            status: "error",
            errors: ["Either resident_code or unit_code is required."]
          }
        ]
      }
    ],
    unitRecords: buildBillingUnitRecords()
  },
  documentsAdmin: {
    title: "Document Centre",
    description: "Browse uploaded files, filter by category, and add new management documents with a clear resident-facing description.",
    searchPlaceholder: "Find a specific file...",
    uploadTitle: "Upload Document",
    uploadDescription: "Add a document, assign a category, and provide the resident-facing description shown in the web and mobile repository.",
    categories: [
      {
        id: "house-rules",
        title: "By-Laws",
        description: "House Rules",
        featured: true
      },
      {
        id: "agm-minutes",
        title: "AGM Minutes",
        description: "Meeting Logs",
        featured: false
      },
      {
        id: "circulars",
        title: "Circulars",
        description: "Announcements",
        featured: false
      },
      {
        id: "financials",
        title: "Statements",
        description: "Accounts & Finance",
        featured: false
      }
    ],
    repository: {
      title: "Recently Uploaded",
      viewAllLabel: "View All",
      tableHeaders: {
        fileName: "FILE NAME",
        description: "DESCRIPTION",
        actions: "ACTIONS"
      }
    },
    items: [
      {
        id: "renovation-guidelines-2026",
        title: "Renovation_Guidelines_2026.pdf",
        sizeLabel: "2.4 MB",
        description: "Guidelines for unit renovation, contractor registration, and renovation deposit requirements.",
        categoryId: "house-rules",
        categoryLabel: "By-Laws",
        fileTypeLabel: "PDF",
        tone: "danger",
        updatedAtLabel: "Updated 15 May 2026",
        previewTitle: "Renovation Guidelines 2026",
        previewBody: "This resident document covers approved renovation hours, contractor access rules, renovation deposits, and core by-law requirements.",
        fileUrl: "/samples/billing-import-template.csv"
      },
      {
        id: "agm-minutes-2025",
        title: "AGM_Minutes_2025.docx",
        sizeLabel: "856 KB",
        description: "Minutes recorded during the annual general meeting with resolutions and voting updates.",
        categoryId: "agm-minutes",
        categoryLabel: "AGM Minutes",
        fileTypeLabel: "DOCX",
        tone: "info",
        updatedAtLabel: "Updated 21 Apr 2026",
        previewTitle: "AGM Minutes 2025",
        previewBody: "This document summarizes agenda items, resolutions passed, JMB updates, and maintenance matters recorded during the AGM."
      },
      {
        id: "management-statement-fy2025",
        title: "Management_Statement_FY2025.xlsx",
        sizeLabel: "4.1 MB",
        description: "Summary of maintenance collections, sinking fund balances, and major operating expenses.",
        categoryId: "financials",
        categoryLabel: "Statements",
        fileTypeLabel: "XLSX",
        tone: "success",
        updatedAtLabel: "Updated 09 May 2026",
        previewTitle: "Management Statement FY2025",
        previewBody: "This statement provides a summary of maintenance income, sinking fund allocation, arrears, and major operating expenses for the property."
      },
      {
        id: "lift-refurbishment-circular",
        title: "Lift_Refurbishment_Circular.pdf",
        sizeLabel: "1.3 MB",
        description: "Circular on lift refurbishment schedule and expected service impact by tower.",
        categoryId: "circulars",
        categoryLabel: "Circulars",
        fileTypeLabel: "PDF",
        tone: "neutral",
        updatedAtLabel: "Updated 11 May 2026",
        previewTitle: "Lift Refurbishment Circular",
        previewBody: "This circular outlines the work schedule, affected towers, and access guidance for residents during refurbishment."
      }
    ]
  },
  visitorAdmin: {
    title: "Visitor Approval Queue",
    description: "Approve guest access and parking allocation against the configured quota for each building.",
    helperTitle: "Building Parking Config",
    helperDescription: "Set the total visitor parking quota at the building level. Remaining slots are calculated from approved visitor requests.",
    buildingConfigs: buildVisitorBuildingConfigs(),
    approvals: buildVisitorApprovals()
  },
  supportAdmin: {
    title: "Complaint Operations",
    description: "Monitor submitted complaints, assign the right vendor, and move cases through the operational workflow.",
    helperTitle: "Vendor Assignment",
    helperDescription: "Assign complaints to the correct trade vendor first, then update status as work progresses on site.",
    vendors: [
      {
        id: "vendor-elec-1",
        name: "Brightline Electrical Services",
        trade: "Electrical",
        phone: "+60 12-555 1102"
      },
      {
        id: "vendor-plumb-1",
        name: "Flowfix Plumbing Works",
        trade: "Plumbing",
        phone: "+60 19-240 6618"
      },
      {
        id: "vendor-fac-1",
        name: "Prime Facility Response",
        trade: "Facilities",
        phone: "+60 17-880 2204"
      },
      {
        id: "vendor-sec-1",
        name: "Guardian Access Systems",
        trade: "Security",
        phone: "+60 13-714 9080"
      }
    ],
    complaints: buildComplaintCases()
  },
  feedbackAdmin: {
    title: "Building Feedback Inbox",
    description: "A review queue for feedback submitted through the building management workflow, including the original payload for audit and operational context.",
    helperTitle: "Feedback Detail",
    helperDescription: "Read the summary first, then inspect the raw payload to understand submission context, version, and source metadata.",
    items: buildFeedbackItems()
  },
  announcementAdmin: {
    title: "Announcement Operations",
    description: "Review resident notices, urgent maintenance alerts, and community updates using the same content model shown in the mobile app.",
    helperTitle: "Announcement Detail",
    helperDescription: "Each announcement carries resident-facing content blocks, affected area details, attachments, and escalation contact information.",
    labels: {
      category: "Category",
      publishedAt: "Published",
      affectedArea: "Affected Area",
      schedule: "Schedule",
      contact: "Contact",
      attachmentsTitle: "Attachments"
    },
    items: [
      {
        id: "water-main-repair",
        badge: "URGENT MAINTENANCE",
        badgeTone: "danger",
        title: "Domestic Water Pipe Rectification",
        description: "Notice of temporary water disruption affecting selected towers due to urgent rectification works at the pump room.",
        icon: "construct-outline",
        accentColor: "#E77A34",
        publishedAt: "23 Apr 2026 • 09:15 AM",
        affectedArea: "Tower A, Tower B, podium toilets, and common facilities water points",
        schedule: "Estimated completion by 4:00 PM today",
        contact: "Management Office • Guard House Hotline",
        summaryTitle: "The Situation",
        summaryParagraphs: [
          "At approximately 8:45 AM today, the on-site team detected a leak at the domestic water pipe near the pump room. To allow urgent rectification works, water supply has been temporarily isolated for the affected towers and common areas below."
        ],
        highlightedAreaTitle: "Affected Areas",
        highlightedAreaItems: [
          "Tower A and Tower B residential units",
          "Podium toilets and cleaner rooms",
          "Surau and multipurpose hall water points"
        ],
        timelineTitle: "Resolution Timeline",
        timelineParagraphs: [
          "The appointed contractor is currently rectifying the affected pipe section. Works are expected to complete by 4:00 PM today, subject to site conditions. When supply resumes, residents may notice temporary air or slight discoloration in the water. Please run the tap for one to two minutes before use."
        ],
        etaLabel: "Estimated Time",
        etaValue: "Until 4:00 PM today",
        teamLabel: "Team Assigned",
        teamValue: "Aqua Mech Engineering",
        attachments: [
          {
            id: "official-notice",
            title: "Water_Interruption_Notice_23042026.pdf",
            meta: "2.4 MB • PDF Document",
            type: "pdf"
          },
          {
            id: "affected-zone-map",
            title: "Affected_Towers_Map.jpg",
            meta: "1.1 MB • Image",
            type: "image"
          }
        ],
        supportTitle: "Still have questions?",
        supportDescription: "Contact the management office or guard house if you need urgent assistance during the interruption.",
        imageUri:
          "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "elevator-modernization",
        badge: "COMMUNITY UPDATE",
        badgeTone: "brand",
        title: "Lift Interior Refurbishment",
        description: "Lift refurbishment works will begin next week at Tower C with phased closures to reduce inconvenience.",
        icon: "business-outline",
        accentColor: "#50636F",
        publishedAt: "20 Apr 2026 • 04:30 PM",
        affectedArea: "Tower C passenger lifts and ground floor lobby",
        schedule: "Works scheduled from 29 Apr to 10 May 2026",
        contact: "Management Office",
        summaryTitle: "The Situation",
        summaryParagraphs: [
          "The lift refurbishment project will upgrade cabin finishes, control panels, and lighting for Tower C. One lift will remain operational throughout the work period to maintain resident access."
        ],
        highlightedAreaTitle: "Impacted Zones",
        highlightedAreaItems: [
          "Tower C passenger lifts",
          "Ground floor drop-off and lift lobby",
          "Move-in, move-out, and contractor access scheduling"
        ],
        timelineTitle: "Resolution Timeline",
        timelineParagraphs: [
          "Contractors will take one lift offline at a time to minimise disruption. Waiting time may be longer during peak periods, especially before office hours and after dinner. Notices and temporary directional signage will be placed at the lobby during each phase."
        ],
        etaLabel: "Project Duration",
        etaValue: "12 days scheduled",
        teamLabel: "Team Assigned",
        teamValue: "Kone Elevators Malaysia",
        attachments: [
          {
            id: "upgrade-schedule",
            title: "Lift_Upgrade_Schedule.pdf",
            meta: "1.8 MB • PDF Document",
            type: "pdf"
          }
        ],
        supportTitle: "Need access coordination?",
        supportDescription: "Contact management if you need lift booking support for movers, deliveries, or elderly residents.",
        imageUri:
          "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  },
  accessAdmin: {
    title: "Admin Users & Access Control",
    description: "Manage building-admin accounts, role scopes, security posture, and access activity in one place.",
    helperTitle: "Admin Access Detail",
    helperDescription: "Review the assigned role, current access state, and security controls before changing admin privileges.",
    users: [
      {
        id: "admin-1",
        fullName: "Amira Zulkifli",
        email: "amira.zulkifli@sereneheights.com",
        roleId: "role-building-manager",
        roleLabel: "Building Manager",
        status: "active",
        phone: "+60 12-441 9082",
        lastActive: "Today • 09:18 AM",
        mfaEnabled: true,
        assignedBuildings: ["Tower A", "Tower B", "Retail Podium"],
        inviteStateLabel: "Accepted invite"
      },
      {
        id: "admin-2",
        fullName: "Daniel Khoo",
        email: "daniel.khoo@sereneheights.com",
        roleId: "role-operations",
        roleLabel: "Operations Staff",
        status: "active",
        phone: "+60 17-630 1194",
        lastActive: "Today • 08:42 AM",
        mfaEnabled: true,
        assignedBuildings: ["Tower A", "Tower B"],
        inviteStateLabel: "Accepted invite"
      },
      {
        id: "admin-3",
        fullName: "Nur Izzah",
        email: "nur.izzah@sereneheights.com",
        roleId: "role-finance",
        roleLabel: "Finance Staff",
        status: "active",
        phone: "+60 19-288 3024",
        lastActive: "26 Apr 2026 • 05:14 PM",
        mfaEnabled: true,
        assignedBuildings: ["Portfolio-wide"],
        inviteStateLabel: "Accepted invite"
      },
      {
        id: "admin-4",
        fullName: "Guardhouse Desk",
        email: "guardhouse@sereneheights.com",
        roleId: "role-security",
        roleLabel: "Security Desk",
        status: "active",
        phone: "+60 3-8891 1102",
        lastActive: "Today • 07:56 AM",
        mfaEnabled: false,
        assignedBuildings: ["Main guardhouse"],
        inviteStateLabel: "Legacy account"
      },
      {
        id: "admin-5",
        fullName: "Hafizah Omar",
        email: "hafizah.omar@sereneheights.com",
        roleId: "role-comms",
        roleLabel: "Communications Staff",
        status: "invited",
        phone: "+60 16-220 7345",
        lastActive: "Pending first login",
        mfaEnabled: false,
        assignedBuildings: ["Tower A", "Tower C"],
        inviteStateLabel: "Invite expires in 2 days"
      }
    ],
    roles: [
      {
        id: "role-super-admin",
        name: "Super Admin",
        scope: "All modules",
        description: "Full system control including admin management, billing release, and structure edits.",
        modules: ["Announcements", "Complaints", "Visitors", "Documents", "Billing", "Strata", "Approvals", "Admin Access"],
        permissions: ["View", "Create", "Edit", "Approve", "Delete", "Export"]
      },
      {
        id: "role-building-manager",
        name: "Building Manager",
        scope: "Operational control",
        description: "Cross-module oversight for day-to-day building administration and final approvals.",
        modules: ["Announcements", "Complaints", "Visitors", "Documents", "Approvals", "Admin Access"],
        permissions: ["View", "Create", "Edit", "Approve", "Export"]
      },
      {
        id: "role-operations",
        name: "Operations Staff",
        scope: "Resident operations",
        description: "Handles complaints, visitor requests, and occupant approvals without finance controls.",
        modules: ["Complaints", "Visitors", "Approvals", "Documents"],
        permissions: ["View", "Edit", "Approve"]
      },
      {
        id: "role-finance",
        name: "Finance Staff",
        scope: "Billing control",
        description: "Reviews imports and pushes charges, but does not manage announcements or building setup.",
        modules: ["Billing", "Documents"],
        permissions: ["View", "Create", "Edit", "Approve", "Export"]
      },
      {
        id: "role-comms",
        name: "Communications Staff",
        scope: "Resident notices",
        description: "Publishes building announcements and maintains resident-facing documents.",
        modules: ["Announcements", "Documents"],
        permissions: ["View", "Create", "Edit", "Publish"]
      },
      {
        id: "role-security",
        name: "Security Desk",
        scope: "Visitor gatekeeping",
        description: "Checks guest approvals and access schedules at guardhouse level.",
        modules: ["Visitors"],
        permissions: ["View", "Approve"]
      }
    ],
    securityControls: [
      {
        id: "security-control-1",
        title: "MFA required for privileged roles",
        description: "Building manager, super admin, and finance users must pass MFA before entering the console.",
        meta: "4 of 5 active privileged accounts compliant"
      },
      {
        id: "security-control-2",
        title: "Billing push requires approver role",
        description: "Only users with billing approval rights can release validated import batches to residents.",
        meta: "Maker-checker enabled"
      },
      {
        id: "security-control-3",
        title: "Role changes are audit logged",
        description: "Any account suspension, reactivation, or permission change creates a searchable access event.",
        meta: "Retention: 180 days"
      }
    ],
    auditEntries: [
      {
        id: "audit-1",
        title: "Billing approval rights granted to Nur Izzah",
        description: "Finance role was updated to include push approval for monthly charge imports.",
        meta: "Today • 08:55 AM • Updated by Amira Zulkifli",
        tone: "warning"
      },
      {
        id: "audit-2",
        title: "Guardhouse Desk signed in from the main security terminal",
        description: "Legacy account accessed the visitor workflow before the morning arrival queue opened.",
        meta: "Today • 07:56 AM • Security terminal",
        tone: "brand"
      },
      {
        id: "audit-3",
        title: "Invitation sent to Hafizah Omar for communications access",
        description: "A new account was created for announcement publishing and document updates.",
        meta: "26 Apr 2026 • 03:24 PM • Invite email issued",
        tone: "success"
      }
    ]
  }
};
