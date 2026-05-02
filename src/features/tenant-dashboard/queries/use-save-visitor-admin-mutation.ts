import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveVisitorAdminWorkspace } from "../api/save-visitor-admin";
import type { TenantDashboard } from "../types";

type SaveVisitorAdminInput = {
  approvals: TenantDashboard["visitorAdmin"]["approvals"];
  buildingConfigs: TenantDashboard["visitorAdmin"]["buildingConfigs"];
};

export function useSaveVisitorAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveVisitorAdminWorkspace,
    onMutate: async (nextWorkspace: SaveVisitorAdminInput) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          visitorAdmin: {
            ...previous.visitorAdmin,
            approvals: nextWorkspace.approvals,
            buildingConfigs: nextWorkspace.buildingConfigs,
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
    onSuccess: (workspace, _variables) => {
      queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          visitorAdmin: {
            ...previous.visitorAdmin,
            approvals: workspace.approvals,
            buildingConfigs: workspace.buildingConfigs,
          },
        };
      });
    },
  });
}
