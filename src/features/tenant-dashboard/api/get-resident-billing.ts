import { getAPIBaseURL } from "../../../shared/lib/api-config";
import { unwrapItem } from "../../../shared/lib/api-response";

export type ResidentBillingCharge = {
  id: number;
  reference: string;
  billingType: string;
  category: string;
  periodLabel: string;
  amount: number;
  dueDate: string;
  status: "paid" | "partial" | "unpaid" | "overdue";
  description: string;
};

export type ResidentBillingPayment = {
  id: number;
  reference: string;
  amount: number;
  paidAt: string;
  methodLabel: string;
  status: string;
  description: string;
};

export type ResidentBilling = {
  accountCode: string;
  unitCode: string;
  buildingName: string;
  residentCode: string;
  residentName: string;
  outstanding: number;
  charges: ResidentBillingCharge[];
  recentPayments: ResidentBillingPayment[];
};

export async function getResidentBilling(unitCode: string): Promise<ResidentBilling> {
  const response = await fetch(
    `${getAPIBaseURL()}/api/v1/resident/billing/${encodeURIComponent(unitCode)}`,
  );

  if (!response.ok) {
    throw new Error(`Resident billing fetch failed with status ${response.status}`);
  }

  return unwrapItem((await response.json()) as ResidentBilling | { item: ResidentBilling });
}
