import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveUserApprovalsWorkspace } from "../api/save-user-approvals";
import type { TenantDashboard } from "../types";

type SaveUserApprovalsInput = {
  approvals: TenantDashboard["approvals"]["approvals"];
};

export function useSaveUserApprovalsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveUserApprovalsWorkspace,
    onMutate: async (nextWorkspace: SaveUserApprovalsInput) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          approvals: {
            ...previous.approvals,
            approvals: nextWorkspace.approvals,
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
