export type OrderStatus =
  | "created"
  | "picked"
  | "packed"
  | "manifested"
  | "dispatched";

export type ItemStatus = "pending" | "picked" | "packed";

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  status: ItemStatus;
}

export type OrderType = "B2C" | "B2B";

export interface Order {
  orderNo: string;
  extOrderNo: string;
  channel: "Amazon" | "Flipkart" | "Shopify" | "Myntra";
  seller: string;
  courier: "Delhivery" | "BlueDart" | "XpressBees" | "Ecom Express";
  sla: "Same Day" | "Next Day" | "Standard";
  paymentMode: "Prepaid" | "COD";
  orderType: OrderType;
  status: OrderStatus;
  totalQuantity: number;
  items: OrderItem[];
  createdAt: string;
}

export const ORDER_STEPS: OrderStatus[] = [
  "created",
  "picked",
  "packed",
  "manifested",
  "dispatched",
];

const itemStatusForOrder = (s: OrderStatus): ItemStatus =>
  s === "created" ? "pending" : s === "picked" ? "picked" : "packed";

// Deterministic B2C/B2B assignment from orderNo — keeps demo distribution stable.
const inferOrderType = (orderNo: string): OrderType => {
  let h = 0;
  for (let i = 0; i < orderNo.length; i++) h = (h * 31 + orderNo.charCodeAt(i)) | 0;
  return Math.abs(h) % 4 === 0 ? "B2B" : "B2C";
};

const make = (
  o: Omit<Order, "totalQuantity" | "items" | "orderType"> & {
    items: Omit<OrderItem, "status">[];
    orderType?: OrderType;
  },
): Order => {
  const itemStatus = itemStatusForOrder(o.status);
  const items = o.items.map((i) => ({ ...i, status: itemStatus }));
  return {
    ...o,
    orderType: o.orderType ?? inferOrderType(o.orderNo),
    items,
    totalQuantity: items.reduce((a, b) => a + b.quantity, 0),
  };
};

// ── SLA & timestamp helpers ─────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");

export const fmtTimestamp = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export const slaDeadline = (createdAt: string, sla: Order["sla"]): Date => {
  const d = new Date(createdAt);
  if (sla === "Same Day") {
    d.setHours(23, 59, 0, 0);
  } else if (sla === "Next Day") {
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
  } else {
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 0, 0);
  }
  return d;
};

// Demo "now" — anchored a few hours past the latest order so the dataset
// always looks fresh and SLA windows are meaningful regardless of wall time.
let _demoNow: Date | null = null;
export const demoNow = (): Date => {
  if (_demoNow) return _demoNow;
  const latest = Math.max(
    ...orders.map((o) => new Date(o.createdAt).getTime()),
  );
  _demoNow = new Date(latest + 5 * 60 * 60 * 1000); // +5h after latest order
  return _demoNow;
};

// ── Detailed order journey (7 steps) ──
export const JOURNEY_STEPS = [
  "Created",
  "Picklist Generated",
  "Picked",
  "Sorted",
  "Packed",
  "Manifested",
  "Handed Over",
] as const;

export type JourneyStep = (typeof JOURNEY_STEPS)[number];

// How many journey steps are complete at each OrderStatus.
const COMPLETED_STEPS_BY_STATUS: Record<OrderStatus, number> = {
  created: 1, // Created
  picked: 3, // + Picklist Generated, Picked
  packed: 5, // + Sorted, Packed
  manifested: 6, // + Manifested
  dispatched: 7, // + Handed Over
};

// Synthesised minutes after createdAt per step
const JOURNEY_OFFSETS_MIN: Record<JourneyStep, number> = {
  Created: 0,
  "Picklist Generated": 15,
  Picked: 55,
  Sorted: 100,
  Packed: 140,
  Manifested: 240,
  "Handed Over": 360,
};

export interface JourneyEvent {
  step: JourneyStep;
  state: "done" | "pending";
  at?: Date;
}

export const journeyHistory = (order: Order): JourneyEvent[] => {
  const completed = COMPLETED_STEPS_BY_STATUS[order.status];
  const created = new Date(order.createdAt);
  return JOURNEY_STEPS.map((step, idx) => {
    if (idx < completed) {
      return {
        step,
        state: "done" as const,
        at: new Date(
          created.getTime() + JOURNEY_OFFSETS_MIN[step] * 60_000,
        ),
      };
    }
    return { step, state: "pending" as const };
  });
};

// Per-stage quantities for an item, derived from the order status.
export interface ItemProgress {
  ordered: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  picked: number;
  packed: number;
  manifested: number;
  shipped: number;
  returned: number;
}

export const itemProgress = (
  qty: number,
  status: OrderStatus,
): ItemProgress => {
  const c = COMPLETED_STEPS_BY_STATUS[status];
  const cancelled = 0;
  const confirmed = qty - cancelled;
  return {
    ordered: qty,
    pending: qty - confirmed,
    confirmed,
    cancelled,
    picked: c >= 3 ? qty : 0,
    packed: c >= 5 ? qty : 0,
    manifested: c >= 6 ? qty : 0,
    shipped: c >= 7 ? qty : 0,
    returned: 0,
  };
};

export const fmtSlaRemaining = (
  deadline: Date,
  now: Date = demoNow(),
): { text: string; overdue: boolean; close: boolean } => {
  const diffMs = deadline.getTime() - now.getTime();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const totalMins = Math.floor(abs / 60_000);
  const days = Math.floor(totalMins / 1440);
  const hrs = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  let core: string;
  if (days > 0) core = `${days}d ${hrs}h`;
  else if (hrs > 0) core = `${hrs}h ${mins}m`;
  else core = `${mins}m`;
  return {
    text: overdue ? `Overdue ${core}` : `${core} left`,
    overdue,
    close: !overdue && diffMs < 4 * 60 * 60 * 1000, // within 4h
  };
};

export const orders: Order[] = [
  make({
    orderNo: "WMS-100234",
    extOrderNo: "AMZ-IN-99812",
    channel: "Amazon",
    seller: "Northwind Apparel",
    courier: "Delhivery",
    sla: "Next Day",
    paymentMode: "Prepaid",
    status: "created",
    createdAt: "2026-06-02T09:14:00Z",
    items: [
      { sku: "NW-TSH-BLK-M", name: "Crew Tee Black / M", quantity: 2 },
      { sku: "NW-SOC-WHT-L", name: "Ribbed Socks White / L", quantity: 3 },
    ],
  }),
  make({
    orderNo: "WMS-100235",
    extOrderNo: "FK-77231",
    channel: "Flipkart",
    seller: "Acme Electronics",
    courier: "BlueDart",
    sla: "Same Day",
    paymentMode: "COD",
    status: "picked",
    createdAt: "2026-06-02T08:42:00Z",
    items: [
      { sku: "AC-EAR-PRO", name: "Wireless Earbuds Pro", quantity: 1 },
      { sku: "AC-CHG-65W", name: "65W GaN Charger", quantity: 1 },
    ],
  }),
  make({
    orderNo: "WMS-100236",
    extOrderNo: "SHP-55120",
    channel: "Shopify",
    seller: "Loom & Linen",
    courier: "XpressBees",
    sla: "Standard",
    paymentMode: "Prepaid",
    status: "packed",
    createdAt: "2026-06-02T07:30:00Z",
    items: [
      { sku: "LL-BED-KNG", name: "Cotton Bedsheet King", quantity: 1 },
      { sku: "LL-PIL-STD", name: "Pillow Cover Std", quantity: 2 },
    ],
  }),
  make({
    orderNo: "WMS-100237",
    extOrderNo: "MYN-31204",
    channel: "Myntra",
    seller: "Northwind Apparel",
    courier: "Ecom Express",
    sla: "Next Day",
    paymentMode: "Prepaid",
    status: "manifested",
    createdAt: "2026-06-01T18:20:00Z",
    items: [{ sku: "NW-JKT-NVY-L", name: "Bomber Jacket Navy / L", quantity: 1 }],
  }),
  make({
    orderNo: "WMS-100238",
    extOrderNo: "AMZ-IN-99847",
    channel: "Amazon",
    seller: "Acme Electronics",
    courier: "Delhivery",
    sla: "Same Day",
    paymentMode: "Prepaid",
    status: "dispatched",
    createdAt: "2026-06-01T14:05:00Z",
    items: [
      { sku: "AC-SPK-MINI", name: "Mini Bluetooth Speaker", quantity: 1 },
      { sku: "AC-CAB-USC", name: "USB-C Cable 1m", quantity: 2 },
    ],
  }),
  make({
    orderNo: "WMS-100239",
    extOrderNo: "FK-77298",
    channel: "Flipkart",
    seller: "Loom & Linen",
    courier: "BlueDart",
    sla: "Standard",
    paymentMode: "COD",
    status: "created",
    createdAt: "2026-06-02T10:01:00Z",
    items: [{ sku: "LL-TOW-BTH", name: "Bath Towel Charcoal", quantity: 4 }],
  }),
  make({
    orderNo: "WMS-100240",
    extOrderNo: "SHP-55189",
    channel: "Shopify",
    seller: "Verde Beauty",
    courier: "XpressBees",
    sla: "Next Day",
    paymentMode: "Prepaid",
    status: "picked",
    createdAt: "2026-06-02T09:55:00Z",
    items: [
      { sku: "VB-SER-30", name: "Vitamin C Serum 30ml", quantity: 1 },
      { sku: "VB-CRM-50", name: "Hydrating Cream 50ml", quantity: 1 },
      { sku: "VB-SUN-50", name: "Mineral Sunscreen 50ml", quantity: 1 },
    ],
  }),
  make({
    orderNo: "WMS-100241",
    extOrderNo: "AMZ-IN-99901",
    channel: "Amazon",
    seller: "Verde Beauty",
    courier: "Delhivery",
    sla: "Standard",
    paymentMode: "Prepaid",
    status: "packed",
    createdAt: "2026-06-02T06:42:00Z",
    items: [{ sku: "VB-LIP-RED", name: "Matte Lipstick Crimson", quantity: 2 }],
  }),
  make({
    orderNo: "WMS-100242",
    extOrderNo: "MYN-31290",
    channel: "Myntra",
    seller: "Northwind Apparel",
    courier: "Ecom Express",
    sla: "Same Day",
    paymentMode: "COD",
    status: "manifested",
    createdAt: "2026-06-01T20:11:00Z",
    items: [
      { sku: "NW-DEN-32", name: "Slim Denim 32", quantity: 1 },
      { sku: "NW-BLT-LTH", name: "Leather Belt Brown", quantity: 1 },
    ],
  }),
  make({
    orderNo: "WMS-100243",
    extOrderNo: "FK-77342",
    channel: "Flipkart",
    seller: "Acme Electronics",
    courier: "BlueDart",
    sla: "Next Day",
    paymentMode: "Prepaid",
    status: "dispatched",
    createdAt: "2026-06-01T12:30:00Z",
    items: [{ sku: "AC-WCH-S2", name: "Smartwatch S2", quantity: 1 }],
  }),
  make({
    orderNo: "WMS-100244",
    extOrderNo: "SHP-55222",
    channel: "Shopify",
    seller: "Loom & Linen",
    courier: "XpressBees",
    sla: "Standard",
    paymentMode: "Prepaid",
    status: "created",
    createdAt: "2026-06-02T11:18:00Z",
    items: [{ sku: "LL-CUR-LIN", name: "Linen Curtain Beige", quantity: 2 }],
  }),
  make({
    orderNo: "WMS-100245",
    extOrderNo: "AMZ-IN-99955",
    channel: "Amazon",
    seller: "Verde Beauty",
    courier: "Delhivery",
    sla: "Next Day",
    paymentMode: "COD",
    status: "picked",
    createdAt: "2026-06-02T10:48:00Z",
    items: [
      { sku: "VB-SHM-250", name: "Botanical Shampoo 250ml", quantity: 1 },
      { sku: "VB-CON-250", name: "Botanical Conditioner 250ml", quantity: 1 },
    ],
  }),
  // ── Bulk filler orders so the table scrolls (sticky-header demo) ──────────
  ...Array.from({ length: 60 }, (_, i) => {
    const channels = ["Amazon", "Flipkart", "Shopify", "Myntra"] as const;
    const sellers = [
      "Northwind Apparel",
      "Acme Electronics",
      "Loom & Linen",
      "Verde Beauty",
    ];
    const couriers = [
      "Delhivery",
      "BlueDart",
      "XpressBees",
      "Ecom Express",
    ] as const;
    const slas = ["Same Day", "Next Day", "Standard"] as const;
    const payments = ["Prepaid", "COD"] as const;
    const statuses: OrderStatus[] = [
      "created",
      "picked",
      "packed",
      "manifested",
      "dispatched",
    ];
    const products: { sku: string; name: string }[] = [
      { sku: "NW-TSH-BLK-M", name: "Crew Tee Black / M" },
      { sku: "AC-EAR-PRO", name: "Wireless Earbuds Pro" },
      { sku: "LL-BED-KNG", name: "Cotton Bedsheet King" },
      { sku: "VB-SER-30", name: "Vitamin C Serum 30ml" },
      { sku: "NW-JKT-NVY-L", name: "Bomber Jacket Navy / L" },
      { sku: "AC-CHG-65W", name: "65W GaN Charger" },
      { sku: "LL-TOW-BTH", name: "Bath Towel Charcoal" },
      { sku: "VB-LIP-RED", name: "Matte Lipstick Crimson" },
    ];

    const seq = 100246 + i;
    const channel = channels[i % channels.length];
    const seller = sellers[(i * 3) % sellers.length];
    const courier = couriers[(i * 2) % couriers.length];
    const sla = slas[i % slas.length];
    const paymentMode = payments[i % payments.length];
    const status = statuses[i % statuses.length];

    // Spread created times across two days, descending minutes.
    const day = i % 2 === 0 ? "01" : "02";
    const hh = pad(6 + (i % 16));
    const mm = pad((i * 7) % 60);

    const p1 = products[i % products.length];
    const p2 = products[(i + 3) % products.length];
    const items = [
      { sku: p1.sku, name: p1.name, quantity: 1 + (i % 3) },
      ...(i % 2 === 0
        ? [{ sku: p2.sku, name: p2.name, quantity: 1 + (i % 2) }]
        : []),
    ];

    return make({
      orderNo: `WMS-${seq}`,
      extOrderNo: `EXT-${seq}`,
      channel,
      seller,
      courier,
      sla,
      paymentMode,
      status,
      createdAt: `2026-06-${day}T${hh}:${mm}:00Z`,
      items,
    });
  }),
];

export const getOrder = (orderNo: string) =>
  orders.find((o) => o.orderNo === orderNo);
