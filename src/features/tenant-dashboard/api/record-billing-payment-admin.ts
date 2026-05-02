import { getAPIBaseURL } from "../../../shared/lib/api-config";

export type RecordBillingPaymentAdminInput = {
  unitCode: string;
  chargeReferences: string[];
  amount: number;
  reference: string;
  description: string;
  source: string;
  methodId: string;
  methodLabel: string;
  status: string;
};

export async function recordBillingPaymentAdmin(
  input: RecordBillingPaymentAdminInput,
): Promise<void> {
  const response = await fetch(`${getAPIBaseURL()}/api/v1/admin/billing/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Billing payment record failed with status ${response.status}`);
  }
}
