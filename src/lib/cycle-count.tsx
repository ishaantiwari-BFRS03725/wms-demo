import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BinType = "Bulk Line" | "Pick Line";
export type TaskStatus = "pending" | "in-progress" | "review" | "completed";
export type TaskKind = "ABC" | "Ad-hoc" | "Snap" | "SOS";
export type SuspenseStatus = "open" | "reconciled" | "pna";
export type StorageType = "Pickline" | "Bulkline" | "Pickline Bulk";

export interface Task {
  id: string;
  kind: TaskKind;
  zone: string;
  totalBins: number;
  assignedTo: string;
  sla: string;
  status: TaskStatus;
}

export interface BinCount {
  binId: string;
  binType: BinType;
  sku: string;
  skuName: string;
  lot: string;
  mfd: string;
  expiry: string;
  mrp: number;
  packSize: number;
  systemQty: number;
  physicalQty: number | null;
}

export interface SuspenseEntry {
  id: string;
  binId: string;
  binType: BinType;
  sku: string;
  lot: string;
  mfd: string;
  expiry: string;
  mrp: number;
  packSize: number;
  excessQty: number;
  suspenseQty: number;
  status: SuspenseStatus;
  source: string;
  createdBy?: string;
  createdAt?: string;
  storageType?: StorageType;
}

export interface ReconciliationStep {
  type: "reconcile" | "suspense" | "pna" | "cleanup" | "global" | "info";
  message: string;
  qty?: number;
  result: "ok" | "warn" | "risk" | "info";
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const TASKS: Task[] = [
  { id: "CC-2024-001", kind: "ABC", zone: "Zone A", totalBins: 6, assignedTo: "Ravi Kumar", sla: "14:30", status: "in-progress" },
  { id: "CC-2024-002", kind: "SOS", zone: "Zone B", totalBins: 5, assignedTo: "Anita Desai", sla: "13:00", status: "review" },
  { id: "CC-2024-003", kind: "Ad-hoc", zone: "Zone C", totalBins: 3, assignedTo: "Mohit Sharma", sla: "16:00", status: "pending" },
  { id: "CC-2024-004", kind: "Snap", zone: "Zone A", totalBins: 8, assignedTo: "Priya Nair", sla: "10:00", status: "completed" },
];

export const INITIAL_COUNTS: Record<string, BinCount[]> = {
  "CC-2024-001": [
    { binId: "A-01", binType: "Bulk Line", sku: "SKU-179", skuName: "boAt Airdopes 141 TWS", lot: "LOT-A24", mfd: "2024-06-01", expiry: "2027-06-01", mrp: 1299, packSize: 6, systemQty: 30, physicalQty: 36 },
    { binId: "A-02", binType: "Pick Line", sku: "SKU-822", skuName: "boAt Rockerz 450 Headphones", lot: "LOT-B24", mfd: "2024-04-15", expiry: "2027-04-15", mrp: 1499, packSize: 6, systemQty: 24, physicalQty: 18 },
    { binId: "B-01", binType: "Bulk Line", sku: "SKU-868", skuName: "boAt Bassheads 100 Wired", lot: "LOT-C24", mfd: "2024-05-01", expiry: "2027-05-01", mrp: 499, packSize: 12, systemQty: 48, physicalQty: 48 },
    { binId: "B-02", binType: "Pick Line", sku: "SKU-900", skuName: "boAt Stone 350 Speaker", lot: "LOT-D24", mfd: "2024-03-10", expiry: "2027-03-10", mrp: 2499, packSize: 4, systemQty: 16, physicalQty: null },
    { binId: "C-01", binType: "Bulk Line", sku: "SKU-002", skuName: "boAt Type-C 500 Cable", lot: "LOT-E24", mfd: "2024-02-01", expiry: "2026-02-01", mrp: 299, packSize: 12, systemQty: 60, physicalQty: null },
    { binId: "C-02", binType: "Bulk Line", sku: "SKU-179", skuName: "boAt Airdopes 141 TWS", lot: "LOT-A24", mfd: "2024-06-01", expiry: "2027-06-01", mrp: 1299, packSize: 6, systemQty: 12, physicalQty: null },
  ],
  // CC-2024-002: all counted, ready for reconciliation — showcases all cases
  "CC-2024-002": [
    // Case 1 — Excess=6, Bulk Line, packSize=6 → all adjustable, matches SUS-001 suspense
    { binId: "G-01", binType: "Bulk Line", sku: "SKU-179", skuName: "boAt Airdopes 141 TWS", lot: "LOT-A24", mfd: "2024-06-01", expiry: "2027-06-01", mrp: 1299, packSize: 6, systemQty: 30, physicalQty: 36 },
    // Case 2 — Shortage=6, Pick Line (no pack size) → matches SUS-002 excess
    { binId: "H-01", binType: "Pick Line", sku: "SKU-822", skuName: "boAt Rockerz 450 Headphones", lot: "LOT-B24", mfd: "2024-04-15", expiry: "2027-04-15", mrp: 1499, packSize: 6, systemQty: 24, physicalQty: 18 },
    // Case 1 — Excess=7, Bulk Line, packSize=12 → nonAdj=7, adj=0 → goes to suspense, resolved by global adjustment
    { binId: "I-01", binType: "Bulk Line", sku: "SKU-868", skuName: "boAt Bassheads 100 Wired", lot: "LOT-C24", mfd: "2024-05-01", expiry: "2027-05-01", mrp: 499, packSize: 12, systemQty: 48, physicalQty: 55 },
    // Case 3 — Balanced
    { binId: "J-01", binType: "Pick Line", sku: "SKU-900", skuName: "boAt Stone 350 Speaker", lot: "LOT-D24", mfd: "2024-03-10", expiry: "2027-03-10", mrp: 2499, packSize: 4, systemQty: 20, physicalQty: 20 },
    // PNA — lot not found in inventory
    { binId: "K-01", binType: "Bulk Line", sku: "SKU-002", skuName: "boAt Type-C 500 Cable", lot: "LOT-X99", mfd: "2023-01-01", expiry: "2026-01-01", mrp: 299, packSize: 12, systemQty: 60, physicalQty: 72 },
  ],
  "CC-2024-003": [
    { binId: "P-01", binType: "Bulk Line", sku: "SKU-179", skuName: "boAt Airdopes 141 TWS", lot: "LOT-A24", mfd: "2024-06-01", expiry: "2027-06-01", mrp: 1299, packSize: 6, systemQty: 24, physicalQty: null },
    { binId: "P-02", binType: "Pick Line", sku: "SKU-822", skuName: "boAt Rockerz 450 Headphones", lot: "LOT-B24", mfd: "2024-04-15", expiry: "2027-04-15", mrp: 1499, packSize: 6, systemQty: 18, physicalQty: null },
    { binId: "P-03", binType: "Bulk Line", sku: "SKU-868", skuName: "boAt Bassheads 100 Wired", lot: "LOT-C24", mfd: "2024-05-01", expiry: "2027-05-01", mrp: 499, packSize: 12, systemQty: 36, physicalQty: null },
  ],
};

// SKU → product name, derived from the seeded counts
export const SKU_NAME_MAP: Record<string, string> = Object.values(INITIAL_COUNTS)
  .flat()
  .reduce<Record<string, string>>((acc, b) => {
    acc[b.sku] = b.skuName;
    return acc;
  }, {});

// Candidate batches per SKU, derived from the seeded counts (used by the operator dropdown)
export interface BatchOption {
  lot: string;
  mfd: string;
  expiry: string;
  mrp: number;
}

export const SKU_BATCHES: Record<string, BatchOption[]> = Object.values(INITIAL_COUNTS)
  .flat()
  .reduce<Record<string, BatchOption[]>>((acc, b) => {
    const list = acc[b.sku] ?? (acc[b.sku] = []);
    if (!list.some((x) => x.lot === b.lot)) {
      list.push({ lot: b.lot, mfd: b.mfd, expiry: b.expiry, mrp: b.mrp });
    }
    return acc;
  }, {});

// Pre-existing suspense entries from prior counts
export const INITIAL_SUSPENSE: SuspenseEntry[] = [
  // 6 units missing from bin X-01 (SKU-179) — will match G-01 excess
  { id: "SUS-001", binId: "X-01", binType: "Bulk Line", sku: "SKU-179", lot: "LOT-A24", mfd: "2024-06-01", expiry: "2027-06-01", mrp: 1299, packSize: 6, excessQty: 0, suspenseQty: 6, status: "open", source: "CC-2024-000", createdBy: "Ravi Kumar", createdAt: "2026-07-06 09:42", storageType: "Bulkline" },
  // 6 extra found in bin Y-01 (SKU-822) — will match H-01 shortage
  { id: "SUS-002", binId: "Y-01", binType: "Bulk Line", sku: "SKU-822", lot: "LOT-B24", mfd: "2024-04-15", expiry: "2027-04-15", mrp: 1499, packSize: 6, excessQty: 6, suspenseQty: 0, status: "open", source: "CC-2024-000", createdBy: "Anita Desai", createdAt: "2026-07-06 11:15", storageType: "Pickline Bulk" },
  // 12 units missing from bin Z-01 (SKU-868) — global adjustment resolves 7 after I-01
  { id: "SUS-003", binId: "Z-01", binType: "Bulk Line", sku: "SKU-868", lot: "LOT-C24", mfd: "2024-05-01", expiry: "2027-05-01", mrp: 499, packSize: 12, excessQty: 0, suspenseQty: 12, status: "open", source: "CC-2024-000", createdBy: "System", createdAt: "2026-07-07 08:03", storageType: "Bulkline" },
];

// Valid inventory combinations (lot + MFD + expiry + MRP must all match)
export const KNOWN_COMBOS = new Set([
  "SKU-179|LOT-A24|2024-06-01|2027-06-01|1299",
  "SKU-822|LOT-B24|2024-04-15|2027-04-15|1499",
  "SKU-868|LOT-C24|2024-05-01|2027-05-01|499",
  "SKU-900|LOT-D24|2024-03-10|2027-03-10|2499",
  "SKU-002|LOT-E24|2024-02-01|2026-02-01|299",
]);

// ─── Reconciliation Logic ─────────────────────────────────────────────────────

export function runReconciliation(
  counts: BinCount[],
  suspense: SuspenseEntry[],
): { updatedSuspense: SuspenseEntry[]; steps: ReconciliationStep[] } {
  const steps: ReconciliationStep[] = [];
  let s = suspense.map((e) => ({ ...e }));
  let nextSuffix = 0;
  const nextId = () => `SUS-NEW-${String(++nextSuffix).padStart(3, "0")}`;

  for (const bin of counts) {
    if (bin.physicalQty === null) {
      steps.push({ type: "info", message: `${bin.binId}: Not yet counted — skipped`, result: "info" });
      continue;
    }

    const excess = Math.max(0, bin.physicalQty - bin.systemQty);
    const shortage = Math.max(0, bin.systemQty - bin.physicalQty);

    // Case 3: Balanced
    if (excess === 0 && shortage === 0) {
      const stale = s.filter((e) => e.binId === bin.binId && e.sku === bin.sku && e.status === "open");
      if (stale.length > 0) {
        s = s.map((e) => (stale.find((st) => st.id === e.id) ? { ...e, status: "reconciled" as const } : e));
        steps.push({ type: "cleanup", message: `${bin.binId} · ${bin.sku}: Balanced — cleared ${stale.length} stale suspense record(s)`, result: "ok" });
      } else {
        steps.push({ type: "cleanup", message: `${bin.binId} · ${bin.sku}: Balanced — no discrepancy, no action`, result: "ok" });
      }
      continue;
    }

    // Inventory combination check (lot + MFD + expiry + MRP)
    const comboKey = `${bin.sku}|${bin.lot}|${bin.mfd}|${bin.expiry}|${bin.mrp}`;
    if (!KNOWN_COMBOS.has(comboKey)) {
      steps.push({ type: "pna", message: `${bin.binId} · ${bin.sku} (Lot ${bin.lot}): Combination not found in inventory — marked PNA`, result: "risk" });
      continue;
    }

    if (excess > 0) {
      // Case 1: Excess found
      steps.push({ type: "info", message: `${bin.binId} · ${bin.sku}: Excess = ${excess} (system ${bin.systemQty}, physical ${bin.physicalQty})`, result: "info" });

      if (bin.binType === "Bulk Line") {
        const nonAdj = excess % bin.packSize;
        const adj = excess - nonAdj;

        if (adj > 0) {
          // Reconcile pack-aligned portion against bulk suspense
          const bulkSuspense = s.filter(
            (e) =>
              e.sku === bin.sku && e.lot === bin.lot && e.mfd === bin.mfd &&
              e.expiry === bin.expiry && e.mrp === bin.mrp &&
              e.suspenseQty > 0 && e.status === "open" && e.binType === "Bulk Line",
          );
          let adjLeft = adj;
          for (const match of bulkSuspense) {
            if (adjLeft <= 0) break;
            const r = Math.min(adjLeft, match.suspenseQty);
            s = s.map((e) =>
              e.id === match.id
                ? { ...e, suspenseQty: e.suspenseQty - r, status: e.suspenseQty - r === 0 ? ("reconciled" as const) : ("open" as const) }
                : e,
            );
            adjLeft -= r;
            steps.push({ type: "reconcile", qty: r, message: `Reconciled ${r} excess from ${bin.binId} ↔ suspense in ${match.binId} — no inventory adjustment`, result: "ok" });
          }
          if (adjLeft > 0) {
            s.push({ id: nextId(), binId: bin.binId, binType: bin.binType, sku: bin.sku, lot: bin.lot, mfd: bin.mfd, expiry: bin.expiry, mrp: bin.mrp, packSize: bin.packSize, excessQty: adjLeft, suspenseQty: 0, status: "open", source: "CC-2024-002" });
            steps.push({ type: "suspense", qty: adjLeft, message: `${adjLeft} excess units added to suspense for ${bin.binId} — no matching suspense found`, result: "warn" });
          }
        }

        if (nonAdj > 0) {
          // Try pick-line suspense for non-pack-aligned remainder
          const pickSus = s.filter(
            (e) => e.sku === bin.sku && e.lot === bin.lot && e.suspenseQty > 0 && e.status === "open" && e.binType === "Pick Line",
          );
          if (pickSus.length > 0) {
            const match = pickSus[0];
            const r = Math.min(nonAdj, match.suspenseQty);
            s = s.map((e) =>
              e.id === match.id
                ? { ...e, suspenseQty: e.suspenseQty - r, status: e.suspenseQty - r === 0 ? ("reconciled" as const) : ("open" as const) }
                : e,
            );
            steps.push({ type: "reconcile", qty: r, message: `Non-adjustable ${r} units reconciled with pick-line suspense in ${match.binId}`, result: "ok" });
            const leftover = nonAdj - r;
            if (leftover > 0) {
              s.push({ id: nextId(), binId: bin.binId, binType: bin.binType, sku: bin.sku, lot: bin.lot, mfd: bin.mfd, expiry: bin.expiry, mrp: bin.mrp, packSize: bin.packSize, excessQty: leftover, suspenseQty: 0, status: "open", source: "CC-2024-002" });
              steps.push({ type: "suspense", qty: leftover, message: `Remaining ${leftover} non-adjustable units (${excess} % pack-size ${bin.packSize} = ${nonAdj}) added to suspense`, result: "warn" });
            }
          } else {
            s.push({ id: nextId(), binId: bin.binId, binType: bin.binType, sku: bin.sku, lot: bin.lot, mfd: bin.mfd, expiry: bin.expiry, mrp: bin.mrp, packSize: bin.packSize, excessQty: nonAdj, suspenseQty: 0, status: "open", source: "CC-2024-002" });
            steps.push({ type: "suspense", qty: nonAdj, message: `Non-adjustable ${nonAdj} units (${excess} % pack-size ${bin.packSize} = ${nonAdj}) — not a multiple of pack size — added to suspense`, result: "warn" });
          }
        }
      } else {
        // Pick Line: no pack size constraint
        const anySuspense = s.filter(
          (e) =>
            e.sku === bin.sku && e.lot === bin.lot && e.mfd === bin.mfd &&
            e.expiry === bin.expiry && e.mrp === bin.mrp &&
            e.suspenseQty > 0 && e.status === "open",
        );
        let left = excess;
        for (const match of anySuspense) {
          if (left <= 0) break;
          const r = Math.min(left, match.suspenseQty);
          s = s.map((e) =>
            e.id === match.id
              ? { ...e, suspenseQty: e.suspenseQty - r, status: e.suspenseQty - r === 0 ? ("reconciled" as const) : ("open" as const) }
              : e,
          );
          left -= r;
          steps.push({ type: "reconcile", qty: r, message: `Reconciled ${r} excess from ${bin.binId} ↔ suspense in ${match.binId}`, result: "ok" });
        }
        if (left > 0) {
          s.push({ id: nextId(), binId: bin.binId, binType: bin.binType, sku: bin.sku, lot: bin.lot, mfd: bin.mfd, expiry: bin.expiry, mrp: bin.mrp, packSize: bin.packSize, excessQty: left, suspenseQty: 0, status: "open", source: "CC-2024-002" });
          steps.push({ type: "suspense", qty: left, message: `${left} excess units added to suspense for ${bin.binId}`, result: "warn" });
        }
      }
    } else {
      // Case 2: Shortage
      steps.push({ type: "info", message: `${bin.binId} · ${bin.sku}: Short = ${shortage} (system ${bin.systemQty}, physical ${bin.physicalQty})`, result: "info" });

      if (bin.binType === "Bulk Line") {
        const nonAdj = shortage % bin.packSize;
        const adj = shortage - nonAdj;
        const snapshotS = s.map((e) => ({ ...e }));

        const bulkExcess = s.filter(
          (e) =>
            e.sku === bin.sku && e.lot === bin.lot && e.mfd === bin.mfd &&
            e.expiry === bin.expiry && e.mrp === bin.mrp &&
            e.excessQty > 0 && e.status === "open" && e.binType === "Bulk Line",
        );
        let adjLeft = adj;
        for (const match of bulkExcess) {
          if (adjLeft <= 0) break;
          const r = Math.min(adjLeft, match.excessQty);
          s = s.map((e) =>
            e.id === match.id
              ? { ...e, excessQty: e.excessQty - r, status: e.excessQty - r === 0 ? ("reconciled" as const) : ("open" as const) }
              : e,
          );
          adjLeft -= r;
          steps.push({ type: "reconcile", qty: r, message: `Reconciled shortage ${r} from ${bin.binId} ↔ excess in ${match.binId}`, result: "ok" });
        }

        if (nonAdj > 0) {
          // All-or-nothing: rollback entire adjustment for bulk shortage with remainder
          s = snapshotS;
          steps.push({ type: "pna", message: `${bin.binId}: Shortage ${shortage} % pack-size ${bin.packSize} = ${nonAdj} non-adjustable — entire adjustment rolled back (all-or-nothing rule), marked PNA`, result: "risk" });
        } else if (adjLeft > 0) {
          s.push({ id: nextId(), binId: bin.binId, binType: bin.binType, sku: bin.sku, lot: bin.lot, mfd: bin.mfd, expiry: bin.expiry, mrp: bin.mrp, packSize: bin.packSize, excessQty: 0, suspenseQty: adjLeft, status: "open", source: "CC-2024-002" });
          steps.push({ type: "suspense", qty: adjLeft, message: `${adjLeft} units added to suspense as shortage for ${bin.binId}`, result: "warn" });
        }
      } else {
        // Pick Line: no pack size constraint
        const anyExcess = s.filter(
          (e) =>
            e.sku === bin.sku && e.lot === bin.lot && e.mfd === bin.mfd &&
            e.expiry === bin.expiry && e.mrp === bin.mrp &&
            e.excessQty > 0 && e.status === "open",
        );
        let left = shortage;
        for (const match of anyExcess) {
          if (left <= 0) break;
          const r = Math.min(left, match.excessQty);
          s = s.map((e) =>
            e.id === match.id
              ? { ...e, excessQty: e.excessQty - r, status: e.excessQty - r === 0 ? ("reconciled" as const) : ("open" as const) }
              : e,
          );
          left -= r;
          steps.push({ type: "reconcile", qty: r, message: `Shortage ${r} from ${bin.binId} reconciled ↔ excess in ${match.binId}`, result: "ok" });
        }
        if (left > 0) {
          s.push({ id: nextId(), binId: bin.binId, binType: bin.binType, sku: bin.sku, lot: bin.lot, mfd: bin.mfd, expiry: bin.expiry, mrp: bin.mrp, packSize: bin.packSize, excessQty: 0, suspenseQty: left, status: "open", source: "CC-2024-002" });
          steps.push({ type: "suspense", qty: left, message: `${left} units added to suspense as shortage for ${bin.binId}`, result: "warn" });
        }
      }
    }
  }

  // Final Step: Global Adjustment
  steps.push({ type: "global", message: "── Global Adjustment: cross-bin excess ↔ suspense sweep ──", result: "info" });
  const skus = [...new Set(s.filter((e) => e.status === "open").map((e) => e.sku))];
  let anyGlobal = false;

  for (const sku of skus) {
    const open = s.filter((e) => e.sku === sku && e.status === "open");
    const totalExcess = open.reduce((sum, e) => sum + e.excessQty, 0);
    const totalSuspense = open.reduce((sum, e) => sum + e.suspenseQty, 0);

    if (totalExcess > 0 && totalSuspense > 0) {
      const adjustQty = Math.min(totalExcess, totalSuspense);
      const outcome =
        adjustQty === totalExcess && adjustQty === totalSuspense
          ? "fully resolved"
          : adjustQty === totalExcess
            ? "excess fully resolved, suspense partially reduced"
            : "suspense fully resolved, excess partially reduced";
      steps.push({ type: "global", qty: adjustQty, message: `${sku}: Global reconcile ${adjustQty} units (total excess ${totalExcess} ↔ total suspense ${totalSuspense}) — ${outcome}`, result: "ok" });
      anyGlobal = true;

      // Reduce excess (bulk-first priority)
      let toReduce = adjustQty;
      const excessBins = open.filter((e) => e.excessQty > 0).sort((a, b) => {
        if (a.binType === "Bulk Line" && b.binType !== "Bulk Line") return -1;
        if (a.binType !== "Bulk Line" && b.binType === "Bulk Line") return 1;
        return 0;
      });
      for (const e of excessBins) {
        if (toReduce <= 0) break;
        const r = Math.min(toReduce, e.excessQty);
        s = s.map((entry) =>
          entry.id === e.id
            ? { ...entry, excessQty: entry.excessQty - r, status: entry.excessQty - r === 0 ? ("reconciled" as const) : ("open" as const) }
            : entry,
        );
        toReduce -= r;
      }

      // Reduce suspense
      let susReduce = adjustQty;
      const suspenseBins = open.filter((e) => e.suspenseQty > 0);
      for (const e of suspenseBins) {
        if (susReduce <= 0) break;
        const r = Math.min(susReduce, e.suspenseQty);
        s = s.map((entry) =>
          entry.id === e.id
            ? { ...entry, suspenseQty: entry.suspenseQty - r, status: entry.suspenseQty - r === 0 ? ("reconciled" as const) : ("open" as const) }
            : entry,
        );
        susReduce -= r;
      }
    }
  }

  if (!anyGlobal) {
    steps.push({ type: "global", message: "No global cross-bin offsets found — ledger is clean", result: "ok" });
  }

  return { updatedSuspense: s, steps };
}

// ─── Shared tag components ────────────────────────────────────────────────────

export function KindTag({ kind }: { kind: TaskKind }) {
  const styles: Record<TaskKind, string> = {
    ABC: "border-sys/30 bg-sys-bg text-sys",
    "Ad-hoc": "border-border text-muted-foreground",
    Snap: "border-warn/30 bg-warn-bg text-warn",
    SOS: "border-risk/30 bg-risk-bg text-risk",
  };
  return (
    <span className={cn("rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase", styles[kind])}>
      {kind}
    </span>
  );
}

export function StatusTag({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "border-border text-muted-foreground" },
    "in-progress": { label: "In Progress", cls: "border-sys/30 bg-sys-bg text-sys" },
    review: { label: "Review", cls: "border-warn/30 bg-warn-bg text-warn" },
    completed: { label: "Completed", cls: "border-ok/30 bg-ok-bg text-ok" },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn("rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase", cls)}>
      {label}
    </span>
  );
}

export function BinTypeTag({ type }: { type: BinType }) {
  return (
    <span className={cn(
      "rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase",
      type === "Bulk Line" ? "border-ai/30 bg-ai-bg text-ai" : "border-border text-muted-foreground",
    )}>
      {type === "Bulk Line" ? "Bulk" : "Pick"}
    </span>
  );
}

export function MetricTile({ label, value, sub, variant = "default" }: {
  label: string;
  value: string | number;
  sub: string;
  variant?: "default" | "ok" | "warn" | "risk";
}) {
  return (
    <div className={cn(
      "rounded-md border border-border bg-card px-4 py-3",
      variant === "ok" && "border-ok/30 bg-ok-bg",
      variant === "warn" && "border-warn/30 bg-warn-bg",
      variant === "risk" && "border-risk/30 bg-risk-bg",
    )}>
      <div className={cn(
        "font-mono text-[10.5px] uppercase tracking-[0.06em]",
        variant === "default" && "text-muted-foreground",
        variant === "ok" && "text-ok/70",
        variant === "warn" && "text-warn/70",
        variant === "risk" && "text-risk/70",
      )}>{label}</div>
      <div className={cn(
        "mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em]",
        variant === "ok" && "text-ok",
        variant === "warn" && "text-warn",
        variant === "risk" && "text-risk",
      )}>{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
