import { getAPIBaseURL } from "../../../shared/lib/api-config";
import { unwrapItem } from "../../../shared/lib/api-response";
import type { AnnouncementItem } from "../types";

export type CreateAnnouncementAdminInput = {
  title: string;
  description: string;
  badgeTone: "brand" | "danger";
  affectedArea: string;
  effectiveAt: string;
  contact: string;
  imageFile?: File | null;
  attachmentFiles?: File[];
};

export async function createAnnouncementAdminItem(
  input: CreateAnnouncementAdminInput
): Promise<AnnouncementItem> {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("description", input.description);
  formData.append("badgeTone", input.badgeTone);
  formData.append("affectedArea", input.affectedArea);
  formData.append("effectiveAt", input.effectiveAt);
  formData.append("contact", input.contact);

  if (input.imageFile) {
    formData.append("image", input.imageFile);
  }

  for (const file of input.attachmentFiles ?? []) {
    formData.append("attachments", file);
  }

  const response = await fetch(`${getAPIBaseURL()}/api/v1/admin/announcements`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Announcement create failed with status ${response.status}`);
  }

  return unwrapItem((await response.json()) as AnnouncementItem | { item: AnnouncementItem });
}
