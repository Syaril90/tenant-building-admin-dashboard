import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveSupportAdminWorkspace } from "../api/save-support-admin";
import type { TenantDashboard } from "../types";

type SaveSupportAdminInput = {
  complaints: TenantDashboard["supportAdmin"]["complaints"];
  vendors: TenantDashboard["supportAdmin"]["vendors"];
};

export function useSaveSupportAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveSupportAdminWorkspace,
    onMutate: async (nextWorkspace: SaveSupportAdminInput) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          supportAdmin: {
            ...previous.supportAdmin,
            complaints: nextWorkspace.complaints,
            vendors: nextWorkspace.vendors,
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
