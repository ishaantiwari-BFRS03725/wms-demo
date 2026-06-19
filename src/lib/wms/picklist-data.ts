export type PicklistStatus = "assigned" | "in_progress" | "completed";

export interface PicklistItem {
  sku: string;
  name: string;
  image: string;
  location: string;
  altLocation: string;
  quantity: number;
}

export interface Picklist {
  id: string;
  wave: string;
  zone: string;
  totalItems: number;
  totalSkus: number;
  priority: "High" | "Medium" | "Low";
  status: PicklistStatus;
  assignedTo: string;
  items: PicklistItem[];
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/240/240`;

export const picklists: Picklist[] = [
  {
    id: "PL-48201",
    wave: "WAVE-0612-A",
    zone: "Zone A",
    priority: "High",
    status: "assigned",
    assignedTo: "You",
    totalSkus: 3,
    totalItems: 6,
    items: [
      {
        sku: "NW-TSH-BLK-M",
        name: "Crew Tee · Black / M",
        image: img("tsh-blk"),
        location: "A-12-03-B2",
        altLocation: "A-14-01-B1",
        quantity: 2,
      },
      {
        sku: "NW-SOC-WHT-L",
        name: "Ribbed Socks · White / L",
        image: img("soc-wht"),
        location: "A-12-04-A1",
        altLocation: "A-15-02-C3",
        quantity: 3,
      },
      {
        sku: "AC-CAB-USC",
        name: "USB-C Cable 1m",
        image: img("cab-usc"),
        location: "A-13-01-A2",
        altLocation: "A-16-03-B1",
        quantity: 1,
      },
    ],
  },
  {
    id: "PL-48202",
    wave: "WAVE-0612-A",
    zone: "Zone B",
    priority: "Medium",
    status: "assigned",
    assignedTo: "You",
    totalSkus: 2,
    totalItems: 3,
    items: [
      {
        sku: "VB-SER-30",
        name: "Vitamin C Serum 30ml",
        image: img("ser-30"),
        location: "B-04-02-A1",
        altLocation: "B-06-01-B2",
        quantity: 1,
      },
      {
        sku: "VB-CRM-50",
        name: "Hydrating Cream 50ml",
        image: img("crm-50"),
        location: "B-04-02-A2",
        altLocation: "B-06-01-B3",
        quantity: 2,
      },
    ],
  },
  {
    id: "PL-48203",
    wave: "WAVE-0612-B",
    zone: "Zone C",
    priority: "Low",
    status: "assigned",
    assignedTo: "You",
    totalSkus: 2,
    totalItems: 4,
    items: [
      {
        sku: "LL-PIL-STD",
        name: "Pillow Cover · Std",
        image: img("pil-std"),
        location: "C-08-01-B1",
        altLocation: "C-09-02-A2",
        quantity: 2,
      },
      {
        sku: "LL-TOW-BTH",
        name: "Bath Towel · Charcoal",
        image: img("tow-bth"),
        location: "C-08-02-A1",
        altLocation: "C-10-01-B3",
        quantity: 2,
      },
    ],
  },
];

export const getPicklist = (id: string) => picklists.find((p) => p.id === id);
