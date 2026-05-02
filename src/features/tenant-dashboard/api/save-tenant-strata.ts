import { mockApiResponse } from "../../../shared/lib/mock-api";

import { tenantDashboardData } from "../data/tenant-dashboard";
import type { StrataRegistration, StrataTreeNode, StrataUploadMeta } from "../types";

const STRATA_STORAGE_KEY = "tenant-dashboard:strata-workspace";

type PersistedStrataWorkspace = {
  tree: StrataTreeNode[];
  uploadsByNode: Record<string, StrataUploadMeta[]>;
};

function getDefaultWorkspace(): PersistedStrataWorkspace {
  return {
    tree: tenantDashboardData.strata.tree,
    uploadsByNode: tenantDashboardData.strata.uploadsByNode
  };
}

export function readTenantStrataWorkspace(): PersistedStrataWorkspace {
  if (typeof window === "undefined") {
    return getDefaultWorkspace();
  }

  const storedValue = window.localStorage.getItem(STRATA_STORAGE_KEY);

  if (!storedValue) {
    return getDefaultWorkspace();
  }

  try {
    const parsed = JSON.parse(storedValue) as PersistedStrataWorkspace;

    return {
      tree: parsed.tree ?? getDefaultWorkspace().tree,
      uploadsByNode: parsed.uploadsByNode ?? {}
    };
  } catch {
    return getDefaultWorkspace();
  }
}

export async function saveTenantStrataWorkspace(
  workspace: PersistedStrataWorkspace
): Promise<PersistedStrataWorkspace> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STRATA_STORAGE_KEY, JSON.stringify(workspace));
  }

  return mockApiResponse(workspace, 300);
}

export function mergeStrataRegistration(
  registration: StrataRegistration
): StrataRegistration {
  const workspace = readTenantStrataWorkspace();

  return {
    ...registration,
    tree: workspace.tree,
    uploadsByNode: workspace.uploadsByNode
  };
}
