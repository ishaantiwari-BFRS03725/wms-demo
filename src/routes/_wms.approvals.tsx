import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  Filter,
  Gauge,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/approvals")({
  head: () => ({
    meta: [{ title: "Approvals — Inventory" }],
  }),
  component: Approvals,
});

type Status = "Pending" | "Approved" | "Declined";

interface PropChange {
  property: string;
  current: string;
  updated: string;
}

interface ApprovalRequest {
  id: string;
  sku: string;
  skuDesc: string;
  qty: string;
  binNo: string;
  itemNo: string;
  createdBy: string;
  createdAt: string;
  approvedBy: string;
  updatedAt: string;
  status: Status;
  changes: PropChange[];
}

// Approval sub-types — the screen can host many; this one is item-info editing.
const APPROVAL_TYPES = [
  { value: "item-info", label: "Item Info Editing Approval" },
  { value: "batch-cancel", label: "Batch Cancellation Approval" },
  { value: "stock-adjust", label: "Stock Adjustment Approval" },
];

const REQUESTS: ApprovalRequest[] = [
  {
    id: "00304",
    sku: "8904037207871",
    skuDesc: "boAt Airdopes 141 TWS Earbuds",
    qty: "100",
    binNo: "BIN-A12-402",
    itemNo: "SKU-99201-WH",
    createdBy: "Priyanka Gupta",
    createdAt: "2026-05-13 13:09:51",
    approvedBy: "WH Manager",
    updatedAt: "2026-05-13 13:10:03",
    status: "Approved",
    changes: [
      { property: "MRP", current: "143", updated: "143" },
      { property: "Lot No", current: "BAT-B-02", updated: "BAT-A-028-11-28" },
      { property: "MFG Date", current: "2024-06-01", updated: "2024-06-01" },
      { property: "Expiry Date", current: "2024-06-01", updated: "2026-07-08" },
    ],
  },
  {
    id: "00311",
    sku: "8904037212288",
    skuDesc: "boAt Rockerz 255 Neckband",
    qty: "48",
    binNo: "BIN-A12-402",
    itemNo: "SKU-44023-BL",
    createdBy: "Prashant Chaturvedi",
    createdAt: "2026-04-21 14:35:04",
    approvedBy: "---",
    updatedAt: "---",
    status: "Pending",
    changes: [
      { property: "MRP", current: "480", updated: "520" },
      { property: "Lot No", current: "B-2023-Y02", updated: "B-2023-Y02" },
      { property: "MFG Date", current: "2023-11-10", updated: "2023-11-10" },
      { property: "Expiry Date", current: "—", updated: "2026-11-09" },
    ],
  },
  {
    id: "00318",
    sku: "8904037209998",
    skuDesc: "boAt Stone 350 Bluetooth Speaker",
    qty: "1020",
    binNo: "BIN-A12-402",
    itemNo: "SKU-77312-RD",
    createdBy: "Prashant Chaturvedi",
    createdAt: "2026-04-17 10:59:35",
    approvedBy: "---",
    updatedAt: "---",
    status: "Pending",
    changes: [
      { property: "MRP", current: "599", updated: "649" },
      { property: "Lot No", current: "B-2024-P99", updated: "B-2024-P99" },
      { property: "MFG Date", current: "2025-02-20", updated: "2025-02-20" },
      { property: "Expiry Date", current: "2027-12-08", updated: "2028-01-15" },
    ],
  },
  {
    id: "00320",
    sku: "8904037201145",
    skuDesc: "boAt Wave Call Smartwatch",
    qty: "64",
    binNo: "BIN-A12-402",
    itemNo: "SKU-50118-GR",
    createdBy: "Prashant Chaturvedi",
    createdAt: "2026-04-17 10:58:21",
    approvedBy: "---",
    updatedAt: "---",
    status: "Pending",
    changes: [
      { property: "MRP", current: "1799", updated: "1799" },
      { property: "Lot No", current: "B-2024-K11", updated: "B-2024-K11-A" },
      { property: "MFG Date", current: "2025-03-15", updated: "2025-03-15" },
      { property: "Expiry Date", current: "2028-06-30", updated: "2028-06-30" },
    ],
  },
  {
    id: "00299",
    sku: "8904037206642",
    skuDesc: "boAt Bassheads 100 Wired Earphones",
    qty: "200",
    binNo: "BIN-C04-118",
    itemNo: "SKU-60221-BK",
    createdBy: "Priyanka Gupta",
    createdAt: "2026-04-15 10:41:58",
    approvedBy: "WH Manager",
    updatedAt: "2026-04-15 10:42:14",
    status: "Declined",
    changes: [
      { property: "MRP", current: "399", updated: "349" },
      { property: "Lot No", current: "B-2022-H07", updated: "B-2022-H07" },
      { property: "MFG Date", current: "2022-08-01", updated: "2022-08-01" },
      { property: "Expiry Date", current: "2025-07-31", updated: "2027-07-31" },
    ],
  },
];

const STAT_TABS = ["All Requests", "Pending", "Completed"] as const;
type StatTab = (typeof STAT_TABS)[number];

function Approvals() {
  const [type, setType] = useState("item-info");
  const [tab, setTab] = useState<StatTab>("All Requests");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  // Local status overrides as the manager approves / declines in-session.
  const [decisions, setDecisions] = useState<Record<string, Status>>({});

  const rows = useMemo(() => {
    return REQUESTS.map((r) => ({
      ...r,
      status: decisions[r.id] ?? r.status,
    })).filter((r) => {
      const matchTab =
        tab === "All Requests"
          ? true
          : tab === "Pending"
            ? r.status === "Pending"
            : r.status !== "Pending";
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        r.id.includes(q) ||
        r.binNo.toLowerCase().includes(q) ||
        r.itemNo.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.createdBy.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [tab, search, decisions]);

  const liveStatus = (r: ApprovalRequest): Status => decisions[r.id] ?? r.status;
  const pendingCount = REQUESTS.filter((r) => liveStatus(r) === "Pending").length;
  const declinedCount = REQUESTS.filter((r) => liveStatus(r) === "Declined").length;

  const openReq = openId ? REQUESTS.find((r) => r.id === openId) ?? null : null;

  const decide = (id: string, status: Status) => {
    setDecisions((d) => ({ ...d, [id]: status }));
    setOpenId(null);
    toast.success(
      status === "Approved"
        ? "Update approved — inventory updated"
        : "Request declined",
    );
  };

  return (
    <div className="bg-muted/40 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {/* Header */}
        <div>
          <div className="text-xs text-muted-foreground">
            Inventory <span className="px-1">›</span> Approvals
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Approval Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and process inventory update requests from the warehouse floor.
          </p>
        </div>

        {/* Approval sub-type selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Approval Type
          </span>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPROVAL_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type !== "item-info" ? (
          <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">
              {APPROVAL_TYPES.find((t) => t.value === type)?.label}
            </div>
            <p className="max-w-sm text-xs text-muted-foreground">
              This approval type isn’t part of the current demo. Switch to “Item
              Info Editing Approval” to review live requests.
            </p>
          </Card>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={ClipboardList}
                label="Pending Approvals"
                value={String(pendingCount)}
                meta="Awaiting review"
              />
              <StatCard
                icon={CheckCircle2}
                label="Processed Today"
                value="2,840"
                meta="+12% vs yesterday"
                tone="green"
              />
              <StatCard
                icon={XCircle}
                label="Declined Requests"
                value={String(declinedCount)}
                meta="-2% vs yesterday"
                tone="red"
              />
              <StatCard
                icon={Gauge}
                label="Approval Velocity"
                value="Fast"
                meta="Avg. 1.2h"
              />
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search request, bin, or item…"
                className="h-10 pl-9"
              />
            </div>

            {/* Table card */}
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
                <div className="inline-flex gap-1 border-b border-border">
                  {STAT_TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        "border-b-2 px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.06em] transition-colors -mb-px",
                        tab === t
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-xs">S No</TableHead>
                    <TableHead className="w-24 text-xs">Request ID</TableHead>
                    <TableHead className="w-16 text-xs">Action</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Bin No</TableHead>
                    <TableHead className="text-xs">Item No</TableHead>
                    <TableHead className="text-xs">Created By</TableHead>
                    <TableHead className="text-xs">Created At</TableHead>
                    <TableHead className="text-xs">Approved By</TableHead>
                    <TableHead className="text-xs">Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        REQ-{r.id}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setOpenId(r.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-muted"
                          aria-label="View request"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.binNo}</TableCell>
                      <TableCell className="font-mono text-xs">{r.itemNo}</TableCell>
                      <TableCell className="text-sm">{r.createdBy}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.createdAt}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.approvedBy}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.updatedAt}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No requests match this view.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>

              <div className="border-t border-border p-3 text-xs text-muted-foreground">
                Showing {rows.length} of {REQUESTS.length} entries
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Approval Detail dialog */}
      <ApprovalDetail
        request={openReq}
        status={openReq ? liveStatus(openReq) : "Pending"}
        onClose={() => setOpenId(null)}
        onDecide={decide}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  meta: string;
  tone?: "default" | "green" | "red";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            tone === "green" && "bg-status-dispatched/15 text-status-dispatched",
            tone === "red" && "bg-destructive/10 text-destructive",
            tone === "default" && "bg-muted text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] text-muted-foreground">{meta}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "Approved")
    return (
      <Badge className="border-transparent bg-status-dispatched/15 text-status-dispatched hover:bg-status-dispatched/15">
        Approved
      </Badge>
    );
  if (status === "Declined")
    return (
      <Badge className="border-transparent bg-destructive/10 text-destructive hover:bg-destructive/10">
        Declined
      </Badge>
    );
  return (
    <Badge variant="secondary" className="font-medium">
      Pending
    </Badge>
  );
}

function ApprovalDetail({
  request,
  status,
  onClose,
  onDecide,
}: {
  request: ApprovalRequest | null;
  status: Status;
  onClose: () => void;
  onDecide: (id: string, status: Status) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const decided = status !== "Pending";

  const submit = (decision: Status) => {
    if (!request) return;
    if (!remarks.trim()) {
      toast.error("Approver remarks are required");
      return;
    }
    onDecide(request.id, decision);
    setRemarks("");
  };

  return (
    <Dialog
      open={!!request}
      onOpenChange={(o) => {
        if (!o) {
          setRemarks("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approval Detail</DialogTitle>
        </DialogHeader>

        {request ? (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryCard label="Batch Update Request" value={request.id} accent />
              <SummaryCard label="SKU" value={request.sku} />
              <SummaryCard label="SKU Description" value={request.skuDesc} />
              <SummaryCard label="Quantity" value={request.qty} />
            </div>

            {/* Comparison table */}
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold font-mono uppercase tracking-[0.06em]">
                      Data Property
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold font-mono uppercase tracking-[0.06em]">
                      Current Value
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold font-mono uppercase tracking-[0.06em]">
                      Updated Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {request.changes.map((c, i) => {
                    const changed = c.current !== c.updated;
                    return (
                      <tr
                        key={i}
                        className={cn(
                          "border-t border-border",
                          changed && "bg-status-dispatched/5",
                        )}
                      >
                        <td
                          className={cn(
                            "px-4 py-3 font-medium",
                            changed && "text-status-dispatched",
                          )}
                        >
                          {c.property}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {c.current}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 font-mono",
                            changed && "font-semibold text-status-dispatched",
                          )}
                        >
                          {changed ? (
                            <span className="inline-flex items-center gap-1.5">
                              <ArrowRight className="h-3.5 w-3.5" />
                              {c.updated}
                            </span>
                          ) : (
                            c.updated
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Remarks */}
            {decided ? (
              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
                <span className="font-medium">This request has been </span>
                <span
                  className={cn(
                    "font-semibold",
                    status === "Approved"
                      ? "text-status-dispatched"
                      : "text-destructive",
                  )}
                >
                  {status.toLowerCase()}
                </span>
                .
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Approver Remarks <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter comments for this approval / rejection decision…"
                  className="min-h-[88px] resize-none"
                />
              </div>
            )}

            {/* Footer */}
            {!decided ? (
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Changes will take effect immediately upon approval.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => submit("Declined")}>
                    Decline
                  </Button>
                  <Button onClick={() => submit("Approved")}>Approve Update</Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-sm font-semibold leading-tight",
          accent && "font-mono text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}
