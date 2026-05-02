import { mockApiResponse } from "../../../shared/lib/mock-api";

import { tenantDashboardData } from "../data/tenant-dashboard";
import type { AnnouncementAdmin, AnnouncementItem } from "../types";

const ANNOUNCEMENT_ADMIN_STORAGE_KEY = "tenant-dashboard:announcement-admin";

type PersistedAnnouncementAdminWorkspace = {
  items: AnnouncementItem[];
};

function getDefaultWorkspace(): PersistedAnnouncementAdminWorkspace {
  return {
    items: tenantDashboardData.announcementAdmin.items,
  };
}

export function readAnnouncementAdminWorkspace(): PersistedAnnouncementAdminWorkspace {
  if (typeof window === "undefined") {
    return getDefaultWorkspace();
  }

  const storedValue = window.localStorage.getItem(ANNOUNCEMENT_ADMIN_STORAGE_KEY);

  if (!storedValue) {
    return getDefaultWorkspace();
  }

  try {
    const parsed = JSON.parse(storedValue) as PersistedAnnouncementAdminWorkspace;

    return {
      items: parsed.items ?? getDefaultWorkspace().items,
    };
  } catch {
    return getDefaultWorkspace();
  }
}

export async function saveAnnouncementAdminWorkspace(
  workspace: PersistedAnnouncementAdminWorkspace,
): Promise<PersistedAnnouncementAdminWorkspace> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      ANNOUNCEMENT_ADMIN_STORAGE_KEY,
      JSON.stringify(workspace),
    );
  }

  return mockApiResponse(workspace, 300);
}

export function mergeAnnouncementAdmin(
  announcementAdmin: AnnouncementAdmin,
): AnnouncementAdmin {
  const workspace = readAnnouncementAdminWorkspace();

  return {
    ...announcementAdmin,
    items: workspace.items,
  };
}
