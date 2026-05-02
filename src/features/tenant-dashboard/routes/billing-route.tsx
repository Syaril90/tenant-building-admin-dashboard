import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getResidentBilling, type ResidentBilling } from "../api/get-resident-billing";
import { createBillingChargeAdmin } from "../api/create-billing-charge-admin";
import { recordBillingPaymentAdmin } from "../api/record-billing-payment-admin";
import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import { useSaveBillingImportsMutation } from "../queries/use-save-billing-imports-mutation";
import type {
  BillingAdmin,
  BillingImportBatch,
  BillingImportBatchStatus,
  BillingImportRow,
  BillingImportRowStatus,
  BillingLedgerEntry,
  BillingPaymentMethod,
  BillingUnitPaymentStatus,
  BillingUnitRecord,
  DashboardPageSection,
  StrataRegistration,
  StrataTreeNode,
} from "../types";

type BillingRouteProps = {
  isLoading: boolean;
  billingAdmin?: BillingAdmin;
  strata?: StrataRegistration;
  sections: DashboardPageSection[];
};

type BillingTreeUnit = {
  id: string;
  unitCode: string;
  unitName: string;
  buildingCode: string;
  buildingName: string;
  areaCode?: string;
  areaName?: string;
  record?: BillingUnitRecord;
};

type BillingTreeArea = {
  id: string;
  code: string;
  name: string;
  units: BillingTreeUnit[];
};

type BillingTreeBuilding = {
  id: string;
  code: string;
  name: string;
  directUnits: BillingTreeUnit[];
  areas: BillingTreeArea[];
};

type ManualChargeFormState = {
  billingType: string;
  amount: string;
  dueDate: string;
  reference: string;
  description: string;
};

const rowStatusClass: Record<BillingImportRowStatus, string> = {
  ready: "bg-emerald-50 text-success-700",
  error: "bg-rose-50 text-rose-700",
  pushed: "bg-brand-100 text-brand-900",
};

const batchStatusClass: Record<BillingImportBatchStatus, string> = {
  draft: "bg-amber-50 text-warning-700",
  ready: "bg-emerald-50 text-success-700",
  pushed: "bg-brand-100 text-brand-900",
};

const paymentStatusClass: Record<BillingUnitPaymentStatus, string> = {
  paid: "bg-emerald-50 text-success-700",
  partial: "bg-brand-100 text-brand-900",
  unpaid: "bg-surface-100 text-ink-700",
  overdue: "bg-rose-50 text-rose-700",
};

const offlinePaymentOptions: Array<{
  value: BillingPaymentMethod;
  label: string;
}> = [
  { value: "offline_cash", label: "Cash" },
  { value: "offline_bank_transfer", label: "Bank Transfer" },
  { value: "offline_cheque", label: "Cheque" },
];

export function BillingRoute({
  isLoading,
  billingAdmin,
  strata,
  sections: _sections,
}: BillingRouteProps) {
  const saveBillingImportsMutation = useSaveBillingImportsMutation();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const batches = billingAdmin?.batches ?? [];
  const unitRecords = billingAdmin?.unitRecords ?? [];
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedUnitRecordId, setSelectedUnitRecordId] = useState<string | null>(null);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedChargeUnitCodes, setSelectedChargeUnitCodes] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [billingActionError, setBillingActionError] = useState<string | null>(null);
  const [isBillingActionSubmitting, setIsBillingActionSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BillingUnitPaymentStatus>("all");
  const [offlinePaymentForm, setOfflinePaymentForm] = useState({
    amount: "",
    method: "offline_bank_transfer" as BillingPaymentMethod,
    reference: "",
    notes: "",
  });
  const [manualChargeForm, setManualChargeForm] = useState<ManualChargeFormState>(
    createManualChargeForm(),
  );
  const queryClient = useQueryClient();

  const selectedBatch = selectedBatchId
    ? batches.find((batch) => batch.id === selectedBatchId) ?? null
    : null;

  const selectedUnitRecord = selectedUnitRecordId
    ? unitRecords.find((record) => record.id === selectedUnitRecordId) ?? null
    : null;

  useEffect(() => {
    if (selectedUnitRecordId && !unitRecords.some((record) => record.id === selectedUnitRecordId)) {
      setSelectedUnitRecordId(null);
    }
  }, [selectedUnitRecordId, unitRecords]);

  useEffect(() => {
    if (selectedUnitRecord) {
      setOfflinePaymentForm({
        amount: selectedUnitRecord.outstandingAmount
          ? selectedUnitRecord.outstandingAmount.toFixed(2)
          : "",
        method: "offline_bank_transfer",
        reference: "",
        notes: "",
      });
    }
  }, [selectedUnitRecord]);

  const stats = useMemo(() => {
    const offlinePayments = unitRecords.flatMap((record) =>
      record.ledger.filter(
        (entry) => entry.kind === "payment" && entry.source === "building_admin",
      ),
    );

    return {
      unitsWithBalance: unitRecords.filter((record) => record.outstandingAmount > 0).length,
      overdue: unitRecords.filter((record) => record.status === "overdue").length,
      paid: unitRecords.filter((record) => record.status === "paid").length,
      offline: offlinePayments.length,
    };
  }, [unitRecords]);

  const billingTree = useMemo(
    () => buildBillingTree(strata?.tree ?? [], unitRecords),
    [strata?.tree, unitRecords],
  );

  const filteredBillingTree = useMemo(
    () => filterBillingTree(billingTree, searchValue, statusFilter),
    [billingTree, searchValue, statusFilter],
  );

  const visibleUnitCount = useMemo(
    () => filteredBillingTree.reduce((sum, building) => sum + countBuildingUnits(building), 0),
    [filteredBillingTree],
  );
  const chargeableUnits = useMemo(
    () => billingTree.flatMap((building) => collectBuildingUnits(building)),
    [billingTree],
  );
  const chargeableUnitByCode = useMemo(
    () => new Map(chargeableUnits.map((unit) => [unit.unitCode, unit])),
    [chargeableUnits],
  );
  const selectedChargeUnits = selectedChargeUnitCodes
    .map((unitCode) => chargeableUnitByCode.get(unitCode))
    .filter((unit): unit is BillingTreeUnit => Boolean(unit));

  function persistBilling(nextBatches: BillingImportBatch[], nextUnitRecords: BillingUnitRecord[]) {
    saveBillingImportsMutation.mutate({
      batches: nextBatches,
      unitRecords: nextUnitRecords,
    });
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const rows = parseBillingCsv(await file.text());
      const now = new Date();
      const nextBatch: BillingImportBatch = {
        id: `billing-batch-${now.getTime()}`,
        fileName: file.name,
        importedAt: formatImportedAt(now),
        status: rows.every((row) => row.status !== "error") ? "ready" : "draft",
        rows,
      };

      persistBilling([nextBatch, ...batches], unitRecords);
      setSelectedBatchId(nextBatch.id);
      setImportError(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "CSV import failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function pushBatch(batchId: string) {
    const batch = batches.find((item) => item.id === batchId);

    if (!batch || batch.status === "pushed") {
      return;
    }

    const readyRows = batch.rows.filter((row) => row.status === "ready");
    if (readyRows.length === 0) {
      return;
    }

    setBillingActionError(null);
    setIsBillingActionSubmitting(true);

    try {
      for (const row of readyRows) {
        await createBillingChargeAdmin({
          unitCodes: [row.unitCode],
          billingType: row.billingType,
          category: "Management",
          periodLabel: inferPeriodLabel(row.dueDate),
          icon: "wallet-outline",
          amount: row.amount,
          dueDate: row.dueDate,
          reference: row.reference,
          description: row.description,
          source: "building_admin",
        });
      }

      const nextBatches = batches.map((item) => {
        if (item.id !== batchId) {
          return item;
        }

        return {
          ...item,
          status: "pushed" as const,
          rows: item.rows.map((row) =>
            row.status === "ready" ? { ...row, status: "pushed" as const } : row,
          ),
        };
      });

      persistBilling(nextBatches, unitRecords);
      await queryClient.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    } catch (error) {
      setBillingActionError(
        error instanceof Error ? error.message : "Unable to push billing batch.",
      );
    } finally {
      setIsBillingActionSubmitting(false);
    }
  }

  async function recordOfflineTransaction(recordId: string) {
    const amount = Number.parseFloat(offlinePaymentForm.amount);
    const reference = offlinePaymentForm.reference.trim();
    const notes = offlinePaymentForm.notes.trim();

    if (!selectedUnitRecord || selectedUnitRecord.id !== recordId) {
      return;
    }

    if (Number.isNaN(amount) || amount <= 0 || !reference) {
      return;
    }

    setBillingActionError(null);
    setIsBillingActionSubmitting(true);

    try {
      await recordBillingPaymentAdmin({
        unitCode: selectedUnitRecord.unitCode,
        chargeReferences: outstandingChargeReferences(selectedUnitRecord),
        amount,
        reference,
        description:
          notes ||
          `Offline ${formatPaymentMethodLabel(offlinePaymentForm.method)} recorded by management`,
        source: "building_admin",
        methodId: offlinePaymentForm.method,
        methodLabel: formatPaymentMethodLabel(offlinePaymentForm.method),
        status: "successful",
      });

      setOfflinePaymentForm({
        amount: "",
        method: "offline_bank_transfer",
        reference: "",
        notes: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    } catch (error) {
      setBillingActionError(
        error instanceof Error ? error.message : "Unable to record offline payment.",
      );
    } finally {
      setIsBillingActionSubmitting(false);
    }
  }

  async function addChargesToSelectedUnits() {
    if (selectedChargeUnitCodes.length === 0) {
      return;
    }

    const amount = Number.parseFloat(manualChargeForm.amount);
    const billingType = manualChargeForm.billingType.trim();
    const dueDate = manualChargeForm.dueDate.trim();
    const reference = manualChargeForm.reference.trim();
    const description = manualChargeForm.description.trim();

    if (
      !billingType ||
      Number.isNaN(amount) ||
      amount <= 0 ||
      !dueDate ||
      !reference ||
      !description
    ) {
      return;
    }

    setBillingActionError(null);
    setIsBillingActionSubmitting(true);

    try {
      await createBillingChargeAdmin({
        unitCodes: selectedChargeUnitCodes,
        billingType,
        category: "Management",
        periodLabel: inferPeriodLabel(dueDate),
        icon: "wallet-outline",
        amount,
        dueDate,
        reference,
        description,
        source: "building_admin",
      });

      setIsChargeModalOpen(false);
      setSelectedChargeUnitCodes([]);
      setManualChargeForm(createManualChargeForm());
      await queryClient.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    } catch (error) {
      setBillingActionError(error instanceof Error ? error.message : "Unable to add bill.");
    } finally {
      setIsBillingActionSubmitting(false);
    }
  }

  function openChargeModal(unitCodes?: string[]) {
    setSelectedChargeUnitCodes(unitCodes ?? []);
    setManualChargeForm(createManualChargeForm());
    setIsChargeModalOpen(true);
  }

  function toggleChargeUnit(unitCode: string) {
    setSelectedChargeUnitCodes((current) =>
      current.includes(unitCode)
        ? current.filter((code) => code !== unitCode)
        : [...current, unitCode],
    );
  }

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(event) => {
          handleImportFile(event).catch(() => {
            setImportError("CSV import failed.");
            event.target.value = "";
          });
        }}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard
          label="Units With Balance"
          value={stats.unitsWithBalance}
          tone="warning"
          hint="Units that still carry an outstanding billed amount."
        />
        <DashboardStatCard
          label="Overdue Units"
          value={stats.overdue}
          tone="danger"
          hint="Units with unpaid balances already past the due date."
        />
        <DashboardStatCard
          label="Fully Paid"
          value={stats.paid}
          tone="success"
          hint="Unit ledgers currently settled with no outstanding balance."
        />
        <DashboardStatCard
          label="Offline Payments"
          value={stats.offline}
          tone="brand"
          hint="Offline settlements recorded manually by the building team."
        />
      </section>

      {selectedUnitRecord ? (
        <DashboardModal
          title={billingAdmin?.helperTitle ?? "Billing Record Detail"}
          description={
            billingAdmin?.helperDescription ??
            "Review the unit ledger first, then record offline settlement only after verification."
          }
          onClose={() => setSelectedUnitRecordId(null)}
        >
          <UnitRecordDetail
            record={selectedUnitRecord}
            offlinePaymentForm={offlinePaymentForm}
            onChangeOfflinePaymentForm={(field, value) =>
              setOfflinePaymentForm((current) => ({ ...current, [field]: value }))
            }
            onRecordOfflineTransaction={() => recordOfflineTransaction(selectedUnitRecord.id)}
          />
        </DashboardModal>
      ) : null}

      {isChargeModalOpen ? (
        <DashboardModal
          title="Add Bill"
          description="Select one or more units from the building hierarchy, then apply the same bill to every selected unit."
          onClose={() => {
            setIsChargeModalOpen(false);
            setSelectedChargeUnitCodes([]);
          }}
        >
          <ManualChargeForm
            billingTree={billingTree}
            selectedUnitCodes={selectedChargeUnitCodes}
            form={manualChargeForm}
            onToggleUnit={toggleChargeUnit}
            onChange={(field, value) =>
              setManualChargeForm((current) => ({ ...current, [field]: value }))
            }
            onSubmit={addChargesToSelectedUnits}
          />
        </DashboardModal>
      ) : null}

      {selectedBatch ? (
        <DashboardModal
          title="Batch Preview"
          description="Push only validated rows. Pushed charges will appear under the matching unit records."
          onClose={() => setSelectedBatchId(null)}
        >
          <BatchPreviewContent selectedBatch={selectedBatch} onPushBatch={pushBatch} />
        </DashboardModal>
      ) : null}

      <section>
        <DashboardPanel
          title={billingAdmin?.title ?? "Billing Tree & Push Control"}
          description={billingAdmin?.description ?? ""}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border-100 bg-canvas-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search building, area, unit, resident, or billing type"
                  className="min-w-[260px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
                />
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | BillingUnitPaymentStatus)
                  }
                  className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
                >
                  <option value="all">All payment statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openChargeModal()}
                  className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Add Bill
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex rounded-pill border border-brand-900 px-4 py-2 text-sm font-semibold text-brand-900"
                >
                  Import CSV Batch
                </button>
                <a
                  href="/samples/billing-import-template.csv"
                  download
                  className="inline-flex rounded-pill border border-border-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700"
                >
                  Download sample CSV
                </a>
              </div>
            </div>

            {!isLoading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Showing {visibleUnitCount} units in the billing tree
              </p>
            ) : null}

            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => <BillingRecordSkeleton key={index} />)
              ) : filteredBillingTree.length > 0 ? (
                filteredBillingTree.map((building) => (
                  <BillingBuildingCard
                    key={building.id}
                    building={building}
                    onOpenLedger={(recordId) => setSelectedUnitRecordId(recordId)}
                    onOpenSingleCharge={(unit) => openChargeModal([unit.unitCode])}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border-100 bg-canvas-50 p-6 text-sm text-ink-500">
                  No billing units match the current search or status filter.
                </div>
              )}
            </div>

            {importError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {importError}
              </div>
            ) : null}

            {billingActionError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {billingActionError}
              </div>
            ) : null}
          </div>
        </DashboardPanel>
      </section>

      <section>
        <DashboardPanel
          title="Push Billing Batches"
          description="Validate imported rows, then push the ready charges into the matching unit records."
        >
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <BatchSkeleton key={index} />)
              : batches.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      batch.id === selectedBatchId
                        ? "border-brand-900 bg-brand-100/40 shadow-card"
                        : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-900">{batch.fileName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                          Imported {batch.importedAt}
                        </p>
                      </div>
                      <span
                        className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${batchStatusClass[batch.status]}`}
                      >
                        {batch.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-ink-500">
                      {batch.rows.length} rows •{" "}
                      {batch.rows.filter((row) => row.status === "ready").length} ready •{" "}
                      {batch.rows.filter((row) => row.status === "error").length} errors
                    </p>
                  </button>
                ))}
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function BillingBuildingCard({
  building,
  onOpenLedger,
  onOpenSingleCharge,
}: {
  building: BillingTreeBuilding;
  onOpenLedger: (recordId: string) => void;
  onOpenSingleCharge: (unit: BillingTreeUnit) => void;
}) {
  const totalUnits = countBuildingUnits(building);
  const unitsWithBalance = collectBuildingUnits(building).filter(
    (unit) => (unit.record?.outstandingAmount ?? 0) > 0,
  ).length;

  return (
    <details open className="rounded-3xl border border-border-100 bg-white p-5 shadow-card">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-pill bg-brand-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-900">
              Building
            </span>
            <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-brand-900">
              {building.name}
            </h3>
            <p className="mt-2 text-sm text-ink-500">
              {totalUnits} units shown • {unitsWithBalance} units with balance
            </p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-100 bg-canvas-50 text-lg font-semibold text-ink-700">
            {"›"}
          </span>
        </div>
      </summary>

      <div className="mt-5 space-y-5">
        {building.directUnits.length > 0 ? (
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Direct Units</p>
            <div className="space-y-3">
              {building.directUnits.map((unit) => (
                <BillingTreeUnitCard
                  key={unit.id}
                  unit={unit}
                  onOpenLedger={onOpenLedger}
                  onOpenSingleCharge={onOpenSingleCharge}
                />
              ))}
            </div>
          </section>
        ) : null}

        {building.areas.map((area) => (
          <section key={area.id} className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Area</p>
                <p className="mt-1 text-base font-bold text-brand-900">{area.name}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                {area.units.length} units
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {area.units.map((unit) => (
                <BillingTreeUnitCard
                  key={unit.id}
                  unit={unit}
                  onOpenLedger={onOpenLedger}
                  onOpenSingleCharge={onOpenSingleCharge}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </details>
  );
}

function BillingTreeUnitCard({
  unit,
  onOpenLedger,
  onOpenSingleCharge,
}: {
  unit: BillingTreeUnit;
  onOpenLedger: (recordId: string) => void;
  onOpenSingleCharge: (unit: BillingTreeUnit) => void;
}) {
  const record = unit.record;

  return (
    <details className="rounded-2xl border border-border-100 bg-white p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-900">
              {unit.unitCode} • {unit.unitName}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
              {record
                ? `${record.residentName} • ${record.residentCode || "No resident code"}`
                : "No billing ledger created yet"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {record ? (
                <>
                  <span className="rounded-pill border border-border-100 bg-canvas-50 px-3 py-1 text-[11px] font-semibold text-ink-700">
                    Outstanding {formatCurrency(record.outstandingAmount)}
                  </span>
                  <span className="rounded-pill border border-border-100 bg-canvas-50 px-3 py-1 text-[11px] font-semibold text-ink-700">
                    Due {record.dueDate}
                  </span>
                </>
              ) : (
                <span className="rounded-pill border border-border-100 bg-canvas-50 px-3 py-1 text-[11px] font-semibold text-ink-700">
                  Ready for first charge
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {record ? (
              <span
                className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${paymentStatusClass[record.status]}`}
              >
                {record.status}
              </span>
            ) : (
              <span className="rounded-pill bg-surface-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">
                no charges
              </span>
            )}
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-100 bg-canvas-50 text-lg font-semibold text-ink-700">
              {"›"}
            </span>
          </div>
        </div>
      </summary>

      {record ? (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <BillingValue label="Billed" value={formatCurrency(record.totalBilled)} />
            <BillingValue label="Paid" value={formatCurrency(record.totalPaid)} />
            <BillingValue label="Outstanding" value={formatCurrency(record.outstandingAmount)} />
            <BillingValue label="Due Date" value={record.dueDate} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {record.billingTypes.map((type) => (
              <span
                key={type}
                className="rounded-pill border border-border-100 bg-canvas-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700"
              >
                {type}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink-500">
          Start this unit with a manual single charge, or wait for a batch import to create the
          first billing record.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {record ? (
          <button
            type="button"
            onClick={() => onOpenLedger(record.id)}
            className="inline-flex rounded-pill border border-border-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700"
          >
            View Ledger
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenSingleCharge(unit)}
          className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Add Single Charge
        </button>
      </div>
    </details>
  );
}

function ManualChargeForm({
  billingTree,
  selectedUnitCodes,
  form,
  onToggleUnit,
  onChange,
  onSubmit,
}: {
  billingTree: BillingTreeBuilding[];
  selectedUnitCodes: string[];
  form: ManualChargeFormState;
  onToggleUnit: (unitCode: string) => void;
  onChange: (field: keyof ManualChargeFormState, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Selected Units</p>
            <p className="mt-2 text-lg font-bold text-brand-900">
              {selectedUnitCodes.length} unit{selectedUnitCodes.length === 1 ? "" : "s"}
            </p>
          </div>
          <span className="rounded-pill border border-border-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">
            Same bill to all selected units
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Unit Hierarchy</p>
        <div className="mt-4 space-y-4">
          {billingTree.map((building) => (
            <div key={building.id} className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-brand-900">{building.name}</p>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  {countBuildingUnits(building)} units
                </span>
              </div>

              {building.directUnits.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <tbody>
                      {building.directUnits.map((unit) => (
                        <HierarchyUnitRow
                          key={unit.id}
                          unit={unit}
                          selected={selectedUnitCodes.includes(unit.unitCode)}
                          onToggle={onToggleUnit}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {building.areas.map((area) => (
                <div key={area.id} className="mt-4 rounded-2xl border border-border-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                      {area.name}
                    </p>
                    <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                      {area.units.length} units
                    </span>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <tbody>
                        {area.units.map((unit) => (
                          <HierarchyUnitRow
                            key={unit.id}
                            unit={unit}
                            selected={selectedUnitCodes.includes(unit.unitCode)}
                            onToggle={onToggleUnit}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Billing Type</span>
          <input
            value={form.billingType}
            onChange={(event) => onChange("billingType", event.target.value)}
            placeholder="Maintenance"
            className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Amount</span>
          <input
            value={form.amount}
            onChange={(event) => onChange("amount", event.target.value)}
            placeholder="0.00"
            className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Due Date</span>
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => onChange("dueDate", event.target.value)}
            className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Reference</span>
          <input
            value={form.reference}
            onChange={(event) => onChange("reference", event.target.value)}
            placeholder="MAY-MTN-A1208"
            className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={
          !form.billingType.trim() ||
          !form.amount.trim() ||
          !form.dueDate.trim() ||
          !form.reference.trim() ||
          !form.description.trim() ||
          selectedUnitCodes.length === 0
        }
        className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-border-100 disabled:bg-surface-100 disabled:text-ink-400"
      >
        Apply Bill to Selected Units
      </button>
    </div>
  );
}

function HierarchyUnitRow({
  unit,
  selected,
  onToggle,
}: {
  unit: BillingTreeUnit;
  selected: boolean;
  onToggle: (unitCode: string) => void;
}) {
  return (
    <tr className="border-t border-border-100 first:border-t-0">
      <td className="w-12 py-3 pr-3 align-top">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(unit.unitCode)}
          className="h-4 w-4 rounded border-border-100"
        />
      </td>
      <td className="py-3 align-top">
        <p className="font-semibold text-brand-900">
          {unit.unitCode} • {unit.unitName}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
          {unit.record
            ? `${unit.record.residentName} • ${unit.record.status}`
            : "No billing ledger yet"}
        </p>
      </td>
      <td className="py-3 text-right align-top">
        <span className="text-sm font-semibold text-ink-700">
          {unit.record ? formatCurrency(unit.record.outstandingAmount) : "—"}
        </span>
      </td>
    </tr>
  );
}

function UnitRecordDetail({
  record,
  offlinePaymentForm,
  onChangeOfflinePaymentForm,
  onRecordOfflineTransaction,
}: {
  record: BillingUnitRecord;
  offlinePaymentForm: {
    amount: string;
    method: BillingPaymentMethod;
    reference: string;
    notes: string;
  };
  onChangeOfflinePaymentForm: (
    field: "amount" | "method" | "reference" | "notes",
    value: string,
  ) => void;
  onRecordOfflineTransaction: () => void;
}) {
  const detailQuery = useQuery({
    queryKey: ["resident-billing-admin-detail", record.unitCode],
    queryFn: () => getResidentBilling(record.unitCode),
  });

  const detail = detailQuery.data;
  const totalBilled = detail
    ? detail.charges.reduce((sum, charge) => sum + charge.amount, 0)
    : record.totalBilled;
  const totalPaid = detail ? Math.max(totalBilled - detail.outstanding, 0) : record.totalPaid;
  const outstanding = detail?.outstanding ?? record.outstandingAmount;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Unit Billing</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
            {record.unitCode} • {record.residentName}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {record.buildingName} • {record.residentCode || "No resident code"}
          </p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${paymentStatusClass[record.status]}`}
        >
          {record.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BillingDetailBlock label="Total Billed" value={formatCurrency(totalBilled)} />
        <BillingDetailBlock label="Total Paid" value={formatCurrency(totalPaid)} />
        <BillingDetailBlock
          label="Outstanding Balance"
          value={formatCurrency(outstanding)}
        />
        <BillingDetailBlock label="Due Date" value={record.dueDate} />
      </div>

      <div className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Charge Types</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {record.billingTypes.map((item) => (
            <span
              key={item}
              className="rounded-pill border border-border-100 bg-white px-3 py-1 text-xs font-semibold text-ink-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          Record Offline Transaction
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Amount</span>
            <input
              value={offlinePaymentForm.amount}
              onChange={(event) => onChangeOfflinePaymentForm("amount", event.target.value)}
              className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Method</span>
            <select
              value={offlinePaymentForm.method}
              onChange={(event) => onChangeOfflinePaymentForm("method", event.target.value)}
              className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
            >
              {offlinePaymentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Reference</span>
            <input
              value={offlinePaymentForm.reference}
              onChange={(event) => onChangeOfflinePaymentForm("reference", event.target.value)}
              className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Notes</span>
            <textarea
              value={offlinePaymentForm.notes}
              onChange={(event) => onChangeOfflinePaymentForm("notes", event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onRecordOfflineTransaction}
          disabled={!offlinePaymentForm.amount || !offlinePaymentForm.reference.trim()}
          className="mt-4 inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-border-100 disabled:bg-surface-100 disabled:text-ink-400"
        >
          Record Offline Payment
        </button>
      </div>

      <div className="rounded-2xl border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Live Charges</p>
        {detailQuery.isLoading ? (
          <div className="mt-3 rounded-xl bg-canvas-50 p-4 text-sm text-ink-500">
            Loading unit billing detail...
          </div>
        ) : detail ? (
          <div className="mt-3 space-y-3">
            {detail.charges.map((charge) => (
              <div
                key={`charge-${charge.id}`}
                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border-100 bg-canvas-50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] bg-amber-50 text-warning-700">
                      charge
                    </span>
                    <span
                      className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${paymentStatusClass[charge.status]}`}
                    >
                      {charge.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-brand-900">{charge.reference}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">{charge.description}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                    Due {charge.dueDate}
                  </p>
                </div>
                <p className="text-sm font-bold text-brand-900">{formatCurrency(charge.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Unable to load the live billing detail for this unit.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Recent Payments</p>
        {detail ? (
          detail.recentPayments.length > 0 ? (
            <div className="mt-3 space-y-3">
              {detail.recentPayments.map((payment) => (
                <div
                  key={`payment-${payment.id}`}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border-100 bg-canvas-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] bg-emerald-50 text-success-700">
                        payment
                      </span>
                      <span className="rounded-pill bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700 ring-1 ring-border-100">
                        {payment.methodLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-brand-900">{payment.reference}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-500">{payment.description}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                      {payment.paidAt}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-brand-900">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-canvas-50 p-4 text-sm text-ink-500">
              No payments recorded yet for this unit.
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

function BatchPreviewContent({
  selectedBatch,
  onPushBatch,
}: {
  selectedBatch: BillingImportBatch;
  onPushBatch: (batchId: string) => void | Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-brand-900">{selectedBatch.fileName}</p>
          <p className="mt-1 text-sm text-ink-500">
            {selectedBatch.rows.length} rows in this batch
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void onPushBatch(selectedBatch.id);
          }}
          disabled={selectedBatch.status === "pushed"}
          className="inline-flex rounded-pill border border-brand-900 px-4 py-2 text-sm font-semibold text-brand-900 disabled:cursor-not-allowed disabled:border-border-100 disabled:text-ink-400"
        >
          {selectedBatch.status === "pushed" ? "Already Pushed" : "Push Ready Rows"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-ink-500">
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Resident Code</th>
              <th className="px-3 py-2">Unit Code</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Due Date</th>
              <th className="px-3 py-2">Reference</th>
            </tr>
          </thead>
          <tbody>
            {selectedBatch.rows.map((row) => (
              <tr key={row.id} className="rounded-lg bg-canvas-50">
                <td className="rounded-l-lg px-3 py-3 align-top">
                  <span
                    className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${rowStatusClass[row.status]}`}
                  >
                    {row.status}
                  </span>
                  {row.errors.length > 0 ? (
                    <p className="mt-2 max-w-[220px] text-xs leading-5 text-rose-700">
                      {row.errors.join(" ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-ink-500">
                      Matched via {row.matchSource.replace("_", " ")}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 align-top text-brand-900">{row.residentCode || "—"}</td>
                <td className="px-3 py-3 align-top text-brand-900">{row.unitCode || "—"}</td>
                <td className="px-3 py-3 align-top text-brand-900">{row.billingType}</td>
                <td className="px-3 py-3 align-top text-brand-900">{formatCurrency(row.amount)}</td>
                <td className="px-3 py-3 align-top text-brand-900">{row.dueDate}</td>
                <td className="rounded-r-lg px-3 py-3 align-top text-ink-500">
                  <p>{row.reference}</p>
                  <p className="mt-1 max-w-[240px] text-xs leading-5">{row.description}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-100 bg-canvas-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function BillingDetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function BillingRecordSkeleton() {
  return (
    <div className="rounded-3xl border border-border-100 bg-white p-5 shadow-card">
      <div className="h-4 w-20 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-7 w-52 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-6 space-y-3">
        <div className="h-20 rounded-2xl bg-surface-100" />
        <div className="h-20 rounded-2xl bg-surface-100" />
      </div>
    </div>
  );
}

function BatchSkeleton() {
  return <div className="h-28 animate-pulse rounded-2xl bg-surface-100" />;
}

function applyBatchToUnitRecords(
  unitRecords: BillingUnitRecord[],
  batch: BillingImportBatch,
): BillingUnitRecord[] {
  const nextRecords = [...unitRecords];

  batch.rows
    .filter((row) => row.status === "ready")
    .forEach((row) => {
      const existingIndex = nextRecords.findIndex(
        (record) =>
          (row.residentCode && record.residentCode === row.residentCode) ||
          record.unitCode === row.unitCode,
      );

      if (existingIndex >= 0) {
        const existing = nextRecords[existingIndex];
        const hasExistingCharge = existing.ledger.some(
          (entry) =>
            entry.kind === "charge" &&
            entry.reference === row.reference &&
            entry.amount === row.amount,
        );

        if (hasExistingCharge) {
          return;
        }

        nextRecords[existingIndex] = recalculateBillingRecord({
          ...existing,
          dueDate: row.dueDate,
          latestReference: row.reference,
          billingTypes: Array.from(new Set([...existing.billingTypes, row.billingType])),
          ledger: [
            {
              id: `ledger-charge-${row.id}`,
              kind: "charge",
              postedAt: batch.importedAt,
              amount: row.amount,
              reference: row.reference,
              description: row.description,
              source: "system",
            },
            ...existing.ledger,
          ],
        });

        return;
      }

      nextRecords.unshift(
        recalculateBillingRecord({
          id: `billing-record-${row.residentCode || row.unitCode}`,
          residentCode: row.residentCode,
          unitCode: row.unitCode,
          residentName: inferResidentName(row),
          buildingName: inferBuildingName(row.unitCode),
          dueDate: row.dueDate,
          totalBilled: row.amount,
          totalPaid: 0,
          outstandingAmount: row.amount,
          status: "unpaid",
          latestReference: row.reference,
          billingTypes: [row.billingType],
          ledger: [
            {
              id: `ledger-charge-${row.id}`,
              kind: "charge",
              postedAt: batch.importedAt,
              amount: row.amount,
              reference: row.reference,
              description: row.description,
              source: "system",
            },
          ],
        }),
      );
    });

  return nextRecords;
}

function inferPeriodLabel(dueDate: string) {
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Current Period";
  }

  return parsed.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });
}

function outstandingChargeReferences(record: BillingUnitRecord) {
  return record.ledger
    .filter((entry) => entry.kind === "charge")
    .map((entry) => entry.reference)
    .filter((reference, index, items) => items.indexOf(reference) === index);
}

function recalculateBillingRecord(record: BillingUnitRecord): BillingUnitRecord {
  const totalBilled = record.ledger
    .filter((entry) => entry.kind === "charge")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalPaid = record.ledger
    .filter((entry) => entry.kind === "payment")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const outstandingAmount = Math.max(0, totalBilled - totalPaid);
  const latestPayment = record.ledger.find((entry) => entry.kind === "payment");
  const isOverdue = outstandingAmount > 0 && isPastDue(record.dueDate);

  return {
    ...record,
    totalBilled,
    totalPaid,
    outstandingAmount,
    status:
      outstandingAmount <= 0
        ? "paid"
        : isOverdue
          ? "overdue"
          : totalPaid > 0
            ? "partial"
            : "unpaid",
    lastPaymentAt: latestPayment?.postedAt,
    latestReference: record.ledger[0]?.reference ?? record.latestReference,
  };
}

function buildBillingTree(strataTree: StrataTreeNode[], unitRecords: BillingUnitRecord[]) {
  const recordByUnitCode = new Map(unitRecords.map((record) => [record.unitCode, record]));
  const seenUnitCodes = new Set<string>();

  const buildings = strataTree
    .filter((node) => node.type === "building")
    .map((building) => {
      const directUnits: BillingTreeUnit[] = [];
      const areas: BillingTreeArea[] = [];

      (building.children ?? []).forEach((child) => {
        if (child.type === "unit") {
          directUnits.push(
            createTreeUnit(child, building, undefined, recordByUnitCode.get(child.code)),
          );
          seenUnitCodes.add(child.code);
          return;
        }

        if (child.type === "area") {
          const areaUnits = collectAreaUnits(child, building, recordByUnitCode, seenUnitCodes);
          if (areaUnits.length > 0) {
            areas.push({
              id: child.id,
              code: child.code,
              name: child.name,
              units: areaUnits,
            });
          }
        }
      });

      return {
        id: building.id,
        code: building.code,
        name: building.name,
        directUnits,
        areas,
      } satisfies BillingTreeBuilding;
    });

  unitRecords.forEach((record) => {
    if (seenUnitCodes.has(record.unitCode)) {
      return;
    }

    const buildingName = record.buildingName || "Unassigned Building";
    const buildingCode = `orphan-${sanitizeIdSegment(buildingName)}`;
    let building = buildings.find((item) => item.code === buildingCode);

    if (!building) {
      building = {
        id: buildingCode,
        code: buildingCode,
        name: buildingName,
        directUnits: [],
        areas: [],
      };
      buildings.push(building);
    }

    building.directUnits.push({
      id: `orphan-unit-${sanitizeIdSegment(record.unitCode)}`,
      unitCode: record.unitCode,
      unitName: record.unitCode,
      buildingCode,
      buildingName,
      record,
    });
  });

  return buildings;
}

function collectAreaUnits(
  areaNode: StrataTreeNode,
  buildingNode: StrataTreeNode,
  recordByUnitCode: Map<string, BillingUnitRecord>,
  seenUnitCodes: Set<string>,
): BillingTreeUnit[] {
  const units: BillingTreeUnit[] = [];

  (areaNode.children ?? []).forEach((child) => {
    if (child.type === "unit") {
      units.push(createTreeUnit(child, buildingNode, areaNode, recordByUnitCode.get(child.code)));
      seenUnitCodes.add(child.code);
      return;
    }

    if (child.type === "area") {
      units.push(...collectAreaUnits(child, buildingNode, recordByUnitCode, seenUnitCodes));
    }
  });

  return units;
}

function createTreeUnit(
  unitNode: StrataTreeNode,
  buildingNode: StrataTreeNode,
  areaNode: StrataTreeNode | undefined,
  record: BillingUnitRecord | undefined,
): BillingTreeUnit {
  return {
    id: unitNode.id,
    unitCode: unitNode.code,
    unitName: unitNode.name,
    buildingCode: buildingNode.code,
    buildingName: buildingNode.name,
    areaCode: areaNode?.code,
    areaName: areaNode?.name,
    record,
  };
}

function filterBillingTree(
  buildings: BillingTreeBuilding[],
  searchValue: string,
  statusFilter: "all" | BillingUnitPaymentStatus,
) {
  const query = searchValue.trim().toLowerCase();

  return buildings
    .map((building) => {
      const directUnits = building.directUnits.filter((unit) =>
        matchesUnitFilters(unit, query, statusFilter),
      );
      const areas = building.areas
        .map((area) => ({
          ...area,
          units: area.units.filter((unit) => matchesUnitFilters(unit, query, statusFilter)),
        }))
        .filter((area) => area.units.length > 0);

      return {
        ...building,
        directUnits,
        areas,
      };
    })
    .filter((building) => building.directUnits.length > 0 || building.areas.length > 0);
}

function matchesUnitFilters(
  unit: BillingTreeUnit,
  query: string,
  statusFilter: "all" | BillingUnitPaymentStatus,
) {
  const matchesStatus =
    statusFilter === "all" ? true : unit.record ? unit.record.status === statusFilter : false;

  const searchHaystack = [
    unit.buildingName,
    unit.areaName,
    unit.unitCode,
    unit.unitName,
    unit.record?.residentName,
    unit.record?.residentCode,
    unit.record?.billingTypes.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchesSearch = query.length === 0 ? true : searchHaystack.includes(query);

  return matchesStatus && matchesSearch;
}

function countBuildingUnits(building: BillingTreeBuilding) {
  return building.directUnits.length + building.areas.reduce((sum, area) => sum + area.units.length, 0);
}

function collectBuildingUnits(building: BillingTreeBuilding) {
  return [...building.directUnits, ...building.areas.flatMap((area) => area.units)];
}

function createManualChargeForm(target?: BillingTreeUnit): ManualChargeFormState {
  return {
    billingType: "",
    amount: "",
    dueDate: target?.record?.dueDate ?? todayIsoDate(),
    reference: "",
    description: "",
  };
}

function parseBillingCsv(text: string): BillingImportRow[] {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("CSV file is empty.");
  }

  const [headerRow, ...rows] = trimmed.split(/\r?\n/);
  const headers = headerRow.split(",").map((value) => cleanCsvValue(value));
  const requiredHeaders = [
    "resident_code",
    "unit_code",
    "billing_type",
    "amount",
    "due_date",
    "description",
    "reference",
  ];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(", ")}`);
  }

  return rows
    .filter((row) => row.trim().length > 0)
    .map((row, index) => {
      const values = row.split(",").map((value) => cleanCsvValue(value));
      const record = new Map<string, string>();

      headers.forEach((header, headerIndex) => {
        record.set(header, values[headerIndex] ?? "");
      });

      const residentCode = record.get("resident_code") ?? "";
      const unitCode = record.get("unit_code") ?? "";
      const billingType = record.get("billing_type") ?? "";
      const amountRaw = record.get("amount") ?? "";
      const dueDate = record.get("due_date") ?? "";
      const description = record.get("description") ?? "";
      const reference = record.get("reference") ?? "";
      const errors: string[] = [];

      if (!residentCode && !unitCode) {
        errors.push("Either resident_code or unit_code is required.");
      }

      if (!billingType) {
        errors.push("billing_type is required.");
      }

      const amount = Number.parseFloat(amountRaw);
      if (Number.isNaN(amount) || amount <= 0) {
        errors.push("amount must be a valid positive number.");
      }

      if (!dueDate) {
        errors.push("due_date is required.");
      }

      if (!description) {
        errors.push("description is required.");
      }

      if (!reference) {
        errors.push("reference is required.");
      }

      return {
        id: `billing-row-${index + 1}-${residentCode || unitCode || "unmatched"}`,
        residentCode,
        unitCode,
        billingType,
        amount: Number.isNaN(amount) ? 0 : amount,
        dueDate,
        description,
        reference,
        matchSource: residentCode
          ? "resident_code"
          : unitCode
            ? "unit_code"
            : "unmatched",
        status: errors.length > 0 ? "error" : "ready",
        errors,
      } satisfies BillingImportRow;
    });
}

function cleanCsvValue(value: string) {
  return value.trim().replace(/^"|"$/g, "");
}

function inferBuildingName(unitCode: string) {
  if (unitCode.startsWith("A-")) {
    return "Serene Heights Tower A";
  }

  if (unitCode.startsWith("B-")) {
    return "Serene Heights Tower B";
  }

  if (unitCode.startsWith("P-")) {
    return "Retail Podium";
  }

  return "Managed Building";
}

function inferResidentName(row: BillingImportRow) {
  if (row.residentCode) {
    return `Resident ${row.residentCode}`;
  }

  return `Unit ${row.unitCode}`;
}

function isPastDue(dueDate: string) {
  const due = new Date(`${dueDate}T23:59:59`);

  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatImportedAt(value: Date) {
  return value.toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPaymentMethodLabel(method: BillingPaymentMethod) {
  switch (method) {
    case "online":
      return "Online";
    case "offline_cash":
      return "Cash";
    case "offline_bank_transfer":
      return "Bank Transfer";
    case "offline_cheque":
      return "Cheque";
    default:
      return method;
  }
}
