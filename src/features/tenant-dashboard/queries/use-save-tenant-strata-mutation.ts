import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveTenantStrataWorkspace } from "../api/save-tenant-strata";
import type { TenantDashboard } from "../types";

type SaveTenantStrataInput = {
  tree: TenantDashboard["strata"]["tree"];
  uploadsByNode: TenantDashboard["strata"]["uploadsByNode"];
};

export function useSaveTenantStrataMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTenantStrataWorkspace,
    onMutate: async (nextWorkspace: SaveTenantStrataInput) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          strata: {
            ...previous.strata,
            tree: nextWorkspace.tree,
            uploadsByNode: nextWorkspace.uploadsByNode
          }
        });
      }

      return { previous };
    },
    onError: (_error, _nextWorkspace, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tenant-dashboard"], context.previous);
      }
    }
  });
}
