import { useQuery } from "@tanstack/react-query";

import { getTenantDashboard } from "../api/get-tenant-dashboard";

export function useTenantDashboardQuery() {
  return useQuery({
    queryKey: ["tenant-dashboard"],
    queryFn: getTenantDashboard
  });
}
