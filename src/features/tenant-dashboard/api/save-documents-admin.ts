import { mockApiResponse } from "../../../shared/lib/mock-api";

import { tenantDashboardData } from "../data/tenant-dashboard";
import type { DocumentsAdmin, DocumentsFile } from "../types";

const DOCUMENTS_ADMIN_STORAGE_KEY = "tenant-dashboard:documents-admin";

type PersistedDocumentsAdminWorkspace = {
  items: DocumentsFile[];
};

function getDefaultWorkspace(): PersistedDocumentsAdminWorkspace {
  return {
    items: tenantDashboardData.documentsAdmin.items,
  };
}

export function readDocumentsAdminWorkspace(): PersistedDocumentsAdminWorkspace {
  if (typeof window === "undefined") {
    return getDefaultWorkspace();
  }

  const storedValue = window.localStorage.getItem(DOCUMENTS_ADMIN_STORAGE_KEY);

  if (!storedValue) {
    return getDefaultWorkspace();
  }

  try {
    const parsed = JSON.parse(storedValue) as PersistedDocumentsAdminWorkspace;

    return {
      items: parsed.items ?? getDefaultWorkspace().items,
    };
  } catch {
    return getDefaultWorkspace();
  }
}

export async function saveDocumentsAdminWorkspace(
  workspace: PersistedDocumentsAdminWorkspace,
): Promise<PersistedDocumentsAdminWorkspace> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      DOCUMENTS_ADMIN_STORAGE_KEY,
      JSON.stringify(workspace),
    );
  }

  return mockApiResponse(workspace, 300);
}

export function mergeDocumentsAdmin(documentsAdmin: DocumentsAdmin): DocumentsAdmin {
  const workspace = readDocumentsAdminWorkspace();

  return {
    ...documentsAdmin,
    items: workspace.items,
  };
}
