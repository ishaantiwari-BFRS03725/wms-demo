import { useSyncExternalStore } from "react";

// Guided-demo controller — a tiny pub/sub store driving the on-screen coach
// overlay (see components/wms/demo-overlay.tsx). A "tour" is an ordered list
// of steps; each step names the route it lives on, an optional element to
// spotlight (via a `data-demo` attribute), and the instruction text shown in
// the floating coach card. The user reads each prompt, performs the action on
// the real screen, and clicks Next to advance — so the demo drives the
// narration while the actual screens do the work.

export interface TourStep {
  route: string;
  // Value of a `data-demo` attribute to highlight on this step. Omitted for
  // intro / screen-level steps that have no single element to point at.
  target?: string;
  title: string;
  body: string;
}

export const GOOD_TO_BAD_TOUR = "good-to-bad";

export const GOOD_TO_BAD_STEPS: TourStep[] = [
  {
    route: "/movement-task-create",
    title: "Good-to-Bad Stock Movement",
    body: "We'll move 5 damaged boAt Rockerz 450 headphones out of a good pick bin and into quarantine. It starts by raising a movement task. Click Next to begin.",
  },
  {
    route: "/movement-task-create",
    target: "mtc-type",
    title: "Task type · Item Movement",
    body: "Keep the task type on Item Movement — we're moving individual units, not a whole bin.",
  },
  {
    route: "/movement-task-create",
    target: "mtc-from",
    title: "From bin",
    body: "Type PICK-B2 in the From Bin field — the good pick bin the damaged stock is sitting in.",
  },
  {
    route: "/movement-task-create",
    target: "mtc-to",
    title: "To bin · quarantine",
    body: "Type QC-HOLD-1 in the To Bin field. That's a Bad/Quarantine bin — moving stock here is what triggers the exception flow.",
  },
  {
    route: "/movement-task-create",
    target: "mtc-sku",
    title: "SKU",
    body: "Open the SKU dropdown and pick 600822 — boAt Rockerz 450 Bluetooth Headphones.",
  },
  {
    route: "/movement-task-create",
    target: "mtc-qty",
    title: "Quantity",
    body: "Enter 5 — the number of damaged units being segregated.",
  },
  {
    route: "/movement-task-create",
    target: "mtc-reason",
    title: "Reason · Damage Segregation",
    body: "Open the Reason dropdown and choose Damage Segregation. A note appears explaining that a quarantine destination will auto-raise a linked exception ticket.",
  },
  {
    route: "/movement-task-create",
    target: "mtc-add",
    title: "Add the task",
    body: "Click Add Task. Because the reason is Damage Segregation and the destination is a quarantine bin, a linked exception ticket (EXC-…) opens automatically — you'll see it tagged Open in the Created Tasks list.",
  },
  {
    route: "/exceptions",
    target: "exc-table",
    title: "Exceptions queue",
    body: "Now hop to the Exceptions screen. Your ticket is at the top of the queue, tagged Open. Click its View & Print button to open the QC panel.",
  },
  {
    route: "/exceptions",
    title: "Set the reject reason",
    body: "In the panel that slid open, pick a reject reason (e.g. Damaged) and click Confirm. USNs can't be generated until a reason is set.",
  },
  {
    route: "/exceptions",
    title: "Generate USNs",
    body: "Leave the quantity at 5 and click Generate. Five unique serial numbers (USNs) are minted and a print batch of labels is shown — one sticker per damaged unit. The ticket flips to Ready to Move.",
  },
  {
    route: "/item-movement",
    target: "im-list",
    title: "Work the move on the floor",
    body: "Finally, open Item Movement. Under 'Item · Good-to-Bad QC' your task now shows Ready to Move — tap it to start scanning.",
  },
  {
    route: "/item-movement",
    title: "Scan bins and item",
    body: "Scan the From bin (PICK-B2), then the To bin (QC-HOLD-1), then the item barcode (600822). Use the Auto button on each step if you don't have a scanner handy.",
  },
  {
    route: "/item-movement",
    title: "Scan every USN",
    body: "Scan each printed USN sticker one by one (Auto fills the next pending one). Confirm Move stays locked until all 5 are scanned — that's the gate that guarantees every damaged unit physically reached quarantine.",
  },
  {
    route: "/item-movement",
    title: "Confirm & close",
    body: "With all USNs scanned, click Confirm Move. The units land in QC-HOLD-1 and the linked exception ticket auto-closes. That's the full Good-to-Bad loop — demo complete!",
  },
];

interface TourState {
  activeTour: string | null;
  stepIndex: number;
}

let state: TourState = { activeTour: null, stepIndex: 0 };

type Listener = () => void;
let listeners: Listener[] = [];
const emit = () => {
  listeners.forEach((l) => l());
};
const subscribe = (l: Listener) => {
  listeners.push(l);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
};
const snapshot = () => state;

export function useTour() {
  return useSyncExternalStore(subscribe, snapshot);
}

export function tourSteps(id: string | null): TourStep[] {
  return id === GOOD_TO_BAD_TOUR ? GOOD_TO_BAD_STEPS : [];
}

export function startTour(id: string) {
  state = { activeTour: id, stepIndex: 0 };
  emit();
}

export function endTour() {
  state = { activeTour: null, stepIndex: 0 };
  emit();
}

export function nextStep() {
  if (!state.activeTour) return;
  const steps = tourSteps(state.activeTour);
  if (state.stepIndex >= steps.length - 1) {
    endTour();
    return;
  }
  state = { ...state, stepIndex: state.stepIndex + 1 };
  emit();
}

export function prevStep() {
  if (!state.activeTour || state.stepIndex === 0) return;
  state = { ...state, stepIndex: state.stepIndex - 1 };
  emit();
}
