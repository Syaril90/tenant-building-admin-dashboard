import { mockApiResponse } from "../../../shared/lib/mock-api";

import { tenantDashboardData } from "../data/tenant-dashboard";
import type { ComplaintCase, ComplaintVendor, SupportAdmin } from "../types";

const SUPPORT_ADMIN_STORAGE_KEY = "tenant-dashboard:support-admin";

type PersistedSupportAdminWorkspace = {
  complaints: ComplaintCase[];
  vendors: ComplaintVendor[];
};

function normalizeComplaintCase(
  complaint: Partial<ComplaintCase>,
  fallbackComplaint?: ComplaintCase,
): ComplaintCase {
  return {
    ...fallbackComplaint,
    ...complaint,
    previews: complaint.previews ?? fallbackComplaint?.previews ?? [],
    timeline: complaint.timeline ?? fallbackComplaint?.timeline ?? [],
    attachments: complaint.attachments ?? fallbackComplaint?.attachments ?? [],
  } as ComplaintCase;
}

function getDefaultWorkspace(): PersistedSupportAdminWorkspace {
  return {
    complaints: tenantDashboardData.supportAdmin.complaints,
    vendors: tenantDashboardData.supportAdmin.vendors,
  };
}

export function readSupportAdminWorkspace(): PersistedSupportAdminWorkspace {
  if (typeof window === "undefined") {
    return getDefaultWorkspace();
  }

  const storedValue = window.localStorage.getItem(SUPPORT_ADMIN_STORAGE_KEY);

  if (!storedValue) {
    return getDefaultWorkspace();
  }

  try {
    const parsed = JSON.parse(storedValue) as PersistedSupportAdminWorkspace;
    const defaultWorkspace = getDefaultWorkspace();

    return {
      complaints:
        parsed.complaints?.map((complaint) =>
          normalizeComplaintCase(
            complaint,
            defaultWorkspace.complaints.find(
              (defaultComplaint) => defaultComplaint.id === complaint.id,
            ),
          ),
        ) ?? defaultWorkspace.complaints,
      vendors: parsed.vendors ?? defaultWorkspace.vendors,
    };
  } catch {
    return getDefaultWorkspace();
  }
}

export async function saveSupportAdminWorkspace(
  workspace: PersistedSupportAdminWorkspace,
): Promise<PersistedSupportAdminWorkspace> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      SUPPORT_ADMIN_STORAGE_KEY,
      JSON.stringify(workspace),
    );
  }

  return mockApiResponse(workspace, 300);
}

export function mergeSupportAdmin(supportAdmin: SupportAdmin): SupportAdmin {
  const workspace = readSupportAdminWorkspace();

  return {
    ...supportAdmin,
    complaints: workspace.complaints,
    vendors: workspace.vendors,
  };
}
