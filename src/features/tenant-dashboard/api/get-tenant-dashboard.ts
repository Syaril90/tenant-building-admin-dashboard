import { getAPIBaseURL } from "../../../shared/lib/api-config";
import { tenantDashboardData } from "../data/tenant-dashboard";
import { mergeBillingAdmin } from "./save-billing-imports";
import { mergeUserApprovals } from "./save-user-approvals";
import { mergeStrataRegistration } from "./save-tenant-strata";
import type {
  BillingAdmin,
  BillingUnitRecord,
  ComplaintCase,
  FeedbackAdmin,
  FeedbackCategory,
  FeedbackItem,
  StrataRegistration,
  StrataTreeNode,
  TenantDashboard
} from "../types";

type PropertyTreeNode = {
  type: "building" | "area" | "unit";
  code: string;
  name: string;
  status: string;
  documentsExpected: string[];
  residentCode?: string;
  residentName?: string;
  children?: PropertyTreeNode[];
};

type BillingTreeUnit = {
  unitCode: string;
  unitName: string;
  accountCode: string;
  residentCode: string;
  residentName: string;
  outstanding: number;
  status: BillingUnitRecord["status"] | "no_charges";
  billingTypes: string[];
};

type BillingTreeArea = {
  areaCode: string;
  areaName: string;
  units: BillingTreeUnit[];
};

type BillingTreeBuilding = {
  buildingCode: string;
  buildingName: string;
  areas: BillingTreeArea[];
};

type ComplaintAPIItem = {
  id: string;
  reference: string;
  residentName: string;
  residentCode: string;
  buildingName: string;
  unitCode: string;
  category: ComplaintCase["category"];
  title: string;
  description: string;
  location: string;
  priority: ComplaintCase["priority"];
  status: ComplaintCase["status"];
  submittedAt: string;
  updatedAt: string;
  latestUpdate: string;
  assignedTeam: string;
  attachments: ComplaintCase["attachments"];
  previews: ComplaintCase["previews"];
  timeline: ComplaintCase["timeline"];
};

type FeedbackAPIItem = {
  id: string;
  accountCode: string;
  residentCode: string;
  residentName: string;
  buildingName: string;
  unitCode: string;
  type: string;
  rating: string;
  details: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  attachments: Array<{
    id: string;
    title: string;
    meta: string;
    type: string;
    fileUrl?: string;
  }>;
};

type DocumentsCategoryAPIItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  featured: boolean;
};

type DocumentsItemAPIItem = TenantDashboard["documentsAdmin"]["items"][number];

type DocumentsAPIResponse = {
  categories: DocumentsCategoryAPIItem[];
  items: DocumentsItemAPIItem[];
};

type DocumentRequestsAPIResponse = {
  items: TenantDashboard["documentsAdmin"]["requests"];
};

type VisitorRequestsAPIResponse = {
  items: TenantDashboard["visitorAdmin"]["approvals"];
};

type VisitorParkingConfigsAPIResponse = {
  items: TenantDashboard["visitorAdmin"]["buildingConfigs"];
};

export async function getTenantDashboard() {
  const baseURL = getAPIBaseURL();
  const [
    propertyResponse,
    billingResponse,
    announcementsResponse,
    documentsResponse,
    documentRequestsResponse,
    complaintsResponse,
    feedbackResponse,
    visitorRequestsResponse,
    visitorParkingConfigsResponse
  ] = await Promise.all([
    fetch(`${baseURL}/api/v1/property/tree`),
    fetch(`${baseURL}/api/v1/billing/admin/tree`),
    fetch(`${baseURL}/api/v1/announcements`),
    fetch(`${baseURL}/api/v1/admin/documents`),
    fetch(`${baseURL}/api/v1/admin/document-requests`),
    fetch(`${baseURL}/api/v1/admin/complaints`),
    fetch(`${baseURL}/api/v1/admin/feedback`),
    fetch(`${baseURL}/api/v1/admin/visitor-requests`),
    fetch(`${baseURL}/api/v1/admin/visitor-parking-configs`)
  ]);

  if (
    !propertyResponse.ok ||
    !billingResponse.ok ||
    !announcementsResponse.ok ||
    !documentsResponse.ok ||
    !documentRequestsResponse.ok ||
    !complaintsResponse.ok ||
    !feedbackResponse.ok ||
    !visitorRequestsResponse.ok ||
    !visitorParkingConfigsResponse.ok
  ) {
    throw new Error("Dashboard API request failed");
  }

  const propertyPayload = (await propertyResponse.json()) as { items: PropertyTreeNode[] };
  const billingPayload = (await billingResponse.json()) as { items: BillingTreeBuilding[] };
  const announcementsPayload = (await announcementsResponse.json()) as {
    items: TenantDashboard["announcementAdmin"]["items"];
  };
  const documentsPayload = (await documentsResponse.json()) as DocumentsAPIResponse;
  const documentRequestsPayload =
    (await documentRequestsResponse.json()) as DocumentRequestsAPIResponse;
  const complaintsPayload = (await complaintsResponse.json()) as {
    items: ComplaintAPIItem[];
  };
  const feedbackPayload = (await feedbackResponse.json()) as {
    items: FeedbackAPIItem[];
  };
  const visitorRequestsPayload = (await visitorRequestsResponse.json()) as VisitorRequestsAPIResponse;
  const visitorParkingConfigsPayload = (await visitorParkingConfigsResponse.json()) as VisitorParkingConfigsAPIResponse;

  return {
    ...tenantDashboardData,
    strata: mergeStrataRegistration({
      ...tenantDashboardData.strata,
      tree: mapPropertyTree(propertyPayload.items),
      uploadsByNode: tenantDashboardData.strata.uploadsByNode
    }),
    approvals: mergeUserApprovals(tenantDashboardData.approvals),
    billingAdmin: mergeBillingAdmin({
      ...tenantDashboardData.billingAdmin,
      unitRecords: mapBillingRecords(billingPayload.items, tenantDashboardData.billingAdmin)
    }),
    documentsAdmin: {
      ...tenantDashboardData.documentsAdmin,
      categories: documentsPayload.categories.map((category) => ({
        id: category.id,
        title: category.title,
        description: category.description,
        featured: category.featured
      })),
      items: documentsPayload.items,
      requests: documentRequestsPayload.items
    },
    visitorAdmin: {
      ...tenantDashboardData.visitorAdmin,
      approvals: visitorRequestsPayload.items,
      buildingConfigs: visitorParkingConfigsPayload.items
    },
    supportAdmin: {
      ...tenantDashboardData.supportAdmin,
      complaints: mapComplaintCases(complaintsPayload.items)
    },
    feedbackAdmin: mergeFeedbackAdmin({
      ...tenantDashboardData.feedbackAdmin,
      items: mapFeedbackItems(feedbackPayload.items, tenantDashboardData.feedbackAdmin)
    }),
    announcementAdmin: {
      ...tenantDashboardData.announcementAdmin,
      items: announcementsPayload.items
    }
  };
}

function mapPropertyTree(nodes: PropertyTreeNode[]): StrataTreeNode[] {
  return nodes.map((node) => ({
    id: node.code,
    type: node.type,
    name: node.name,
    code: node.code,
    status: node.status,
    countsLabel: countsLabelForNode(node),
    documentsExpected: node.documentsExpected,
    children: node.children ? mapPropertyTree(node.children) : undefined
  }));
}

function countsLabelForNode(node: PropertyTreeNode) {
  if (!node.children?.length) {
    return node.residentName ? node.residentName : "No child records";
  }

  const areaCount = node.children.filter((child) => child.type === "area").length;
  const unitCount = node.children.filter((child) => child.type === "unit").length;

  if (node.type === "building") {
    const nestedUnitCount = node.children.reduce(
      (sum, child) => sum + (child.children?.filter((grandChild) => grandChild.type === "unit").length ?? 0),
      0
    );
    return `${areaCount} areas • ${nestedUnitCount} units`;
  }

  if (node.type === "area") {
    return `${unitCount} units`;
  }

  return `${node.children.length} records`;
}

function mapBillingRecords(
  buildings: BillingTreeBuilding[],
  fallbackAdmin: BillingAdmin
): BillingUnitRecord[] {
  const fallbackByUnit = new Map(fallbackAdmin.unitRecords.map((record) => [record.unitCode, record]));
  const records: BillingUnitRecord[] = [];

  for (const building of buildings) {
    for (const area of building.areas) {
      for (const unit of area.units) {
        const fallback = fallbackByUnit.get(unit.unitCode);
        const normalizedStatus = unit.status === "no_charges" ? "paid" : unit.status;
        const totalBilled = fallback?.totalBilled ?? unit.outstanding;
        const totalPaid = fallback?.totalPaid ?? Math.max(totalBilled - unit.outstanding, 0);

        records.push({
          id: fallback?.id ?? `billing-${unit.accountCode}`,
          residentCode: unit.residentCode,
          unitCode: unit.unitCode,
          residentName: unit.residentName,
          buildingName: building.buildingName,
          dueDate: fallback?.dueDate ?? "2026-05-31",
          totalBilled,
          totalPaid,
          outstandingAmount: unit.outstanding,
          status: normalizedStatus,
          latestReference: fallback?.latestReference ?? unit.accountCode,
          lastPaymentAt: fallback?.lastPaymentAt,
          billingTypes: unit.billingTypes,
          ledger: fallback?.ledger ?? []
        });
      }
    }
  }

  return records;
}

function mapComplaintCases(items: ComplaintAPIItem[]): ComplaintCase[] {
  return items.map((item) => ({
    id: item.id,
    eyebrow: `${item.buildingName.toUpperCase()} • ${item.unitCode}`,
    title: item.title,
    description: item.description,
    residentName: item.residentName,
    residentCode: item.residentCode,
    buildingName: item.buildingName,
    unitCode: item.unitCode,
    location: item.location,
    category: item.category,
    submittedAt: item.submittedAt,
    updatedAt: item.updatedAt,
    priority: item.priority,
    status: item.status,
    statusTone: item.status === "done" ? "success" : "warning",
    reference: item.reference,
    assignedTeam: item.assignedTeam,
    reportDateLabel: `Submitted ${item.submittedAt}`,
    summaryTitle: "Complaint Summary",
    summaryBody: item.description,
    previews: item.previews,
    timelineTitle: "STATUS TIMELINE",
    timeline: item.timeline,
    attachmentsTitle: "ATTACHMENTS",
    attachments: item.attachments,
    conciergeTitle: "MANAGEMENT NOTES",
    conciergeMessage: item.latestUpdate,
    conciergeManagerName: "Management Office",
    conciergeManagerRole: "Building Support Team",
    helpTitle: "FOLLOW-UP",
    helpBody: "Use the status update to reflect what residents should see on the mobile app.",
    helpActionLabel: "Update Status",
    latestUpdate: item.latestUpdate
  }));
}

function mergeFeedbackAdmin(feedbackAdmin: FeedbackAdmin): FeedbackAdmin {
  return feedbackAdmin;
}

function mapFeedbackItems(items: FeedbackAPIItem[], fallbackAdmin: FeedbackAdmin): FeedbackItem[] {
  if (items.length === 0) {
    return fallbackAdmin.items;
  }

  return items.map((item) => ({
    id: item.id,
    title: buildFeedbackTitle(item),
    message: item.details,
    residentName: item.residentName,
    residentCode: item.residentCode,
    unitCode: item.unitCode,
    buildingName: item.buildingName,
    submittedAt: item.submittedAt,
    status: mapFeedbackStatus(item.status),
    sentiment: mapFeedbackSentiment(item.rating),
    category: mapFeedbackCategory(item.type),
    source: "web",
    rating: mapFeedbackRating(item.rating),
    tags: buildFeedbackTags(item),
    summary: item.details,
    responseExpectation: "",
    payload: {
      feedbackId: item.id,
      accountCode: item.accountCode,
      buildingName: item.buildingName,
      unitCode: item.unitCode,
      type: item.type,
      rating: item.rating,
      status: item.status,
      submittedAt: item.submittedAt,
      updatedAt: item.updatedAt,
      attachments: item.attachments
    }
  }));
}

function buildFeedbackTitle(item: FeedbackAPIItem) {
  const summary = item.details.trim().split(/[.!?]/)[0]?.trim() ?? "";
  if (summary.length > 0) {
    return summary.length > 72 ? `${summary.slice(0, 69)}...` : summary;
  }

  return `${item.type} feedback from ${item.unitCode}`;
}

function mapFeedbackStatus(status: string): FeedbackItem["status"] {
  switch (status.toLowerCase()) {
    case "reviewed":
    case "shared":
      return status.toLowerCase() as FeedbackItem["status"];
    default:
      return "new";
  }
}

function mapFeedbackSentiment(rating: string): FeedbackItem["sentiment"] {
  switch (rating.toLowerCase()) {
    case "poor":
    case "fair":
      return "negative";
    case "great":
    case "excellent":
      return "positive";
    default:
      return "neutral";
  }
}

function mapFeedbackCategory(feedbackType: string): FeedbackCategory {
  switch (feedbackType.toLowerCase()) {
    case "suggestion":
      return "Feature Request";
    case "complaint":
      return "Facilities";
    case "general":
      return "General Experience";
    case "praise":
      return "General Experience";
    default:
      return "General Experience";
  }
}

function mapFeedbackRating(rating: string) {
  switch (rating.toLowerCase()) {
    case "poor":
      return 1;
    case "fair":
      return 2;
    case "good":
      return 3;
    case "great":
      return 4;
    case "excellent":
      return 5;
    default:
      return 3;
  }
}

function buildFeedbackTags(item: FeedbackAPIItem) {
  return [item.type, item.rating, item.unitCode]
    .map((value) => value.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
}
