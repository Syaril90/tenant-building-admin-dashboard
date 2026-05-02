import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateComplaintStatusAdmin } from "../api/update-complaint-status-admin";
import type { ComplaintStatus, TenantDashboard } from "../types";

export function useUpdateComplaintStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateComplaintStatusAdmin,
    onMutate: async (variables: { complaintId: string; status: ComplaintStatus; comment: string }) => {
      await queryClient.cancelQueries({ queryKey: ["tenant-dashboard"] });
      const previous = queryClient.getQueryData<TenantDashboard>(["tenant-dashboard"]);
      const optimisticTimestamp = new Date().toLocaleString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });

      if (previous) {
        queryClient.setQueryData<TenantDashboard>(["tenant-dashboard"], {
          ...previous,
          supportAdmin: {
            ...previous.supportAdmin,
            complaints: previous.supportAdmin.complaints.map((complaint) =>
              complaint.id === variables.complaintId
                ? {
                    ...complaint,
                    status: variables.status,
                    statusTone: variables.status === "done" ? "success" : "warning",
                    updatedAt: optimisticTimestamp,
                    latestUpdate: variables.comment,
                    conciergeMessage: variables.comment,
                    timeline: [
                      {
                        id: `${complaint.id}-optimistic`,
                        title: variables.status === "done" ? "Done" : variables.status === "in_progress" ? "In Progress" : "Received",
                        description: variables.comment,
                        timestamp: optimisticTimestamp,
                        isCurrent: true
                      },
                      ...complaint.timeline.map((item) => ({ ...item, isCurrent: false }))
                    ]
                  }
                : complaint
            )
          }
        });
      }

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tenant-dashboard"], context.previous);
      }
    }
  });
}
