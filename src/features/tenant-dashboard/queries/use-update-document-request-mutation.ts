import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updateDocumentRequestAdmin,
  type UpdateDocumentRequestAdminInput
} from "../api/update-document-request-admin";
import type { TenantDashboard } from "../types";

export function useUpdateDocumentRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocumentRequestAdmin,
    onSuccess: (nextItem, variables: UpdateDocumentRequestAdminInput) => {
      queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          documentsAdmin: {
            ...previous.documentsAdmin,
            requests: previous.documentsAdmin.requests.map((request) =>
              request.id === variables.requestId ? nextItem : request
            )
          }
        };
      });
    }
  });
}
