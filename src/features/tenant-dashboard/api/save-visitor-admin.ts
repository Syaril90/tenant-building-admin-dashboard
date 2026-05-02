import { getAPIBaseURL } from "../../../shared/lib/api-config";
import type {
  VisitorApproval,
  VisitorParkingQuotaConfig,
} from "../types";

type PersistedVisitorAdminWorkspace = {
  approvals: VisitorApproval[];
  buildingConfigs: VisitorParkingQuotaConfig[];
};

export async function saveVisitorAdminWorkspace(
  workspace: PersistedVisitorAdminWorkspace,
): Promise<PersistedVisitorAdminWorkspace> {
  const baseURL = getAPIBaseURL();
  const [requestsResponse, configsResponse] = await Promise.all([
    fetch(`${baseURL}/api/v1/admin/visitor-requests`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: workspace.approvals.map((approval) => ({
          id: approval.id,
          status: approval.status,
          parkingSlotsRequested: approval.parkingSlotsRequested
        }))
      })
    }),
    fetch(`${baseURL}/api/v1/admin/visitor-parking-configs`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: workspace.buildingConfigs.map((config) => ({
          buildingCode: config.buildingCode,
          totalSlots: config.totalSlots
        }))
      })
    })
  ]);

  if (!requestsResponse.ok || !configsResponse.ok) {
    throw new Error(
      `Visitor admin save failed with status ${requestsResponse.status}/${configsResponse.status}`
    );
  }

  const requestsPayload = (await requestsResponse.json()) as {
    items: VisitorApproval[];
  };
  const configsPayload = (await configsResponse.json()) as {
    items: VisitorParkingQuotaConfig[];
  };

  return {
    approvals: requestsPayload.items,
    buildingConfigs: configsPayload.items
  };
}
