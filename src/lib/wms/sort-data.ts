export interface SortItem {
  sku: string;
  name: string;
  image: string;
  orderId: string;
}

export interface SortTask {
  id: string;
  toteId: string;
  wave: string;
  totalItems: number;
  totalOrders: number;
  status: "assigned" | "in_progress" | "completed";
  items: SortItem[];
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/240/240`;

export const sortTasks: SortTask[] = [
  {
    id: "ST-9001",
    toteId: "TOTE-A-114",
    wave: "WAVE-0612-A",
    totalItems: 6,
    totalOrders: 3,
    status: "assigned",
    items: [
      { sku: "NW-TSH-BLK-M", name: "Crew Tee · Black / M", image: img("tsh-blk"), orderId: "ORD-ABC-12" },
      { sku: "NW-SOC-WHT-L", name: "Ribbed Socks · White / L", image: img("soc-wht"), orderId: "ORD-ABC-12" },
      { sku: "AC-CAB-USC", name: "USB-C Cable 1m", image: img("cab-usc"), orderId: "ORD-DEF-44" },
      { sku: "VB-SER-30", name: "Vitamin C Serum 30ml", image: img("ser-30"), orderId: "ORD-DEF-44" },
      { sku: "LL-PIL-STD", name: "Pillow Cover · Std", image: img("pil-std"), orderId: "ORD-GHI-77" },
      { sku: "LL-TOW-BTH", name: "Bath Towel · Charcoal", image: img("tow-bth"), orderId: "ORD-GHI-77" },
    ],
  },
  {
    id: "ST-9002",
    toteId: "TOTE-B-207",
    wave: "WAVE-0612-A",
    totalItems: 3,
    totalOrders: 2,
    status: "assigned",
    items: [
      { sku: "VB-CRM-50", name: "Hydrating Cream 50ml", image: img("crm-50"), orderId: "ORD-JKL-09" },
      { sku: "NW-TSH-BLK-M", name: "Crew Tee · Black / M", image: img("tsh-blk"), orderId: "ORD-JKL-09" },
      { sku: "AC-CAB-USC", name: "USB-C Cable 1m", image: img("cab-usc"), orderId: "ORD-MNO-31" },
    ],
  },
];

export const getSortTask = (id: string) => sortTasks.find((t) => t.id === id);

// Sorted pigeonholes waiting to be emptied into a pick bin. In a live WMS this
// would come from the sortation backend; here it seeds the Empty Pigeonhole
// HHT screen.
export interface SortedPigeonhole {
  id: string;
  orderId: string;
  items: number;
  wave: string;
  sortedAgo: string;
}

export const sortedPigeonholes: SortedPigeonhole[] = [
  { id: "PW-1", orderId: "ORD-ABC-12", items: 2, wave: "WAVE-0612-A", sortedAgo: "4m ago" },
  { id: "PW-2", orderId: "ORD-DEF-44", items: 2, wave: "WAVE-0612-A", sortedAgo: "9m ago" },
  { id: "PW-3", orderId: "ORD-GHI-77", items: 2, wave: "WAVE-0612-A", sortedAgo: "12m ago" },
  { id: "PW-5", orderId: "ORD-JKL-09", items: 3, wave: "WAVE-0611-C", sortedAgo: "18m ago" },
  { id: "PW-8", orderId: "ORD-MNO-31", items: 1, wave: "WAVE-0611-C", sortedAgo: "26m ago" },
];
