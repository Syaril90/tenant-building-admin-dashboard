import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveBillingImportsWorkspace } from "../api/save-billing-imports";
import type { TenantDashboard } from "../types";

type SaveBillingImportsInput = {
  batches: TenantDashboard["billingAdmin"]["batches"];
  unitRecords: TenantDashboard["billingAdmin"]["unitRecords"];
};

export function useSaveBillingImportsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveBillingImportsWorkspace,
    onMutate: async (nextWorkspace: SaveBillingImportsInput) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          billingAdmin: {
            ...previous.billingAdmin,
            batches: nextWorkspace.batches,
            unitRecords: nextWorkspace.unitRecords,
          },
        });
      }

      return { previous };
    },
    onError: (_error, _nextWorkspace, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tenant-dashboard"], context.previous);
      }
    },
  });
}
