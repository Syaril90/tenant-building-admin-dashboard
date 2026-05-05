export type DashboardTone = "brand" | "success" | "warning";

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: DashboardTone;
};

export type DashboardAction = {
  id: string;
  title: string;
  description: string;
};

export type DashboardModule = {
  id: string;
  title: string;
  status: string;
  description: string;
  items: string[];
};

export type DashboardActivity = {
  id: string;
  title: string;
  meta: string;
  tone: DashboardTone;
};

export type DashboardListItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  tone?: DashboardTone;
};

export type DashboardPageSection = {
  id: string;
  title: string;
  description: string;
  ctaLabel?: string;
  items: DashboardListItem[];
};

export type TenantDashboardPageData = {
  title: string;
  description: string;
  sections: DashboardPageSection[];
};

export type TenantDashboardPages = {
  overview: TenantDashboardPageData;
  billing: TenantDashboardPageData;
  visitors: TenantDashboardPageData;
  documents: TenantDashboardPageData;
  documentRequests: TenantDashboardPageData;
  support: TenantDashboardPageData;
  feedback: TenantDashboardPageData;
  announcements: TenantDashboardPageData;
  access: TenantDashboardPageData;
  strata: TenantDashboardPageData;
  approvals: TenantDashboardPageData;
};

export type TenantDashboardRoute =
  | "overview"
  | "billing"
  | "visitors"
  | "documents"
  | "documentRequests"
  | "support"
  | "feedback"
  | "announcements"
  | "access"
  | "strata"
  | "approvals";

export type StrataNodeType = "building" | "area" | "unit";

export type StrataTreeNode = {
  id: string;
  type: StrataNodeType;
  name: string;
  code: string;
  status: string;
  countsLabel: string;
  documentsExpected: string[];
  children?: StrataTreeNode[];
};

export type StrataUploadMeta = {
  name: string;
  size: number;
  mimeType: string;
};

export type StrataRegistration = {
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  tree: StrataTreeNode[];
  uploadsByNode: Record<string, StrataUploadMeta[]>;
};

export type UnitMemberApprovalStatus = "pending" | "approved" | "rejected";

export type UnitMemberDocument = {
  id: string;
  label: string;
  fileName: string;
  status: "submitted" | "missing" | "expired";
};

export type UnitMemberApproval = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  residentCode: string;
  relationship: "Owner" | "Tenant" | "Family Member" | "Staff";
  buildingName: string;
  areaName: string;
  unitName: string;
  submittedAt: string;
  notes: string;
  documents: UnitMemberDocument[];
  status: UnitMemberApprovalStatus;
};

export type UserApprovals = {
  title: string;
  description: string;
  approvals: UnitMemberApproval[];
};

export type BillingImportRowStatus = "ready" | "error" | "pushed";

export type BillingImportRow = {
  id: string;
  residentCode: string;
  unitCode: string;
  billingType: string;
  amount: number;
  dueDate: string;
  description: string;
  reference: string;
  matchSource: "resident_code" | "unit_code" | "unmatched";
  status: BillingImportRowStatus;
  errors: string[];
};

export type BillingImportBatchStatus = "draft" | "ready" | "pushed";

export type BillingImportBatch = {
  id: string;
  fileName: string;
  importedAt: string;
  status: BillingImportBatchStatus;
  rows: BillingImportRow[];
};

export type BillingUnitPaymentStatus = "paid" | "partial" | "unpaid" | "overdue";

export type BillingLedgerEntryKind = "charge" | "payment";

export type BillingPaymentMethod =
  | "online"
  | "offline_cash"
  | "offline_bank_transfer"
  | "offline_cheque";

export type BillingLedgerEntry = {
  id: string;
  kind: BillingLedgerEntryKind;
  postedAt: string;
  amount: number;
  reference: string;
  description: string;
  source: "system" | "building_admin";
  method?: BillingPaymentMethod;
};

export type BillingUnitRecord = {
  id: string;
  residentCode: string;
  unitCode: string;
  residentName: string;
  buildingName: string;
  dueDate: string;
  totalBilled: number;
  totalPaid: number;
  outstandingAmount: number;
  status: BillingUnitPaymentStatus;
  latestReference: string;
  lastPaymentAt?: string;
  billingTypes: string[];
  ledger: BillingLedgerEntry[];
};

export type BillingAdmin = {
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  batches: BillingImportBatch[];
  unitRecords: BillingUnitRecord[];
};

export type DocumentsCategory = {
  id: string;
  title: string;
  description: string;
  featured: boolean;
};

export type DocumentsRepository = {
  title: string;
  viewAllLabel: string;
  tableHeaders: {
    fileName: string;
    description: string;
    actions: string;
  };
};

export type DocumentFileTone = "danger" | "info" | "success" | "neutral";

export type DocumentsFileType = "PDF" | "DOCX" | "XLSX" | "JPG" | "PNG";

export type DocumentsFile = {
  id: string;
  title: string;
  sizeLabel: string;
  description: string;
  categoryId: string;
  categoryLabel: string;
  fileTypeLabel: DocumentsFileType;
  tone: DocumentFileTone;
  updatedAtLabel: string;
  previewTitle: string;
  previewBody: string;
  fileUrl?: string;
};

export type DocumentRequestStatus = "submitted" | "in_review" | "fulfilled" | "rejected";

export type DocumentRequestAttachment = {
  id: string;
  title: string;
  meta: string;
  type: "image" | "document";
  fileUrl?: string;
  uploadedBy: "resident" | "admin";
};

export type DocumentRequestTimelineItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isCurrent?: boolean;
};

export type DocumentRequestItem = {
  id: string;
  reference: string;
  residentName: string;
  residentCode: string;
  buildingCode: string;
  buildingName: string;
  unitCode: string;
  requestTypeId: string;
  requestTypeLabel: string;
  preferredFormatId: string;
  preferredFormatLabel: string;
  purpose: string;
  notes: string;
  status: DocumentRequestStatus;
  latestComment: string;
  submittedAt: string;
  updatedAt: string;
  attachments: DocumentRequestAttachment[];
  timeline: DocumentRequestTimelineItem[];
};

export type DocumentsAdmin = {
  title: string;
  description: string;
  searchPlaceholder: string;
  uploadTitle: string;
  uploadDescription: string;
  helperTitle: string;
  helperDescription: string;
  categories: DocumentsCategory[];
  repository: DocumentsRepository;
  items: DocumentsFile[];
  requests: DocumentRequestItem[];
};

export type VisitorApprovalStatus = "pending" | "approved" | "rejected";

export type VisitorParkingQuotaConfig = {
  buildingCode: string;
  buildingName: string;
  totalSlots: number;
};

export type VisitorApproval = {
  id: string;
  visitorName: string;
  hostName: string;
  residentCode: string;
  unitCode: string;
  buildingCode: string;
  buildingName: string;
  visitDate: string;
  arrivalWindow: string;
  vehiclePlate: string;
  parkingSlotsRequested: number;
  purpose: string;
  status: VisitorApprovalStatus;
};

export type VisitorAdmin = {
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  approvals: VisitorApproval[];
  buildingConfigs: VisitorParkingQuotaConfig[];
};

export type ComplaintStatus = "received" | "in_progress" | "done";

export type ComplaintVendor = {
  id: string;
  name: string;
  trade: string;
  phone: string;
};

export type ComplaintDetailStatusTone = "warning" | "success" | "neutral";

export type ComplaintTimelineItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isCurrent?: boolean;
};

export type ComplaintAttachment = {
  id: string;
  title: string;
  meta: string;
  type: "image" | "video" | "document";
  fileUrl?: string;
};

export type ComplaintPreview = {
  id: string;
  imageUrl: string;
};

export type ComplaintCase = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  residentName: string;
  residentCode: string;
  buildingName: string;
  unitCode: string;
  location: string;
  category: "Electrical" | "Plumbing" | "Security" | "Facilities" | "Cleanliness";
  submittedAt: string;
  updatedAt: string;
  priority: "Low" | "Medium" | "High";
  status: ComplaintStatus;
  statusTone: ComplaintDetailStatusTone;
  reference: string;
  assignedTeam: string;
  reportDateLabel: string;
  summaryTitle: string;
  summaryBody: string;
  previews: ComplaintPreview[];
  timelineTitle: string;
  timeline: ComplaintTimelineItem[];
  attachmentsTitle: string;
  attachments: ComplaintAttachment[];
  conciergeTitle: string;
  conciergeMessage: string;
  conciergeManagerName: string;
  conciergeManagerRole: string;
  helpTitle: string;
  helpBody: string;
  helpActionLabel: string;
  assignedVendorId?: string;
  latestUpdate: string;
};

export type SupportAdmin = {
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  complaints: ComplaintCase[];
  vendors: ComplaintVendor[];
};

export type FeedbackStatus = "new" | "reviewed" | "shared";

export type FeedbackSentiment = "positive" | "neutral" | "negative";

export type FeedbackSource = "management_portal" | "web";

export type FeedbackCategory =
  | "Bug Report"
  | "Feature Request"
  | "General Experience"
  | "Billing"
  | "Facilities";

export type FeedbackPayload = Record<string, unknown>;

export type FeedbackItem = {
  id: string;
  title: string;
  message: string;
  residentName: string;
  residentCode: string;
  unitCode: string;
  buildingName: string;
  submittedAt: string;
  status: FeedbackStatus;
  sentiment: FeedbackSentiment;
  category: FeedbackCategory;
  source: FeedbackSource;
  rating: number;
  tags: string[];
  summary: string;
  responseExpectation: string;
  payload: FeedbackPayload;
};

export type FeedbackAdmin = {
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  items: FeedbackItem[];
};

export type AnnouncementBadgeTone = "danger" | "brand";

export type AnnouncementAttachment = {
  id: string;
  title: string;
  meta: string;
  type: "pdf" | "image";
  fileUrl?: string;
};

export type AnnouncementItem = {
  id: string;
  badge: string;
  badgeTone: AnnouncementBadgeTone;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  publishedAt: string;
  affectedArea: string;
  schedule: string;
  contact: string;
  summaryTitle: string;
  summaryParagraphs: string[];
  highlightedAreaTitle: string;
  highlightedAreaItems: string[];
  timelineTitle: string;
  timelineParagraphs: string[];
  etaLabel: string;
  etaValue: string;
  teamLabel: string;
  teamValue: string;
  attachments: AnnouncementAttachment[];
  supportTitle: string;
  supportDescription: string;
  imageUri: string;
};

export type AnnouncementAdmin = {
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  labels: {
    category: string;
    publishedAt: string;
    affectedArea: string;
    schedule: string;
    contact: string;
    attachmentsTitle: string;
  };
  items: AnnouncementItem[];
};

export type AdminAccessUserStatus = "active" | "invited" | "suspended";

export type AdminAccessUser = {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  roleLabel: string;
  status: AdminAccessUserStatus;
  phone: string;
  lastActive: string;
  mfaEnabled: boolean;
  assignedBuildings: string[];
  inviteStateLabel: string;
};

export type AdminAccessRole = {
  id: string;
  name: string;
  scope: string;
  description: string;
  modules: string[];
  permissions: string[];
};

export type AdminAccessAuditEntry = {
  id: string;
  title: string;
  description: string;
  meta: string;
  tone: DashboardTone;
};

export type AdminAccess = {
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  users: AdminAccessUser[];
  roles: AdminAccessRole[];
  securityControls: Array<{
    id: string;
    title: string;
    description: string;
    meta: string;
  }>;
  auditEntries: AdminAccessAuditEntry[];
};

export type TenantDashboard = {
  tenantName: string;
  unitLabel: string;
  greeting: string;
  overview: string;
  stats: DashboardStat[];
  actions: DashboardAction[];
  modules: DashboardModule[];
  activities: DashboardActivity[];
  pages: TenantDashboardPages;
  strata: StrataRegistration;
  approvals: UserApprovals;
  billingAdmin: BillingAdmin;
  documentsAdmin: DocumentsAdmin;
  visitorAdmin: VisitorAdmin;
  supportAdmin: SupportAdmin;
  feedbackAdmin: FeedbackAdmin;
  announcementAdmin: AnnouncementAdmin;
  accessAdmin: AdminAccess;
};
