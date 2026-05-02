import { mockApiResponse } from "../../../shared/lib/mock-api";

import { tenantDashboardData } from "../data/tenant-dashboard";
import type { BillingAdmin, BillingImportBatch, BillingUnitRecord } from "../types";

const BILLING_IMPORTS_STORAGE_KEY = "tenant-dashboard:billing-imports";

type PersistedBillingImportsWorkspace = {
  batches: BillingImportBatch[];
  unitRecords: BillingUnitRecord[];
};

function getDefaultWorkspace(): PersistedBillingImportsWorkspace {
  return {
    batches: tenantDashboardData.billingAdmin.batches,
    unitRecords: tenantDashboardData.billingAdmin.unitRecords,
  };
}

export function readBillingImportsWorkspace(): PersistedBillingImportsWorkspace {
  if (typeof window === "undefined") {
    return getDefaultWorkspace();
  }

  const storedValue = window.localStorage.getItem(BILLING_IMPORTS_STORAGE_KEY);

  if (!storedValue) {
    return getDefaultWorkspace();
  }

  try {
    const parsed = JSON.parse(storedValue) as PersistedBillingImportsWorkspace;

    return {
      batches: parsed.batches ?? getDefaultWorkspace().batches,
      unitRecords: parsed.unitRecords ?? getDefaultWorkspace().unitRecords,
    };
  } catch {
    return getDefaultWorkspace();
  }
}

export async function saveBillingImportsWorkspace(
  workspace: PersistedBillingImportsWorkspace,
): Promise<PersistedBillingImportsWorkspace> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      BILLING_IMPORTS_STORAGE_KEY,
      JSON.stringify(workspace),
    );
  }

  return mockApiResponse(workspace, 300);
}

export function mergeBillingAdmin(billingAdmin: BillingAdmin): BillingAdmin {
  const workspace = readBillingImportsWorkspace();

  return {
    ...billingAdmin,
    batches: workspace.batches,
  };
}
