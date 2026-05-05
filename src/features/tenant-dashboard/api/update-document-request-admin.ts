import { getAPIBaseURL } from "../../../shared/lib/api-config";
import { unwrapItem } from "../../../shared/lib/api-response";
import type { DocumentRequestItem, DocumentRequestStatus } from "../types";

export type UpdateDocumentRequestAdminInput = {
  requestId: string;
  status: DocumentRequestStatus;
  comment: string;
  attachment?: File | null;
};

export async function updateDocumentRequestAdmin(
  input: UpdateDocumentRequestAdminInput
): Promise<DocumentRequestItem> {
  const formData = new FormData();
  formData.append("status", input.status);
  formData.append("comment", input.comment);

  if (input.attachment) {
    formData.append("attachments", input.attachment);
  }

  const response = await fetch(
    `${getAPIBaseURL()}/api/v1/admin/document-requests/${encodeURIComponent(input.requestId)}/status`,
    {
      method: "PATCH",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("Document request update failed");
  }

  return unwrapItem(
    (await response.json()) as DocumentRequestItem | { item: DocumentRequestItem }
  );
}
