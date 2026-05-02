import {
  sharedBillingAccounts,
  sharedPropertyBuildings,
  type SharedBillingAccount,
} from "./property-domain";
import type {
  BillingLedgerEntry,
  BillingUnitPaymentStatus,
  BillingUnitRecord,
  ComplaintCase,
  FeedbackItem,
  StrataRegistration,
  StrataTreeNode,
  UnitMemberApproval,
  VisitorParkingQuotaConfig,
  VisitorApproval,
} from "../types";
import { listSharedPropertyUnits } from "./property-domain";

function isPastDue(dueDate: string) {
  const due = new Date(`${dueDate}T23:59:59`);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function getPaymentMethod(methodId: string): BillingLedgerEntry["method"] {
  switch (methodId) {
    case "offline_cheque":
      return "offline_cheque";
    case "offline_cash":
      return "offline_cash";
    case "offline_bank_transfer":
      return "offline_bank_transfer";
    default:
      return "online";
  }
}

function buildCountsLabel(areaCount: number, unitCount: number) {
  return areaCount > 0 ? `${areaCount} areas • ${unitCount} units` : `${unitCount} units`;
}

function buildUnitStatus(account: SharedBillingAccount | undefined): BillingUnitPaymentStatus {
  if (!account) {
    return "unpaid";
  }

  const totalBilled = account.charges.reduce((sum, charge) => sum + charge.amount, 0);
  const totalPaid = account.payments
    .filter((payment) => payment.status === "successful")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = Math.max(totalBilled - totalPaid, 0);

  if (outstanding <= 0) {
    return "paid";
  }

  if (isPastDue(account.charges[0]?.dueDate ?? "")) {
    return "overdue";
  }

  return totalPaid > 0 ? "partial" : "unpaid";
}

export function buildStrataRegistration(): StrataRegistration {
  const tree: StrataTreeNode[] = sharedPropertyBuildings.map((building) => {
    const unitCount = building.areas.reduce((sum, area) => sum + area.units.length, 0);

    return {
      id: `building-${building.buildingCode.toLowerCase()}`,
      type: "building",
      name: building.buildingName,
      code: building.buildingCode,
      status: building.status,
      countsLabel: buildCountsLabel(building.areas.length, unitCount),
      documentsExpected: building.documentsExpected,
      children: building.areas.map((area) => ({
        id: `area-${area.areaCode.toLowerCase()}`,
        type: "area",
        name: area.areaName,
        code: area.areaCode,
        status: area.status,
        countsLabel: `${area.units.length} units`,
        documentsExpected: area.documentsExpected,
        children: area.units.map((unit) => ({
          id: `unit-${unit.unitCode.toLowerCase()}`,
          type: "unit",
          name: unit.unitName,
          code: unit.unitCode,
          status: unit.status,
          countsLabel: `${unit.documentsExpected.length} records expected`,
          documentsExpected: unit.documentsExpected,
        })),
      })),
    };
  });

  return {
    title: "Building Registration",
    description:
      "A hierarchical registry for building, area, and unit setup with document assignment at each level.",
    helperTitle: "Upload Mapping",
    helperDescription:
      "Use area-level uploads for shared plans, permits and compliance files. Use unit-level uploads for titles, resident forms or supporting records tied to one unit.",
    uploadsByNode: {},
    tree,
  };
}

export function buildBillingUnitRecords(): BillingUnitRecord[] {
  return sharedBillingAccounts.map((account) => {
    const paymentEntries = account.payments.map((payment) => {
      const source: BillingLedgerEntry["source"] =
        payment.source === "building_admin" ? "building_admin" : "system";

      return {
        id: `ledger-${payment.id}`,
        kind: "payment" as const,
        postedAt: payment.paidAt,
        amount: payment.amount,
        reference: payment.reference,
        description: payment.description,
        source,
        method: getPaymentMethod(payment.methodId),
      };
    });

    const ledger: BillingLedgerEntry[] = [
      ...account.charges.map((charge) => ({
        id: `ledger-${charge.id}`,
        kind: "charge" as const,
        postedAt: charge.postedAt,
        amount: charge.amount,
        reference: charge.reference,
        description: charge.description,
        source: charge.source,
      })),
      ...paymentEntries,
    ].sort((left, right) => new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime());

    const totalBilled = account.charges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalPaid = account.payments
      .filter((payment) => payment.status === "successful")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingAmount = Math.max(totalBilled - totalPaid, 0);
    const latestPayment = account.payments.find((payment) => payment.status === "successful");

    return {
      id: `billing-${account.accountId}`,
      residentCode: account.residentCode,
      unitCode: account.unitCode,
      residentName: account.residentName,
      buildingName: account.buildingName,
      dueDate: account.charges[0]?.dueDate ?? "",
      totalBilled,
      totalPaid,
      outstandingAmount,
      status: buildUnitStatus(account),
      latestReference: ledger[0]?.reference ?? "",
      lastPaymentAt: latestPayment?.paidAt,
      billingTypes: Array.from(new Set(account.charges.map((charge) => charge.billingType))),
      ledger,
    };
  });
}

export function buildVisitorBuildingConfigs(): VisitorParkingQuotaConfig[] {
  return sharedPropertyBuildings.map((building) => ({
    buildingCode: building.buildingCode,
    buildingName: building.buildingName,
    totalSlots: building.visitorSlots,
  }));
}

type SharedUnitDirectory = ReturnType<typeof listSharedPropertyUnits>[number];

function getUnitDirectoryMap() {
  return new Map(listSharedPropertyUnits().map((unit) => [unit.unitCode, unit]));
}

function requireUnit(unitCode: string): SharedUnitDirectory {
  const unit = getUnitDirectoryMap().get(unitCode);

  if (!unit) {
    throw new Error(`Missing shared unit directory for ${unitCode}`);
  }

  return unit;
}

function inferLevelAreaName(areaName: string, unitCode: string) {
  if (/^\w-\d{2}-/.test(unitCode)) {
    const level = unitCode.split("-")[1];
    return `Level ${level}`;
  }

  return areaName;
}

export function buildUserApprovals(): UnitMemberApproval[] {
  const a1208 = requireUnit("A-12-08");
  const b0411 = requireUnit("B-04-11");

  return [
    {
      id: "approval-1",
      fullName: "Aisyah Rahman",
      email: "aisyah.rahman@example.com",
      phone: "+60 12-882 1908",
      residentCode: a1208.residentCode,
      relationship: "Tenant",
      buildingName: a1208.buildingName,
      areaName: inferLevelAreaName(a1208.areaName, a1208.unitCode),
      unitName: a1208.unitCode,
      submittedAt: "27 Apr 2026 • 09:10 AM",
      notes: "Primary tenant transfer request submitted after new tenancy agreement signing.",
      status: "pending",
      documents: [
        { id: "doc-1", label: "Identity Document", fileName: "aisyah-passport.pdf", status: "submitted" },
        { id: "doc-2", label: "Tenancy Agreement", fileName: "tenancy-agreement-a1208.pdf", status: "submitted" },
        { id: "doc-3", label: "Utility Bill", fileName: "utility-proof-apr-2026.pdf", status: "submitted" },
      ],
    },
    {
      id: "approval-2",
      fullName: "Jason Lim",
      email: "jason.lim@example.com",
      phone: "+60 17-310 1029",
      residentCode: "RES-A1208-FAM",
      relationship: "Family Member",
      buildingName: a1208.buildingName,
      areaName: inferLevelAreaName(a1208.areaName, a1208.unitCode),
      unitName: a1208.unitCode,
      submittedAt: "27 Apr 2026 • 08:45 AM",
      notes: "Adult family member addition to existing approved tenant profile.",
      status: "pending",
      documents: [
        { id: "doc-4", label: "Identity Document", fileName: "jason-ic-front-back.pdf", status: "submitted" },
        { id: "doc-5", label: "Relationship Proof", fileName: "family-link-supporting-doc.pdf", status: "missing" },
      ],
    },
    {
      id: "approval-3",
      fullName: b0411.residentName,
      email: "nurul.huda@example.com",
      phone: "+60 19-220 5512",
      residentCode: b0411.residentCode,
      relationship: "Owner",
      buildingName: b0411.buildingName,
      areaName: inferLevelAreaName(b0411.areaName, b0411.unitCode),
      unitName: b0411.unitCode,
      submittedAt: "26 Apr 2026 • 04:30 PM",
      notes: "Owner profile refresh with updated identification submission.",
      status: "approved",
      documents: [
        { id: "doc-6", label: "Identity Document", fileName: "nurul-ic.pdf", status: "submitted" },
        { id: "doc-7", label: "Sale and Purchase Agreement", fileName: "spa-b0411.pdf", status: "submitted" },
      ],
    },
  ];
}

export function buildVisitorApprovals(): VisitorApproval[] {
  const a1208 = requireUnit("A-12-08");
  const b0411 = requireUnit("B-04-11");
  const pg03 = requireUnit("P-G-03");

  return [
    {
      id: "visitor-approval-0",
      visitorName: "Melissa Tan",
      hostName: a1208.residentName,
      residentCode: a1208.residentCode,
      unitCode: a1208.unitCode,
      buildingCode: a1208.buildingCode,
      buildingName: a1208.buildingName,
      visitDate: "2026-05-03",
      arrivalWindow: "02:00 PM - 05:00 PM",
      vehiclePlate: "WVG 2210",
      parkingSlotsRequested: 1,
      purpose: "Weekend family visit",
      status: "approved",
    },
    {
      id: "visitor-approval-1",
      visitorName: "Hannah Lee",
      hostName: a1208.residentName,
      residentCode: a1208.residentCode,
      unitCode: a1208.unitCode,
      buildingCode: a1208.buildingCode,
      buildingName: a1208.buildingName,
      visitDate: "2026-04-28",
      arrivalWindow: "07:30 PM - 10:30 PM",
      vehiclePlate: "WXY 8821",
      parkingSlotsRequested: 1,
      purpose: "Dinner guest visit",
      status: "pending",
    },
    {
      id: "visitor-approval-2",
      visitorName: "Zen Movers",
      hostName: b0411.residentName,
      residentCode: b0411.residentCode,
      unitCode: b0411.unitCode,
      buildingCode: b0411.buildingCode,
      buildingName: b0411.buildingName,
      visitDate: "2026-04-29",
      arrivalWindow: "10:00 AM - 12:00 PM",
      vehiclePlate: "VAN 3312",
      parkingSlotsRequested: 2,
      purpose: "Move-in support team",
      status: "pending",
    },
    {
      id: "visitor-approval-3",
      visitorName: "Kelvin Ong",
      hostName: pg03.residentName,
      residentCode: pg03.residentCode,
      unitCode: pg03.unitCode,
      buildingCode: pg03.buildingCode,
      buildingName: pg03.buildingName,
      visitDate: "2026-04-27",
      arrivalWindow: "03:00 PM - 05:00 PM",
      vehiclePlate: "BMQ 7190",
      parkingSlotsRequested: 1,
      purpose: "Supplier drop-off",
      status: "approved",
    },
    {
      id: "visitor-approval-4",
      visitorName: "Aaron Goh",
      hostName: "Jason Lim",
      residentCode: "RES-A1208-FAM",
      unitCode: a1208.unitCode,
      buildingCode: a1208.buildingCode,
      buildingName: a1208.buildingName,
      visitDate: "2026-05-07",
      arrivalWindow: "07:00 PM - 09:00 PM",
      vehiclePlate: "VJQ 5518",
      parkingSlotsRequested: 1,
      purpose: "Dinner gathering",
      status: "pending",
    },
    {
      id: "visitor-approval-5",
      visitorName: "Northern Aircon Services",
      hostName: pg03.residentName,
      residentCode: pg03.residentCode,
      unitCode: pg03.unitCode,
      buildingCode: pg03.buildingCode,
      buildingName: pg03.buildingName,
      visitDate: "2026-05-10",
      arrivalWindow: "09:00 AM - 11:30 AM",
      vehiclePlate: "BRT 9044",
      parkingSlotsRequested: 2,
      purpose: "Air-conditioning maintenance call",
      status: "approved",
    },
  ];
}

export function buildComplaintCases(): ComplaintCase[] {
  const a1208 = requireUnit("A-12-08");
  const b0411 = requireUnit("B-04-11");

  return [
    {
      id: "complaint-1",
      eyebrow: "SUPPORT / TICKET #492-B8",
      title: "Lift lobby lighting issue",
      description: "Flickering lights reported near Tower A lift corridor affecting visibility at night.",
      residentName: a1208.residentName,
      residentCode: a1208.residentCode,
      buildingName: a1208.buildingName,
      unitCode: a1208.unitCode,
      location: "Tower A, Level 12 lift corridor",
      category: "Electrical",
      submittedAt: "27 Apr 2026 • 07:25 AM",
      updatedAt: "27 Apr 2026 • 08:40 AM",
      priority: "Medium",
      status: "in_progress",
      statusTone: "warning",
      reference: "CMP-240492",
      assignedTeam: "Brightline Electrical Services",
      reportDateLabel: "Reported 27 Apr 2026",
      summaryTitle: "Detailed Description",
      summaryBody:
        "The resident reported repeated flickering from two downlights near the lift lobby outside the unit cluster. Visibility drops at night and the issue appears more obvious when the corridor motion lights switch states.",
      previews: [
        { id: "electrical-preview-1", imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80" },
      ],
      timelineTitle: "STATUS TIMELINE",
      timeline: [
        { id: "electrical-assigned", title: "In progress", description: "Brightline Electrical Services has been requested to replace the affected lights and inspect the wiring.", timestamp: "27 Apr 2026 • 08:40 AM", isCurrent: true },
        { id: "electrical-submitted", title: "Complaint submitted", description: "Resident reported flickering lights at the lift lobby.", timestamp: "27 Apr 2026 • 07:25 AM" },
      ],
      attachmentsTitle: "ATTACHMENTS",
      attachments: [{ id: "electrical-attachment-1", title: "lift-lobby-lighting.jpg", meta: "Image • 822 KB", type: "image" }],
      conciergeTitle: "MANAGEMENT NOTES",
      conciergeMessage: "Engineering team confirmed the issue is isolated to one corridor branch circuit and vendor access is approved.",
      conciergeManagerName: "Daniel Wong",
      conciergeManagerRole: "Facilities Supervisor",
      helpTitle: "RESIDENT FOLLOW-UP",
      helpBody: "If the corridor becomes too dim before rectification, management should increase temporary lighting near the affected lift landing.",
      helpActionLabel: "Deploy Temporary Light",
      assignedVendorId: "vendor-elec-1",
      latestUpdate: "Vendor scheduled same-day inspection",
    },
    {
      id: "complaint-2",
      eyebrow: "SUPPORT / TICKET #377-A3",
      title: "Visitor intercom audio static",
      description: "Intercom voice becomes distorted during guest verification from the guard house.",
      residentName: a1208.residentName,
      residentCode: a1208.residentCode,
      buildingName: a1208.buildingName,
      unitCode: a1208.unitCode,
      location: `${a1208.buildingName}, ${a1208.unitCode} visitor intercom`,
      category: "Security",
      submittedAt: "26 Apr 2026 • 06:45 PM",
      updatedAt: "27 Apr 2026 • 09:15 AM",
      priority: "Medium",
      status: "received",
      statusTone: "warning",
      reference: "CMP-240377",
      assignedTeam: "Guardian Access Systems",
      reportDateLabel: "Reported 26 Apr 2026",
      summaryTitle: "Detailed Description",
      summaryBody:
        "When visitors call through the intercom, the audio becomes static and broken on both the resident handset and the guard house side. This caused a delivery rider to wait outside for several minutes because the guard could not verify the unit clearly.",
      previews: [
        { id: "intercom-preview-1", imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80" },
        { id: "intercom-preview-2", imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80" },
      ],
      timelineTitle: "STATUS TIMELINE",
      timeline: [
        { id: "intercom-assigned", title: "Received", description: "The access control vendor has been notified to inspect the intercom line and panel audio quality.", timestamp: "27 Apr 2026 • 09:15 AM", isCurrent: true },
        { id: "intercom-submitted", title: "Complaint submitted", description: "Resident reported static noise affecting guest verification.", timestamp: "26 Apr 2026 • 06:45 PM" },
      ],
      attachmentsTitle: "ATTACHMENTS",
      attachments: [
        { id: "intercom-attachment-1", title: "visitor-intercom-audio.mp4", meta: "Video • 4.8 MB", type: "video" },
        { id: "intercom-attachment-2", title: "intercom-panel.jpg", meta: "Image • 640 KB", type: "image" },
      ],
      conciergeTitle: "MANAGEMENT NOTES",
      conciergeMessage: "Guardian Access Systems has accepted the case and will test both the visitor panel microphone and resident handset line during the next site visit.",
      conciergeManagerName: "Daniel Wong",
      conciergeManagerRole: "Facilities Supervisor",
      helpTitle: "RESIDENT FOLLOW-UP",
      helpBody: "If more units are affected, management should consolidate the affected stack numbers for the vendor before the inspection window.",
      helpActionLabel: "Notify More Affected Units",
      assignedVendorId: "vendor-sec-1",
      latestUpdate: "Assigned to Guardian Access Systems for inspection",
    },
    {
      id: "complaint-3",
      eyebrow: "SUPPORT / TICKET #541-D4",
      title: "Water leakage near kitchen riser",
      description: "Intermittent water leak seen around the riser access panel in the kitchen area.",
      residentName: b0411.residentName,
      residentCode: b0411.residentCode,
      buildingName: b0411.buildingName,
      unitCode: b0411.unitCode,
      location: `${b0411.buildingName}, ${b0411.unitCode} kitchen riser`,
      category: "Plumbing",
      submittedAt: "25 Apr 2026 • 03:20 PM",
      updatedAt: "27 Apr 2026 • 11:00 AM",
      priority: "High",
      status: "in_progress",
      statusTone: "warning",
      reference: "CMP-240541",
      assignedTeam: "Flowfix Plumbing Works",
      reportDateLabel: "Reported 25 Apr 2026",
      summaryTitle: "Detailed Description",
      summaryBody:
        "The resident noticed dampness spreading around the riser access panel behind the kitchen cabinet. There is a light drip every few minutes and the cabinet base feels wet. The resident has provided photos from yesterday and this morning showing the spread becoming worse.",
      previews: [
        { id: "plumbing-preview-1", imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80" },
        { id: "plumbing-preview-2", imageUrl: "https://images.unsplash.com/photo-1631545806526-39d49d336f06?auto=format&fit=crop&w=900&q=80" },
        { id: "plumbing-preview-3", imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=900&q=80" },
      ],
      timelineTitle: "STATUS TIMELINE",
      timeline: [
        { id: "plumbing-progress", title: "Repair in progress", description: "Flowfix team opened the riser access and is tracing whether the leak comes from the internal pipe joint or the vertical stack.", timestamp: "27 Apr 2026 • 11:00 AM", isCurrent: true },
        { id: "plumbing-assigned", title: "Assigned to plumbing vendor", description: "Case was escalated to Flowfix Plumbing Works for on-site inspection.", timestamp: "26 Apr 2026 • 08:30 AM" },
        { id: "plumbing-submitted", title: "Complaint submitted", description: "Resident uploaded photo evidence of the leak and requested urgent rectification.", timestamp: "25 Apr 2026 • 03:20 PM" },
      ],
      attachmentsTitle: "ATTACHMENTS",
      attachments: [
        { id: "plumbing-attachment-1", title: "kitchen-riser-leak-1.jpg", meta: "Image • 1.2 MB", type: "image" },
        { id: "plumbing-attachment-2", title: "kitchen-riser-leak-2.jpg", meta: "Image • 972 KB", type: "image" },
        { id: "plumbing-attachment-3", title: "resident-note.pdf", meta: "Document • 284 KB", type: "document" },
      ],
      conciergeTitle: "MANAGEMENT NOTES",
      conciergeMessage: "Plumbing vendor is already on site. Management is coordinating access with the unit owner and monitoring whether adjacent units need inspection as well.",
      conciergeManagerName: "Farid Hakim",
      conciergeManagerRole: "Building Executive",
      helpTitle: "RESIDENT FOLLOW-UP",
      helpBody: "If the leak worsens before rectification is complete, temporary shutoff of the affected line may be needed while the vendor isolates the pipe section.",
      helpActionLabel: "Escalate Emergency Shutoff",
      assignedVendorId: "vendor-plumb-1",
      latestUpdate: "Flowfix team scheduled site rectification for tomorrow morning",
    },
  ];
}

export function buildFeedbackItems(): FeedbackItem[] {
  const a1208 = requireUnit("A-12-08");
  const b0411 = requireUnit("B-04-11");

  return [
    {
      id: "feedback-1",
      title: "Lobby cleanliness follow-up feels too slow",
      message:
        "We reported repeated lobby cleanliness issues last week and did not see any clear follow-up from management. It would help if building updates were more visible after a report is submitted.",
      residentName: a1208.residentName,
      residentCode: a1208.residentCode,
      unitCode: a1208.unitCode,
      buildingName: a1208.buildingName,
      submittedAt: "27 Apr 2026 • 11:42 AM",
      status: "new",
      sentiment: "neutral",
      category: "Facilities",
      source: "management_portal",
      rating: 3,
      tags: ["cleanliness", "lobby", "follow-up"],
      summary: "Resident wants clearer management follow-up after reporting repeated cleanliness issues in shared areas.",
      responseExpectation: "Operations should review case follow-up visibility and service-response updates.",
      payload: {
        eventName: "building_feedback_submitted",
        platform: "management-portal",
        appVersion: "1.4.2",
        buildNumber: "14218",
        environment: "production",
        submittedAt: "2026-04-27T03:42:11.214Z",
        resident: {
          id: "usr_10293",
          residentCode: a1208.residentCode,
          unitCode: a1208.unitCode,
          buildingCode: a1208.buildingCode,
        },
        form: { current: "BuildingFeedbackForm", previous: "ManagementContactPage", flow: "feedback" },
        feedback: {
          category: "facilities",
          rating: 3,
          message:
            "We reported repeated lobby cleanliness issues last week and did not see any clear follow-up from management. It would help if building updates were more visible after a report is submitted.",
        },
        client: { channel: "resident-web", locale: "en-MY" },
        context: { zone: `${a1208.buildingName} lobby`, topic: "shared-area upkeep" },
      },
    },
    {
      id: "feedback-2",
      title: "Visitor approval response should be faster",
      message:
        "Weekend visitor approvals still take too long when parking demand is low. It would help if routine requests under quota moved faster.",
      residentName: "Jason Lim",
      residentCode: "RES-A1208-FAM",
      unitCode: a1208.unitCode,
      buildingName: a1208.buildingName,
      submittedAt: "26 Apr 2026 • 08:17 PM",
      status: "reviewed",
      sentiment: "negative",
      category: "General Experience",
      source: "management_portal",
      rating: 2,
      tags: ["visitors", "sla", "weekend"],
      summary: "Resident expects faster handling for routine visitor approvals when quota is available.",
      responseExpectation: "Management should review weekend approval turnaround and simple auto-approval rules.",
      payload: {
        eventName: "building_feedback_submitted",
        platform: "management-portal",
        appVersion: "1.4.2",
        buildNumber: "14218",
        environment: "production",
        submittedAt: "2026-04-26T12:17:49.022Z",
        resident: { id: "usr_20981", residentCode: "RES-A1208-FAM", unitCode: a1208.unitCode, buildingCode: a1208.buildingCode },
        form: { current: "BuildingFeedbackForm", previous: "VisitorApprovalPage", flow: "feedback" },
        feedback: {
          category: "general_experience",
          rating: 2,
          message:
            "Weekend visitor approvals still take too long when parking demand is low. It would help if routine requests under quota moved faster.",
        },
        context: { area: "guardhouse approval process", requestWindow: "weekend" },
        client: { channel: "resident-web", locale: "en-MY" },
      },
    },
    {
      id: "feedback-3",
      title: "Would like clearer notice lead time",
      message:
        "Advance notice for maintenance disruptions has improved, but more lead time would help families plan around water or lift interruptions.",
      residentName: b0411.residentName,
      residentCode: b0411.residentCode,
      unitCode: b0411.unitCode,
      buildingName: b0411.buildingName,
      submittedAt: "25 Apr 2026 • 07:05 PM",
      status: "shared",
      sentiment: "positive",
      category: "General Experience",
      source: "management_portal",
      rating: 4,
      tags: ["announcements", "lead-time", "maintenance"],
      summary: "Resident appreciates building notices but wants earlier warning before planned disruptions.",
      responseExpectation: "Communications should review minimum lead times for planned maintenance notices.",
      payload: {
        eventName: "building_feedback_submitted",
        platform: "management-portal",
        appVersion: "1.4.1",
        buildNumber: "14107",
        environment: "production",
        submittedAt: "2026-04-25T11:05:32.488Z",
        resident: { id: "usr_33415", residentCode: b0411.residentCode, unitCode: b0411.unitCode, buildingCode: b0411.buildingCode },
        form: { current: "BuildingFeedbackForm", previous: "AnnouncementArchivePage", flow: "feedback" },
        feedback: {
          category: "general_experience",
          rating: 4,
          message:
            "Advance notice for maintenance disruptions has improved, but more lead time would help families plan around water or lift interruptions.",
        },
        context: { topic: "planned maintenance communication", buildingScope: b0411.buildingName },
        client: { channel: "resident-web", locale: "en-MY" },
      },
    },
  ];
}
