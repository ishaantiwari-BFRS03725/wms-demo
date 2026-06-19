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
