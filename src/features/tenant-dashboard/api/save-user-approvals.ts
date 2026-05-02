import { mockApiResponse } from "../../../shared/lib/mock-api";

import { tenantDashboardData } from "../data/tenant-dashboard";
import type { UnitMemberApproval, UserApprovals } from "../types";

const APPROVALS_STORAGE_KEY = "tenant-dashboard:user-approvals";

type PersistedApprovalsWorkspace = {
  approvals: UnitMemberApproval[];
};

function getDefaultWorkspace(): PersistedApprovalsWorkspace {
  return {
    approvals: tenantDashboardData.approvals.approvals,
  };
}

export function readUserApprovalsWorkspace(): PersistedApprovalsWorkspace {
  if (typeof window === "undefined") {
    return getDefaultWorkspace();
  }

  const storedValue = window.localStorage.getItem(APPROVALS_STORAGE_KEY);

  if (!storedValue) {
    return getDefaultWorkspace();
  }

  try {
    const parsed = JSON.parse(storedValue) as PersistedApprovalsWorkspace;

    return {
      approvals: parsed.approvals ?? getDefaultWorkspace().approvals,
    };
  } catch {
    return getDefaultWorkspace();
  }
}

export async function saveUserApprovalsWorkspace(
  workspace: PersistedApprovalsWorkspace,
): Promise<PersistedApprovalsWorkspace> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(workspace));
  }

  return mockApiResponse(workspace, 300);
}

export function mergeUserApprovals(approvals: UserApprovals): UserApprovals {
  const workspace = readUserApprovalsWorkspace();

  return {
    ...approvals,
    approvals: workspace.approvals,
  };
}
