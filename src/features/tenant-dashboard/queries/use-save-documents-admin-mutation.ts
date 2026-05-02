import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveDocumentsAdminWorkspace } from "../api/save-documents-admin";
import type { TenantDashboard } from "../types";

type SaveDocumentsAdminInput = {
  items: TenantDashboard["documentsAdmin"]["items"];
};

export function useSaveDocumentsAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveDocumentsAdminWorkspace,
    onMutate: async (nextWorkspace: SaveDocumentsAdminInput) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          documentsAdmin: {
            ...previous.documentsAdmin,
            items: nextWorkspace.items,
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
