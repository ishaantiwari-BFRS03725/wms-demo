// ─── Shared data + timing engine for the WH Manager Agentic Dashboard ────────
// Pure, framework-agnostic: no React, no JSX. Extracted out of the dashboard
// route so the mock data and animation-timing engine live in one place.
// (Previously also shared with a second "Agent Ops Console" screen, which was
// removed — kept as a standalone module rather than folding back inline.)

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  LayoutGrid,
  PackageCheck,
  PackageOpen,
  PackageX,
  ShieldCheck,
  Timer,
  TrendingDown,
  Truck,
} from "lucide-react";

export type Severity = "yellow" | "red";
export type IssueStatus = "open" | "resolving" | "resolved";
export type CategoryStatus = "scanning" | "green" | "yellow" | "red";

export interface SubAgentDef {
  id: string;
  label: string;
  icon: LucideIcon;
  scanMs: number;
  hasIssue: boolean;
  severity?: Severity;
  issueTitle?: string;
  shortFinding?: string;
  actionLabel?: string;
  actionDoneLabel?: string;
}

export interface CategoryDef {
  id: string;
  title: string;
  icon: LucideIcon;
  caption: string;
  subAgents: SubAgentDef[];
  // Additional sub-agents that fired and came back clear, but aren't worth
  // rendering individually — summarized as "+N other agents" in the pill row.
  extraAgentCount: number;
}

// ─── Category + sub-agent definitions ─────────────────────────────────────────
// Only sub-agents with `hasIssue: true` ever render a card — everything else
// just shows as a quick "fired and came back clear" pill.

export const CATEGORIES: CategoryDef[] = [
  {
    id: "inbound",
    title: "Inbound",
    icon: ArrowDownToLine,
    caption: "ASN receipt, GRN match, putaway, and dock scheduling",
    subAgents: [
      { id: "in-asn", label: "ASN & GRN Match", icon: ClipboardCheck, scanMs: 850, hasIssue: false },
      { id: "in-putaway", label: "Putaway Aging", icon: PackageOpen, scanMs: 1100, hasIssue: false },
      { id: "in-dock", label: "Dock Scheduling", icon: DoorOpen, scanMs: 950, hasIssue: false },
    ],
    extraAgentCount: 19,
  },
  {
    id: "outbound",
    title: "Outbound",
    icon: ArrowUpFromLine,
    caption: "Picklists, pack stations, dispatch, and delivery SLA",
    subAgents: [
      { id: "out-pick", label: "Picklist Assignment", icon: ClipboardList, scanMs: 950, hasIssue: false },
      {
        id: "out-sla",
        label: "SLA Breach Monitor",
        icon: Timer,
        scanMs: 1300,
        hasIssue: true,
        severity: "red",
        issueTitle: "42 unfulfilled orders set to breach SLA",
        shortFinding: "42 unfulfilled orders are projected to breach delivery SLA within 2 hours.",
        actionLabel: "Assign Priority Picklists to 42 orders",
        actionDoneLabel: "Picklists Assigned",
      },
      {
        id: "out-pickrate",
        label: "Pick Rate Monitor",
        icon: TrendingDown,
        scanMs: 1150,
        hasIssue: true,
        severity: "yellow",
        issueTitle: "Pick rate down 18% this shift",
        shortFinding: "Pick rate has dropped 18% this shift, concentrated in Zone B.",
        actionLabel: "Noted",
        actionDoneLabel: "Noted",
      },
      { id: "out-pack", label: "Pack Station Monitor", icon: PackageCheck, scanMs: 1050, hasIssue: false },
      { id: "out-dispatch", label: "Dispatch & Manifest", icon: Truck, scanMs: 800, hasIssue: false },
    ],
    extraAgentCount: 21,
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Boxes,
    caption: "Stock accuracy, safety stock, hold aging, and slotting",
    subAgents: [
      {
        id: "inv-notfound",
        label: "Not Found Stock Monitor",
        icon: PackageX,
        scanMs: 1250,
        hasIssue: true,
        severity: "yellow",
        issueTitle: "Not Found stock up 2.4x this cycle",
        shortFinding: "Not Found stock has risen 2.4x this cycle across 3 SKUs.",
        actionLabel: "Create Cycle Count Task for 3 SKUs",
        actionDoneLabel: "Cycle Count Task Created",
      },
      {
        id: "inv-slotting",
        label: "A-Class Slotting Agent",
        icon: LayoutGrid,
        scanMs: 1100,
        hasIssue: true,
        severity: "yellow",
        issueTitle: "'A' SKUs split across non-adjacent bins",
        shortFinding: "5 'A' classified SKUs are split across non-adjacent bins.",
        actionLabel: "Trigger Slotting Move for 5 SKUs",
        actionDoneLabel: "Movement Task Created",
      },
      { id: "inv-safety", label: "Safety Stock Monitor", icon: ShieldCheck, scanMs: 900, hasIssue: false },
      { id: "inv-hold", label: "Hold Aging Monitor", icon: Timer, scanMs: 1000, hasIssue: false },
    ],
    extraAgentCount: 20,
  },
];

export const TOTAL_SUBAGENTS = CATEGORIES.reduce((n, c) => n + c.subAgents.length + c.extraAgentCount, 0);

// ─── Preview-panel content (the "it can display anything" part) ──────────────

export interface OrderRow {
  order: string;
  seller: string;
  promisedBy: string;
  status: "Past dispatch" | "At risk";
  courier: string;
}
export interface StockRow {
  sku: string;
  bin: string;
  expected: number;
  found: number;
  lastCounted: string;
}
export interface SlottingRow {
  sku: string;
  current: string;
  zone: string;
  proposed: string;
}
export interface ProductivityPoint {
  hour: string;
  rate: number;
}
export interface PickerRow {
  name: string;
  zone: string;
  rate: number;
}

export type PreviewData =
  | { kind: "orders"; categoryTitle: string; note: string; rows: OrderRow[]; footer: string }
  | { kind: "stock"; categoryTitle: string; note: string; rows: StockRow[] }
  | { kind: "slotting"; categoryTitle: string; note: string; rows: SlottingRow[] }
  | {
      kind: "productivity";
      categoryTitle: string;
      note: string;
      points: ProductivityPoint[];
      baseline: number;
      pickers: PickerRow[];
    };

export const PREVIEW_DATA: Record<string, PreviewData> = {
  "out-sla": {
    kind: "orders",
    categoryTitle: "Outbound",
    note: "42 unfulfilled orders are set to breach delivery SLA within the next 2 hours. 11 are already past their promised dispatch time, concentrated in the Okhla WH Dark Store queue. Courier pickup for this batch closes in 38 minutes.",
    rows: [
      { order: "SR-48812", seller: "Mama Earth", promisedBy: "2:40 PM", status: "Past dispatch", courier: "Pikndel" },
      { order: "SR-48820", seller: "Kapiva", promisedBy: "2:55 PM", status: "At risk", courier: "Quicklee" },
      { order: "SR-48831", seller: "Teabox", promisedBy: "3:05 PM", status: "At risk", courier: "Pikndel" },
      { order: "SR-48845", seller: "Mama Earth", promisedBy: "3:10 PM", status: "Past dispatch", courier: "Elasticrun" },
      { order: "SR-48852", seller: "Clapstore", promisedBy: "3:15 PM", status: "At risk", courier: "Quicklee" },
      { order: "SR-48860", seller: "Palmonas", promisedBy: "3:20 PM", status: "At risk", courier: "Pikndel" },
    ],
    footer: "+ 36 more orders in this batch",
  },
  "out-pickrate": {
    kind: "productivity",
    categoryTitle: "Outbound",
    note: "Average pick rate has dropped to 92 units/hr over the last 2 hours, down from a 112 units/hr baseline. The dip lines up with Wave W-1042 and is concentrated in Zone B, driven mainly by Rakesh Kumar, Sunita Devi, and Arjun Mehta picking well below target this shift.",
    points: [
      { hour: "9 AM", rate: 108 },
      { hour: "10 AM", rate: 114 },
      { hour: "11 AM", rate: 112 },
      { hour: "12 PM", rate: 97 },
      { hour: "1 PM", rate: 91 },
      { hour: "2 PM", rate: 92 },
    ],
    baseline: 112,
    pickers: [
      { name: "Rakesh Kumar", zone: "Zone B", rate: 74 },
      { name: "Sunita Devi", zone: "Zone B", rate: 79 },
      { name: "Arjun Mehta", zone: "Zone B", rate: 85 },
    ],
  },
  "inv-notfound": {
    kind: "stock",
    categoryTitle: "Inventory",
    note: "Not Found stock has increased to 58 units, up from 24 at the last cycle count — a 2.4x jump, all in the Bawana WH bin cluster B-12.",
    rows: [
      { sku: "Kapiva Immunity 60s", bin: "B-12-04", expected: 40, found: 18, lastCounted: "3 cycles ago" },
      { sku: "Teabox Earl Grey", bin: "B-12-07", expected: 36, found: 22, lastCounted: "2 cycles ago" },
      { sku: "Palmonas Chain", bin: "B-12-11", expected: 20, found: 4, lastCounted: "4 cycles ago" },
    ],
  },
  "inv-slotting": {
    kind: "slotting",
    categoryTitle: "Inventory",
    note: "5 'A' classified SKUs for Mama Earth are split across 3 non-adjacent bins instead of being slotted together, adding roughly 40 extra picker steps per wave.",
    rows: [
      { sku: "Mama Earth Face Wash 100ml", current: "B-14-02", zone: "Zone B", proposed: "A-2-01" },
      { sku: "Mama Earth Shampoo 250ml", current: "C-02-09", zone: "Zone C", proposed: "A-2-02" },
      { sku: "Mama Earth Vitamin C Serum", current: "A-19-03", zone: "Zone A-19", proposed: "A-2-03" },
      { sku: "Mama Earth Ubtan Face Scrub", current: "B-03-06", zone: "Zone B", proposed: "A-2-04" },
      { sku: "Mama Earth Onion Hair Oil", current: "C-11-01", zone: "Zone C", proposed: "A-2-05" },
    ],
  },
};

export const CATEGORY_STAGGER_MS = 150;
export const SUBAGENT_STAGGER_MS = 380;
export const CHARS_PER_TICK = 3;
export const TICK_MS = 16;
export const RUN_TICK_MS = 50;

export function revealChars(elapsed: number, start: number, len: number) {
  if (elapsed <= start) return 0;
  const raw = Math.floor((elapsed - start) / TICK_MS) * CHARS_PER_TICK;
  return Math.max(0, Math.min(len, raw));
}

export interface Timing {
  start: number;
  end: number;
  textEnd: number;
}

export const TIMING: Record<string, Timing> = {};
export let ALL_SCANNED_AT = 0;
export let MAX_TEXT_END = 0;

CATEGORIES.forEach((cat, ci) => {
  cat.subAgents.forEach((sa, si) => {
    const start = ci * CATEGORY_STAGGER_MS + si * SUBAGENT_STAGGER_MS;
    const end = start + sa.scanMs;
    let textEnd = end;
    if (sa.hasIssue && sa.shortFinding) {
      const dur = Math.ceil(sa.shortFinding.length / CHARS_PER_TICK) * TICK_MS;
      textEnd = end + dur;
    }
    TIMING[sa.id] = { start, end, textEnd };
    if (end > ALL_SCANNED_AT) ALL_SCANNED_AT = end;
    if (textEnd > MAX_TEXT_END) MAX_TEXT_END = textEnd;
  });
});

export const ALL_ISSUES = CATEGORIES.flatMap((c) => c.subAgents.filter((sa) => sa.hasIssue).map((sa) => ({ ...sa, categoryTitle: c.title })));
export const RED_ISSUES = ALL_ISSUES.filter((i) => i.severity === "red");
export const YELLOW_ISSUES = ALL_ISSUES.filter((i) => i.severity === "yellow");
export const CLEAR_CATEGORIES = CATEGORIES.filter((c) => c.subAgents.every((sa) => !sa.hasIssue));

export const SUMMARY_START = MAX_TEXT_END + 300;
export const SUMMARY_LINES = buildSummaryLines();
export const SUMMARY_TEXT = SUMMARY_LINES.join("\n");
export const SUMMARY_DURATION = Math.ceil(SUMMARY_TEXT.length / CHARS_PER_TICK) * TICK_MS;
export const TOTAL_RUNTIME = SUMMARY_START + SUMMARY_DURATION + 200;
export const SUMMARY_HEADLINE = `${RED_ISSUES.length} critical, ${YELLOW_ISSUES.length} attention · ${CLEAR_CATEGORIES.map((c) => c.title).join(", ")} clear`;

function buildSummaryLines(): string[] {
  const lines = [
    "Synthesizing findings across Inbound, Outbound, and Inventory...",
    `Network status: ${RED_ISSUES.length} critical issue${RED_ISSUES.length === 1 ? "" : "s"}, ${YELLOW_ISSUES.length} need${YELLOW_ISSUES.length === 1 ? "s" : ""} attention.`,
  ];
  let n = 1;
  for (const i of [...RED_ISSUES, ...YELLOW_ISSUES]) {
    lines.push(`${n}. [${i.categoryTitle}] ${i.issueTitle} — recommended: ${i.actionLabel}.`);
    n += 1;
  }
  if (CLEAR_CATEGORIES.length > 0) {
    const names = CLEAR_CATEGORIES.map((c) => c.title).join(" and ");
    lines.push(`${names} ${CLEAR_CATEGORIES.length > 1 ? "are" : "is"} fully clear — no action needed.`);
  }
  return lines;
}

export function phaseOf(id: string, elapsed: number): "queued" | "scanning" | "done" {
  const t = TIMING[id];
  if (elapsed < t.start) return "queued";
  if (elapsed < t.end) return "scanning";
  return "done";
}

export function categoryStatus(cat: CategoryDef, elapsed: number, issueStatus: Record<string, IssueStatus>): CategoryStatus {
  const allDone = cat.subAgents.every((sa) => phaseOf(sa.id, elapsed) === "done");
  if (!allDone) return "scanning";
  const openIssues = cat.subAgents.filter((sa) => sa.hasIssue && (issueStatus[sa.id] ?? "open") !== "resolved");
  if (openIssues.some((i) => i.severity === "red")) return "red";
  if (openIssues.some((i) => i.severity === "yellow")) return "yellow";
  return "green";
}

export type OverallStatus = "idle" | "scanning" | "green" | "yellow" | "red";

export function overallStatus(hasRun: boolean, elapsed: number, issueStatus: Record<string, IssueStatus>): OverallStatus {
  if (!hasRun) return "idle";
  const statuses = CATEGORIES.map((c) => categoryStatus(c, elapsed, issueStatus));
  if (statuses.some((s) => s === "scanning")) return "scanning";
  if (statuses.some((s) => s === "red")) return "red";
  if (statuses.some((s) => s === "yellow")) return "yellow";
  return "green";
}

export const LIVE_STATUS_MAP: Record<"scanning" | "green" | "yellow" | "red", { label: string; color: string }> = {
  scanning: { label: "Scanning", color: "#2563eb" },
  green: { label: "All Clear", color: "#16a34a" },
  yellow: { label: "Needs Attention", color: "#d97706" },
  red: { label: "Critical", color: "#dc2626" },
};
