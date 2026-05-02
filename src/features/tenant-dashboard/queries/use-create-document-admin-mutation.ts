import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createDocumentAdminItem, type CreateDocumentAdminInput } from "../api/create-document-admin";
import type { TenantDashboard } from "../types";

export function useCreateDocumentAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocumentAdminItem,
    onSuccess: (nextItem, _variables) => {
      queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          documentsAdmin: {
            ...previous.documentsAdmin,
            items: [nextItem, ...previous.documentsAdmin.items]
          }
        };
      });
    }
  });
}
