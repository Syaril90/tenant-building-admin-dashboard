import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveAnnouncementAdminWorkspace } from "../api/save-announcement-admin";
import type { TenantDashboard } from "../types";

type SaveAnnouncementAdminInput = {
  items: TenantDashboard["announcementAdmin"]["items"];
};

export function useSaveAnnouncementAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAnnouncementAdminWorkspace,
    onMutate: async (nextWorkspace: SaveAnnouncementAdminInput) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          announcementAdmin: {
            ...previous.announcementAdmin,
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
