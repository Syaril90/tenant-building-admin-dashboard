import { getAPIBaseURL } from "../../../shared/lib/api-config";
import { unwrapItem } from "../../../shared/lib/api-response";
import type { ComplaintCase, ComplaintStatus } from "../types";

type ComplaintStatusResponse = {
  id: string;
  status: ComplaintStatus;
  updatedAt: string;
  latestUpdate: string;
};

export async function updateComplaintStatusAdmin(input: {
  complaintId: string;
  status: ComplaintStatus;
  comment: string;
}): Promise<ComplaintStatusResponse> {
  const response = await fetch(
    `${getAPIBaseURL()}/api/v1/admin/complaints/${encodeURIComponent(input.complaintId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: input.status, comment: input.comment })
    }
  );

  if (!response.ok) {
    throw new Error("Complaint status update failed");
  }

  return unwrapItem((await response.json()) as ComplaintStatusResponse | { item: ComplaintStatusResponse });
}
