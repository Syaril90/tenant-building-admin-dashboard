import { getAPIBaseURL } from "../../../shared/lib/api-config";

export type CreateBillingChargeAdminInput = {
  unitCodes: string[];
  billingType: string;
  category: string;
  periodLabel: string;
  icon: string;
  amount: number;
  dueDate: string;
  reference: string;
  description: string;
  source: string;
};

export async function createBillingChargeAdmin(
  input: CreateBillingChargeAdminInput,
): Promise<void> {
  const response = await fetch(`${getAPIBaseURL()}/api/v1/admin/billing/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Billing charge create failed with status ${response.status}`);
  }
}
