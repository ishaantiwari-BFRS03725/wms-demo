const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

export interface PackItem {
  sku: string;
  ean?: string;
  name: string;
  qty: number;
  image: string;
  brand?: string;
  color?: string;
  size?: string;
  weight?: string;
  lot?: string;
  expiry?: string;
  mrp?: string;
}

export interface PackOrder {
  orderNo: string;
  extOrderNo: string;
  orderType: "B2C" | "B2B";
  channel: "Amazon" | "Flipkart" | "Shopify" | "Myntra";
  seller: string;
  courier: string;
  sla: "Same Day" | "Next Day" | "Standard";
  paymentMode: "Prepaid" | "COD";
  items: PackItem[];
}

export interface PackagingMaterial {
  id: string;
  name: string;
  description: string;
}

export const channelPackaging: Record<string, PackagingMaterial> = {
  Amazon: {
    id: "PKG-AMZ-POLY-A4",
    name: "Amazon Poly Bag A4",
    description: "Amazon branded poly mailer, A4",
  },
  Flipkart: {
    id: "PKG-FK-GREEN-M",
    name: "Flipkart Green Bag M",
    description: "Flipkart branded poly bag, medium",
  },
  Shopify: {
    id: "PKG-BOX-STD-M",
    name: "Standard Brown Box M",
    description: "Corrugated box, 25×20×15 cm",
  },
  Myntra: {
    id: "PKG-MYN-POLY-L",
    name: "Myntra Poly Bag L",
    description: "Myntra branded poly mailer, large",
  },
};

export const allPackagingIds = new Set(
  Object.values(channelPackaging).map((p) => p.id),
);

const packOrders: PackOrder[] = [
  {
    orderNo: "WMS-100235",
    extOrderNo: "FK-77231",
    orderType: "B2C",
    channel: "Flipkart",
    seller: "Acme Electronics",
    courier: "BlueDart",
    sla: "Same Day",
    paymentMode: "COD",
    items: [
      {
        sku: "AC-EAR-PRO",
        ean: "8901234567890",
        name: "Wireless Earbuds Pro",
        qty: 1,
        image: img("ear-pro"),
        brand: "Acme",
        color: "Black",
        size: "One Size",
        weight: "75 g",
        mrp: "₹4,999",
      },
      {
        sku: "AC-CHG-65W",
        ean: "8901234567891",
        name: "65W GaN Charger",
        qty: 1,
        image: img("chg-65w"),
        brand: "Acme",
        color: "White",
        size: "One Size",
        weight: "120 g",
        mrp: "₹2,499",
      },
    ],
  },
  {
    orderNo: "WMS-100240",
    extOrderNo: "SHP-55189",
    orderType: "B2C",
    channel: "Shopify",
    seller: "Verde Beauty",
    courier: "XpressBees",
    sla: "Next Day",
    paymentMode: "Prepaid",
    items: [
      {
        sku: "VB-SER-30",
        ean: "8904567891230",
        name: "Vitamin C Serum 30ml",
        qty: 1,
        image: img("ser-30"),
        brand: "Verde",
        size: "30 ml",
        weight: "45 g",
        lot: "LOT-2024-089",
        expiry: "30 Jun 2026",
        mrp: "₹899",
      },
      {
        sku: "VB-CRM-50",
        ean: "8904567891231",
        name: "Hydrating Cream 50ml",
        qty: 1,
        image: img("crm-50"),
        brand: "Verde",
        size: "50 ml",
        weight: "80 g",
        lot: "LOT-2024-091",
        expiry: "31 Dec 2026",
        mrp: "₹1,299",
      },
      {
        sku: "VB-SUN-50",
        ean: "8904567891232",
        name: "Mineral Sunscreen 50ml",
        qty: 1,
        image: img("sun-50"),
        brand: "Verde",
        size: "50 ml",
        weight: "75 g",
        lot: "LOT-2024-095",
        expiry: "28 Feb 2027",
        mrp: "₹699",
      },
    ],
  },
  {
    orderNo: "WMS-100234",
    extOrderNo: "AMZ-IN-99812",
    orderType: "B2C",
    channel: "Amazon",
    seller: "Northwind Apparel",
    courier: "Delhivery",
    sla: "Next Day",
    paymentMode: "Prepaid",
    items: [
      {
        sku: "NW-TSH-BLK-M",
        ean: "8907654321012",
        name: "Crew Tee Black / M",
        qty: 2,
        image: img("tsh-blk"),
        brand: "Northwind",
        color: "Black",
        size: "M",
        weight: "220 g",
        mrp: "₹1,499",
      },
      {
        sku: "NW-SOC-WHT-L",
        ean: "8907654321013",
        name: "Ribbed Socks White / L",
        qty: 1,
        image: img("soc-wht"),
        brand: "Northwind",
        color: "White",
        size: "L",
        weight: "80 g",
        mrp: "₹399",
      },
    ],
  },
  {
    orderNo: "WMS-100237",
    extOrderNo: "MYN-31204",
    orderType: "B2C",
    channel: "Myntra",
    seller: "Northwind Apparel",
    courier: "Ecom Express",
    sla: "Next Day",
    paymentMode: "Prepaid",
    items: [
      {
        sku: "NW-JKT-NVY-L",
        ean: "8907654321014",
        name: "Bomber Jacket Navy / L",
        qty: 1,
        image: img("jkt-nvy"),
        brand: "Northwind",
        color: "Navy",
        size: "L",
        weight: "650 g",
        mrp: "₹4,499",
      },
    ],
  },
];

const toteOrderMap: Record<string, PackOrder> = {
  "TOTE-A-114": packOrders[0],
  "TOTE-B-207": packOrders[1],
  "TOTE-C-301": packOrders[2],
  "TOTE-D-408": packOrders[3],
};

export const getOrderByTote = (toteId: string): PackOrder | null =>
  toteOrderMap[toteId.trim().toUpperCase()] ?? null;

export const slaDeadline = (sla: PackOrder["sla"]): string => {
  const d = new Date();
  if (sla === "Same Day") {
    d.setHours(23, 59, 0, 0);
  } else if (sla === "Next Day") {
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
  } else {
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 0, 0);
  }
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
