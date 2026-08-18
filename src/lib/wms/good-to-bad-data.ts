import { useSyncExternalStore } from "react";

// Good-to-Bad Stock Movement — a movement task tagged as a quality reject
// auto-opens an exception ticket. The exception team generates one USN per
// unit; the operator scans each USN back on the movement task before the
// move can be confirmed. This module is the single in-memory source of
// truth shared by the Create Movement Tasks, Item Movement and Exceptions
// screens (no backend in this demo, so a tiny pub/sub store keeps all three
// screens in sync).

export const DAMAGE_SEGREGATION_REASON = "Damage Segregation";

// Bins whose Storage Subtype is Bad/Quarantine — a real system would look
// this up from bin master data; the demo hardcodes the known set.
export const BAD_QUARANTINE_BINS = ["QC-HOLD-1", "QC-HOLD-2", "BAD-01", "BAD-02"];

export const isBadQuarantineBin = (bin: string) =>
  BAD_QUARANTINE_BINS.some((b) => b.toUpperCase() === bin.trim().toUpperCase());

export const rejectReasons = ["Damaged", "Quality Hold", "Customer Complaint"] as const;
export type RejectReason = (typeof rejectReasons)[number];

const SLA_HOURS = 24;

export interface GeneratedUsn {
  id: string;
  status: "printed" | "moved";
}

export type TicketStatus = "Open" | "Ready to Move" | "Closed";

export interface GoodToBadTicket {
  id: string; // EXC-xxxx
  taskId: string; // MOV-xxxx — the linked Item Movement task
  sku: string;
  skuName: string;
  batch?: string;
  fromBin: string;
  toBin: string;
  requestedQty: number;
  rejectReason: RejectReason | null;
  status: TicketStatus;
  raisedAt: number; // epoch ms
  usns: GeneratedUsn[];
}

let ticketCounter = 4822;
let usnCounter = 106;

let tickets: GoodToBadTicket[] = [
  {
    id: "EXC-4821",
    taskId: "MOV-3004",
    sku: "600822",
    skuName: "boAt Rockerz 450 Bluetooth Headphones",
    batch: "BTH-RK450-0123",
    fromBin: "PICK-B2",
    toBin: "QC-HOLD-1",
    requestedQty: 5,
    rejectReason: null,
    status: "Open",
    raisedAt: Date.now() - 26 * 60 * 60 * 1000, // seeded past SLA to show aging
    usns: [],
  },
];

type Listener = () => void;
let listeners: Listener[] = [];
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: Listener) => {
  listeners.push(l);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
};
const snapshot = () => tickets;

export function useGoodToBadTickets() {
  return useSyncExternalStore(subscribe, snapshot);
}

export function getGoodToBadTicket(id: string) {
  return tickets.find((t) => t.id === id) ?? null;
}

export function getTicketForTask(taskId: string) {
  return tickets.find((t) => t.taskId === taskId) ?? null;
}

export function isOverSla(ticket: GoodToBadTicket) {
  if (ticket.status === "Closed") return false;
  return Date.now() - ticket.raisedAt > SLA_HOURS * 60 * 60 * 1000;
}

export function createGoodToBadTicket(input: {
  taskId: string;
  sku: string;
  skuName: string;
  batch?: string;
  fromBin: string;
  toBin: string;
  requestedQty: number;
}): GoodToBadTicket {
  const ticket: GoodToBadTicket = {
    id: `EXC-${ticketCounter++}`,
    rejectReason: null,
    status: "Open",
    raisedAt: Date.now(),
    usns: [],
    ...input,
  };
  tickets = [ticket, ...tickets];
  emit();
  return ticket;
}

export function setRejectReason(ticketId: string, reason: RejectReason) {
  tickets = tickets.map((t) => (t.id === ticketId ? { ...t, rejectReason: reason } : t));
  emit();
}

/** Generates up to `qty` USNs (capped at the ticket's remaining requested
 * quantity) and marks the ticket ready to move. Returns the newly minted
 * USNs, which the caller renders as a single print batch. */
export function generateUsns(ticketId: string, qty: number): GeneratedUsn[] {
  const ticket = getGoodToBadTicket(ticketId);
  if (!ticket) return [];
  const remaining = ticket.requestedQty - ticket.usns.length;
  const n = Math.max(0, Math.min(qty, remaining));
  const newUsns: GeneratedUsn[] = Array.from({ length: n }, () => ({
    id: `USN-${ticket.sku}-${String(usnCounter++).padStart(6, "0")}`,
    status: "printed",
  }));
  tickets = tickets.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          usns: [...t.usns, ...newUsns],
          status: t.status === "Open" ? "Ready to Move" : t.status,
        }
      : t,
  );
  emit();
  return newUsns;
}

export function scanUsn(
  ticketId: string,
  usnId: string,
): { ok: true } | { ok: false; error: string } {
  const ticket = getGoodToBadTicket(ticketId);
  if (!ticket) return { ok: false, error: "Ticket not found" };
  const usn = ticket.usns.find((u) => u.id.toUpperCase() === usnId.trim().toUpperCase());
  if (!usn) return { ok: false, error: "USN not recognised for this SKU/ticket" };
  if (usn.status === "moved") return { ok: false, error: "USN already scanned" };
  tickets = tickets.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          usns: t.usns.map((u) => (u.id === usn.id ? { ...u, status: "moved" } : u)),
        }
      : t,
  );
  emit();
  return { ok: true };
}

/** Closes the ticket once every requested unit has been scanned as moved. */
export function closeTicketIfComplete(ticketId: string) {
  const ticket = getGoodToBadTicket(ticketId);
  if (!ticket) return;
  const movedCount = ticket.usns.filter((u) => u.status === "moved").length;
  if (movedCount >= ticket.requestedQty) {
    tickets = tickets.map((t) => (t.id === ticketId ? { ...t, status: "Closed" } : t));
    emit();
  }
}
