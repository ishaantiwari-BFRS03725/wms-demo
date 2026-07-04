import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ArrowRight,
  RefreshCw,
  Smartphone,
  TriangleAlert,
  Boxes,
  ArrowDownUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_wms/cycle-count")({
  head: () => ({ meta: [{ title: "Cycle Count — Inventory" }] }),
  component: CycleCount,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type BinType = "Bulk Line" | "Pick Line";
type TaskStatus = "pending" | "in-progress" | "review" | "completed";
type TaskKind = "ABC" | "Ad-hoc" | "Snap" | "SOS";
type SuspenseStatus = "open" | "reconciled" | "pna";

interface Task {
  id: string;
  kind: TaskKind;
  zone: string;
  totalBins: number;
  assignedTo: string;
  sla: string;
  status: TaskStatus;
}

interface BinCount {
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

interface SuspenseEntry {
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
}

interface ReconciliationStep {
  type: "reconcile" | "suspense" | "pna" | "cleanup" | "global" | "info";
  message: string;
  qty?: number;
  result: "ok" | "warn" | "risk" | "info";
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  { id: "CC-2024-001", kind: "ABC", zone: "Zone A", totalBins: 6, assignedTo: "Ravi Kumar", sla: "14:30", status: "in-progress" },
  { id: "CC-2024-002", kind: "SOS", zone: "Zone B", totalBins: 5, assignedTo: "Anita Desai", sla: "13:00", status: "review" },
  { id: "CC-2024-003", kind: "Ad-hoc", zone: "Zone C", totalBins: 3, assignedTo: "Mohit Sharma", sla: "16:00", status: "pending" },
  { id: "CC-2024-004", kind: "Snap", zone: "Zone A", totalBins: 8, assignedTo: "Priya Nair", sla: "10:00", status: "completed" },
];

const INITIAL_COUNTS: Record<string, BinCount[]> = {
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

// Pre-existing suspense entries from prior counts
const INITIAL_SUSPENSE: SuspenseEntry[] = [
  // 6 units missing from bin X-01 (SKU-179) — will match G-01 excess
  { id: "SUS-001", binId: "X-01", binType: "Bulk Line", sku: "SKU-179", lot: "LOT-A24", mfd: "2024-06-01", expiry: "2027-06-01", mrp: 1299, packSize: 6, excessQty: 0, suspenseQty: 6, status: "open", source: "CC-2024-000" },
  // 6 extra found in bin Y-01 (SKU-822) — will match H-01 shortage
  { id: "SUS-002", binId: "Y-01", binType: "Bulk Line", sku: "SKU-822", lot: "LOT-B24", mfd: "2024-04-15", expiry: "2027-04-15", mrp: 1499, packSize: 6, excessQty: 6, suspenseQty: 0, status: "open", source: "CC-2024-000" },
  // 12 units missing from bin Z-01 (SKU-868) — global adjustment resolves 7 after I-01
  { id: "SUS-003", binId: "Z-01", binType: "Bulk Line", sku: "SKU-868", lot: "LOT-C24", mfd: "2024-05-01", expiry: "2027-05-01", mrp: 499, packSize: 12, excessQty: 0, suspenseQty: 12, status: "open", source: "CC-2024-000" },
];

// Valid inventory combinations (lot + MFD + expiry + MRP must all match)
const KNOWN_COMBOS = new Set([
  "SKU-179|LOT-A24|2024-06-01|2027-06-01|1299",
  "SKU-822|LOT-B24|2024-04-15|2027-04-15|1499",
  "SKU-868|LOT-C24|2024-05-01|2027-05-01|499",
  "SKU-900|LOT-D24|2024-03-10|2027-03-10|2499",
  "SKU-002|LOT-E24|2024-02-01|2026-02-01|299",
]);

// ─── Reconciliation Logic ─────────────────────────────────────────────────────

function runReconciliation(
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

// ─── Main Component ───────────────────────────────────────────────────────────

function CycleCount() {
  const [mode, setMode] = useState<"supervisor" | "operator">("supervisor");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [suspense, setSuspense] = useState<SuspenseEntry[]>(INITIAL_SUSPENSE);
  const [counts, setCounts] = useState<Record<string, BinCount[]>>(INITIAL_COUNTS);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [steps, setSteps] = useState<ReconciliationStep[]>([]);
  const [didReconcile, setDidReconcile] = useState<Set<string>>(new Set());

  // Operator state
  const [operatorTaskId, setOperatorTaskId] = useState<string | null>(null);
  const [binIdx, setBinIdx] = useState(0);
  const [physInput, setPhysInput] = useState("");
  const [binResult, setBinResult] = useState<{ excess: number; shortage: number } | null>(null);

  const openSuspense = suspense.filter((e) => e.status === "open").length;
  const awaitingReview = tasks.filter((t) => t.status === "review").length;

  function handleSelectTask(id: string) {
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    } else {
      setSelectedTaskId(id);
      setSteps([]);
    }
  }

  function handleRunReconciliation() {
    if (!selectedTaskId) return;
    const taskCounts = counts[selectedTaskId] ?? [];
    const { updatedSuspense, steps: newSteps } = runReconciliation(taskCounts, suspense);
    setSuspense(updatedSuspense);
    setSteps(newSteps);
    setDidReconcile((prev) => new Set([...prev, selectedTaskId]));
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTaskId ? { ...t, status: "completed" as const } : t)),
    );
    const resolved = newSteps.filter((s) => s.type === "reconcile").length;
    const pna = newSteps.filter((s) => s.type === "pna").length;
    toast.success(`Reconciliation complete — ${resolved} resolved, ${pna} PNA`);
  }

  function handleOperatorSubmitBin() {
    if (!operatorTaskId) return;
    const taskCounts = counts[operatorTaskId] ?? [];
    const bin = taskCounts[binIdx];
    if (!bin) return;

    const phys = parseInt(physInput, 10);
    if (Number.isNaN(phys) || phys < 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const excess = Math.max(0, phys - bin.systemQty);
    const shortage = Math.max(0, bin.systemQty - phys);

    setCounts((prev) => ({
      ...prev,
      [operatorTaskId]: prev[operatorTaskId].map((c, i) =>
        i === binIdx ? { ...c, physicalQty: phys } : c,
      ),
    }));

    setBinResult({ excess, shortage });
  }

  function handleNextBin() {
    if (!operatorTaskId) return;
    const taskCounts = counts[operatorTaskId] ?? [];
    setBinResult(null);
    setPhysInput("");

    if (binIdx + 1 < taskCounts.length) {
      setBinIdx((i) => i + 1);
    } else {
      // All bins counted
      setTasks((prev) =>
        prev.map((t) => (t.id === operatorTaskId ? { ...t, status: "review" as const } : t)),
      );
      toast.success("All bins counted — task sent for supervisor review");
      setOperatorTaskId(null);
      setBinIdx(0);
    }
  }

  return (
    <div>
      <PageHeader
        title="Cycle Count"
        subtitle={`INVENTORY · ${tasks.filter((t) => t.status === "in-progress").length} ACTIVE · ${awaitingReview} AWAITING REVIEW · ${openSuspense} SUSPENSE OPEN`}
        actions={
          <div className="flex items-center gap-1 rounded-[4px] border border-border bg-card p-0.5">
            <ModeButton active={mode === "supervisor"} onClick={() => setMode("supervisor")} icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Supervisor" />
            <ModeButton active={mode === "operator"} onClick={() => setMode("operator")} icon={<Smartphone className="h-3.5 w-3.5" />} label="Operator HHT" />
          </div>
        }
      />

      <div className="p-7">
        {mode === "supervisor" ? (
          <SupervisorView
            tasks={tasks}
            counts={counts}
            suspense={suspense}
            selectedTaskId={selectedTaskId}
            steps={steps}
            didReconcile={didReconcile}
            onSelectTask={handleSelectTask}
            onRunReconciliation={handleRunReconciliation}
          />
        ) : (
          <OperatorView
            tasks={tasks}
            counts={counts}
            operatorTaskId={operatorTaskId}
            binIdx={binIdx}
            physInput={physInput}
            binResult={binResult}
            onSelectTask={(id) => { setOperatorTaskId(id); setBinIdx(0); setPhysInput(""); setBinResult(null); }}
            onInputChange={setPhysInput}
            onSubmitBin={handleOperatorSubmitBin}
            onNextBin={handleNextBin}
            onCancel={() => { setOperatorTaskId(null); setBinIdx(0); setPhysInput(""); setBinResult(null); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Supervisor View ──────────────────────────────────────────────────────────

function SupervisorView({
  tasks, counts, suspense, selectedTaskId, steps, didReconcile, onSelectTask, onRunReconciliation,
}: {
  tasks: Task[];
  counts: Record<string, BinCount[]>;
  suspense: SuspenseEntry[];
  selectedTaskId: string | null;
  steps: ReconciliationStep[];
  didReconcile: Set<string>;
  onSelectTask: (id: string) => void;
  onRunReconciliation: () => void;
}) {
  const openSuspense = suspense.filter((e) => e.status === "open");
  const allDiscrepancies = Object.values(counts)
    .flat()
    .filter((b) => b.physicalQty !== null && b.physicalQty !== b.systemQty).length;

  return (
    <>
      {/* Metric tiles */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <MetricTile label="Active Tasks" value={tasks.filter((t) => t.status === "in-progress").length} sub="In progress" />
        <MetricTile label="Awaiting Review" value={tasks.filter((t) => t.status === "review").length} sub="Supervisor approval" variant="warn" />
        <MetricTile label="Open Discrepancies" value={allDiscrepancies} sub="Across all tasks" variant={allDiscrepancies > 0 ? "risk" : "ok"} />
        <MetricTile label="Suspense Entries" value={openSuspense.length} sub="Pending resolution" variant={openSuspense.length > 0 ? "warn" : "ok"} />
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6">
        <div className="flex flex-col gap-5">
          {/* Task list */}
          <div className="rounded-md border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Count Tasks</span>
              <Button size="sm" variant="outline" className="h-7 text-[11px]">Schedule New</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Task ID", "Kind", "Zone", "Progress", "Assigned", "SLA", "Status", ""].map((h) => (
                    <TableHead key={h} className="font-mono text-[10px] uppercase tracking-[0.06em]">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const taskCounts = counts[task.id] ?? [];
                  const counted = taskCounts.filter((b) => b.physicalQty !== null).length;
                  const isSelected = selectedTaskId === task.id;
                  return (
                    <TableRow
                      key={task.id}
                      className={cn("cursor-pointer transition-colors", isSelected && "bg-muted/50")}
                      onClick={() => onSelectTask(task.id)}
                    >
                      <TableCell className="font-mono text-[12px] font-semibold">{task.id}</TableCell>
                      <TableCell><KindTag kind={task.kind} /></TableCell>
                      <TableCell className="text-[12px]">{task.zone}</TableCell>
                      <TableCell className="font-mono text-[12px]">{counted}/{task.totalBins} bins</TableCell>
                      <TableCell className="text-[12px]">{task.assignedTo}</TableCell>
                      <TableCell className="font-mono text-[12px]">{task.sla}</TableCell>
                      <TableCell><StatusTag status={task.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isSelected && "rotate-90")} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Task detail */}
          {selectedTaskId && (
            <TaskDetail
              task={tasks.find((t) => t.id === selectedTaskId)!}
              counts={counts[selectedTaskId] ?? []}
              didReconcile={didReconcile.has(selectedTaskId)}
              steps={steps}
              onRunReconciliation={onRunReconciliation}
            />
          )}
        </div>

        {/* Suspense ledger */}
        <SuspenseLedger entries={suspense} />
      </div>
    </>
  );
}

// ─── Task Detail ──────────────────────────────────────────────────────────────

function TaskDetail({
  task, counts, didReconcile, steps, onRunReconciliation,
}: {
  task: Task;
  counts: BinCount[];
  didReconcile: boolean;
  steps: ReconciliationStep[];
  onRunReconciliation: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Task Detail — {task.id}
            </span>
            <span className="ml-3 text-[11px] text-muted-foreground">{task.zone} · {task.assignedTo}</span>
          </div>
          {task.status === "review" && !didReconcile && (
            <Button size="sm" className="h-7 gap-1.5 text-[11px]" onClick={onRunReconciliation}>
              <RefreshCw className="h-3 w-3" />
              Run Reconciliation
            </Button>
          )}
          {(didReconcile || task.status === "completed") && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ok">
              <CheckCircle2 className="h-3.5 w-3.5" />
              RECONCILED
            </span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Bin", "Type", "SKU", "Lot", "Pack", "System", "Physical", "Delta", "Status"].map((h) => (
                <TableHead key={h} className="font-mono text-[10px] uppercase tracking-[0.06em]">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {counts.map((bin) => {
              const delta = bin.physicalQty !== null ? bin.physicalQty - bin.systemQty : null;
              const isPna = bin.lot === "LOT-X99";
              return (
                <TableRow key={bin.binId} className={cn(isPna && "bg-risk-bg/30")}>
                  <TableCell className="font-mono text-[12px] font-semibold">{bin.binId}</TableCell>
                  <TableCell>
                    <BinTypeTag type={bin.binType} />
                  </TableCell>
                  <TableCell className="font-mono text-[11px]">{bin.sku}</TableCell>
                  <TableCell className="font-mono text-[11px]">{bin.lot}</TableCell>
                  <TableCell className="text-right font-mono text-[12px]">{bin.packSize}</TableCell>
                  <TableCell className="text-right font-mono text-[12px]">{bin.systemQty}</TableCell>
                  <TableCell className="text-right font-mono text-[12px]">
                    {bin.physicalQty !== null ? bin.physicalQty : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px]">
                    {delta !== null ? (
                      <span className={cn(delta > 0 ? "text-ok" : delta < 0 ? "text-risk" : "text-muted-foreground")}>
                        {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {bin.physicalQty === null ? (
                      <span className="inline-flex items-center gap-1 rounded-[3px] border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">Pending</span>
                    ) : isPna ? (
                      <span className="inline-flex items-center gap-1 rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-risk">PNA</span>
                    ) : delta === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-ok">OK</span>
                    ) : delta! > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-[3px] border border-warn/40 bg-warn-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-warn">Excess</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-risk">Short</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Reconciliation log */}
      {steps.length > 0 && (
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Reconciliation Log</span>
          </div>
          <div className="divide-y divide-border">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2.5 px-4 py-2.5",
                  step.type === "global" && step.result === "info" && "bg-muted/40",
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {step.result === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-ok" />}
                  {step.result === "warn" && <TriangleAlert className="h-3.5 w-3.5 text-warn" />}
                  {step.result === "risk" && <AlertCircle className="h-3.5 w-3.5 text-risk" />}
                  {step.result === "info" && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <span className={cn(
                  "text-[12px] leading-relaxed",
                  step.result === "ok" && "text-foreground",
                  step.result === "warn" && "text-warn",
                  step.result === "risk" && "text-risk",
                  step.result === "info" && "text-muted-foreground",
                  (step.type === "global" || step.type === "info") && step.result === "info" && "font-mono text-[11px]",
                )}>
                  {step.message}
                </span>
                {step.qty !== undefined && step.type === "reconcile" && (
                  <span className="ml-auto shrink-0 rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] text-ok">
                    QTY {step.qty}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Suspense Ledger ──────────────────────────────────────────────────────────

function SuspenseLedger({ entries }: { entries: SuspenseEntry[] }) {
  const open = entries.filter((e) => e.status === "open");
  const reconciled = entries.filter((e) => e.status === "reconciled");

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Suspense Ledger</span>
        <span className={cn("font-mono text-[11px]", open.length > 0 ? "text-warn" : "text-ok")}>
          {open.length} OPEN
        </span>
      </div>

      <div className="divide-y divide-border">
        {entries.length === 0 && (
          <div className="px-4 py-6 text-center font-mono text-[11px] uppercase text-muted-foreground">Ledger clear</div>
        )}
        {entries.map((e) => (
          <div
            key={e.id}
            className={cn(
              "px-4 py-3 text-[11px]",
              e.status === "reconciled" && "opacity-40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground">{e.id}</span>
              {e.status === "open" ? (
                e.excessQty > 0 ? (
                  <span className="rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-ok">Excess {e.excessQty}</span>
                ) : (
                  <span className="rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-risk">Short {e.suspenseQty}</span>
                )
              ) : (
                <span className="rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-ok">Reconciled</span>
              )}
            </div>
            <div className="mt-1 text-muted-foreground">
              <span className="font-mono">{e.binId}</span> · {e.sku} · {e.binType}
            </div>
            <div className="mt-0.5 font-mono text-muted-foreground/70">
              Lot {e.lot} · MRP ₹{e.mrp} · Pack {e.packSize}
            </div>
            <div className="mt-0.5 font-mono text-muted-foreground/60 text-[10px]">Source: {e.source}</div>
          </div>
        ))}
      </div>

      {reconciled.length > 0 && (
        <div className="border-t border-border px-4 py-2 font-mono text-[10px] text-muted-foreground">
          {reconciled.length} reconciled entry/entries hidden above
        </div>
      )}
    </div>
  );
}

// ─── Operator HHT View ────────────────────────────────────────────────────────

function OperatorView({
  tasks, counts, operatorTaskId, binIdx, physInput, binResult,
  onSelectTask, onInputChange, onSubmitBin, onNextBin, onCancel,
}: {
  tasks: Task[];
  counts: Record<string, BinCount[]>;
  operatorTaskId: string | null;
  binIdx: number;
  physInput: string;
  binResult: { excess: number; shortage: number } | null;
  onSelectTask: (id: string) => void;
  onInputChange: (v: string) => void;
  onSubmitBin: () => void;
  onNextBin: () => void;
  onCancel: () => void;
}) {
  const eligibleTasks = tasks.filter((t) => t.status === "pending" || t.status === "in-progress");

  if (!operatorTaskId) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Available Tasks for Counting
            </span>
          </div>
          {eligibleTasks.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-[11px] uppercase text-muted-foreground">
              No pending tasks — all caught up
            </div>
          ) : (
            <div className="divide-y divide-border">
              {eligibleTasks.map((task) => {
                const taskCounts = counts[task.id] ?? [];
                const counted = taskCounts.filter((b) => b.physicalQty !== null).length;
                return (
                  <div key={task.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-semibold">{task.id}</span>
                        <KindTag kind={task.kind} />
                        <StatusTag status={task.status} />
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {task.zone} · {task.totalBins} bins · SLA {task.sla}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        Progress: {counted}/{task.totalBins} bins counted
                      </div>
                    </div>
                    <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => onSelectTask(task.id)}>
                      <Smartphone className="h-3.5 w-3.5" />
                      Start Count
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Explainer */}
        <div className="rounded-md border border-sys/20 bg-sys-bg px-4 py-3 text-[12px] text-sys">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-sys/70">Blind Count Mode</div>
          The operator does not see system quantities. Physical units are scanned and entered; the system reconciles discrepancies after submission.
        </div>
      </div>
    );
  }

  const taskCounts = counts[operatorTaskId] ?? [];
  const bin = taskCounts[binIdx];
  if (!bin) return null;

  const totalBins = taskCounts.length;
  const progress = Math.round((binIdx / totalBins) * 100);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm">
        {/* Device frame */}
        <div className="rounded-[16px] border-2 border-border bg-background shadow-xl">
          {/* Top bar */}
          <div className="flex items-center justify-between rounded-t-[14px] border-b border-border bg-muted/50 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">HHT · {operatorTaskId}</span>
            <button onClick={onCancel} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-4">
            {/* Progress */}
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>BIN {binIdx + 1} OF {totalBins}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-foreground transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Bin info */}
            <div className="mb-4 rounded-md border border-border bg-card p-3">
              <div className="mb-2 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-[15px] font-bold">{bin.binId}</span>
                <BinTypeTag type={bin.binType} />
              </div>
              <div className="rounded-[4px] bg-muted px-3 py-2">
                <div className="mb-1 font-mono text-[9px] uppercase text-muted-foreground">Item to Count</div>
                <div className="text-[13px] font-medium">{bin.skuName}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{bin.sku} · Lot {bin.lot}</div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">MFD {bin.mfd} · Exp {bin.expiry}</div>
              </div>
            </div>

            {binResult ? (
              /* Post-submit result */
              <div className={cn(
                "mb-4 rounded-md border p-3",
                binResult.excess === 0 && binResult.shortage === 0 && "border-ok/40 bg-ok-bg",
                binResult.excess > 0 && "border-warn/40 bg-warn-bg",
                binResult.shortage > 0 && "border-risk/40 bg-risk-bg",
              )}>
                {binResult.excess === 0 && binResult.shortage === 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-ok" />
                    <span className="font-mono text-[12px] text-ok">Count matches system — no discrepancy</span>
                  </div>
                )}
                {binResult.excess > 0 && (
                  <div>
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="h-4 w-4 text-warn" />
                      <span className="font-mono text-[12px] text-warn">Excess: {binResult.excess} units found</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Added to suspense — supervisor will reconcile</p>
                  </div>
                )}
                {binResult.shortage > 0 && (
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-risk" />
                      <span className="font-mono text-[12px] text-risk">Short: {binResult.shortage} units missing</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Added to suspense — supervisor will reconcile</p>
                  </div>
                )}
                <Button size="sm" className="mt-3 w-full h-8 text-[12px]" onClick={onNextBin}>
                  {binIdx + 1 < taskCounts.length ? "Next Bin →" : "Complete Count"}
                </Button>
              </div>
            ) : (
              /* Physical qty input */
              <div className="mb-4">
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                  Physical Count (units)
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Enter qty scanned"
                  value={physInput}
                  onChange={(e) => onInputChange(e.target.value)}
                  className="h-11 text-center text-[18px] font-mono font-bold"
                  onKeyDown={(e) => { if (e.key === "Enter") onSubmitBin(); }}
                />
                <Button className="mt-3 w-full h-9 text-[13px]" onClick={onSubmitBin} disabled={physInput === ""}>
                  Submit Bin Count
                </Button>
              </div>
            )}

            {/* Blind count reminder */}
            {!binResult && (
              <div className="rounded-[4px] bg-muted px-3 py-2 font-mono text-[10px] text-muted-foreground">
                Blind count: system quantity is hidden. Count physically and enter.
              </div>
            )}
          </div>
        </div>

        {/* Remaining bins list */}
        <div className="mt-4 rounded-md border border-border bg-card px-4 py-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Remaining Bins</div>
          <div className="flex flex-col gap-1">
            {taskCounts.map((b, i) => (
              <div key={b.binId} className={cn("flex items-center gap-2 text-[11px]", i === binIdx && "font-semibold", i < binIdx && "text-muted-foreground line-through")}>
                <div className={cn("h-1.5 w-1.5 rounded-full", i < binIdx ? "bg-ok" : i === binIdx ? "bg-foreground" : "bg-border")} />
                <span className="font-mono">{b.binId}</span>
                <span className="text-muted-foreground">{b.sku}</span>
                {b.physicalQty !== null && (
                  <span className={cn("ml-auto font-mono", b.physicalQty === b.systemQty ? "text-ok" : b.physicalQty > b.systemQty ? "text-warn" : "text-risk")}>
                    {b.physicalQty > b.systemQty ? `+${b.physicalQty - b.systemQty}` : b.physicalQty < b.systemQty ? `-${b.systemQty - b.physicalQty}` : "✓"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricTile({ label, value, sub, variant = "default" }: {
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

function KindTag({ kind }: { kind: TaskKind }) {
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

function StatusTag({ status }: { status: TaskStatus }) {
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

function BinTypeTag({ type }: { type: BinType }) {
  return (
    <span className={cn(
      "rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase",
      type === "Bulk Line" ? "border-ai/30 bg-ai-bg text-ai" : "border-border text-muted-foreground",
    )}>
      {type === "Bulk Line" ? "Bulk" : "Pick"}
    </span>
  );
}
