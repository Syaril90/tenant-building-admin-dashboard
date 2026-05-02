import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createAnnouncementAdminItem, type CreateAnnouncementAdminInput } from "../api/create-announcement-admin";
import type { TenantDashboard } from "../types";

export function useCreateAnnouncementAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAnnouncementAdminItem,
    onSuccess: (nextItem, _variables) => {
      queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          announcementAdmin: {
            ...previous.announcementAdmin,
            items: [nextItem, ...previous.announcementAdmin.items],
          },
        };
      });
    },
  });
}
