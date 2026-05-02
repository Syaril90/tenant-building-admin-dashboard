import { getAPIBaseURL } from "../../../shared/lib/api-config";
import { unwrapItem } from "../../../shared/lib/api-response";

import type { DocumentsFile } from "../types";

export type CreateDocumentAdminInput = {
  title: string;
  description: string;
  categoryId: string;
  buildingCode?: string;
  file: File;
};

export async function createDocumentAdminItem(
  input: CreateDocumentAdminInput
): Promise<DocumentsFile> {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("description", input.description);
  formData.append("categoryId", input.categoryId);
  formData.append("file", input.file);

  if (input.buildingCode) {
    formData.append("buildingCode", input.buildingCode);
  }

  const response = await fetch(`${getAPIBaseURL()}/api/v1/admin/documents`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Document create failed with status ${response.status}`);
  }

  return unwrapItem((await response.json()) as DocumentsFile | { item: DocumentsFile });
}
