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

export interface DispatchAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
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
  shipTo?: DispatchAddress;
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
  {
    // Large multi-SKU B2B order for testing multi-box packing.
    orderNo: "WMS-100500",
    extOrderNo: "DMART-PO-88120",
    orderType: "B2B",
    channel: "Amazon",
    seller: "D-Mart Wholesale",
    courier: "Delhivery",
    sla: "Standard",
    paymentMode: "Prepaid",
    shipTo: {
      name: "D-Mart DC — Bhiwandi",
      address: "Avenue Supermarts Ltd, Warehouse No. 7, Kalher Industrial Area, Bhiwandi",
      city: "Thane",
      state: "Maharashtra",
      pincode: "421302",
    },
    items: [
      {
        sku: "FMCG-ATTA-5KG",
        ean: "8901000000011",
        name: "Whole Wheat Atta 5kg",
        qty: 8,
        image: img("atta-5kg"),
        brand: "Aashirvaad",
        color: "Brown",
        size: "5 kg",
        weight: "5.0 kg",
        mrp: "₹255",
      },
      {
        sku: "FMCG-RICE-5KG",
        ean: "8901000000028",
        name: "Basmati Rice 5kg",
        qty: 6,
        image: img("rice-5kg"),
        brand: "India Gate",
        color: "White",
        size: "5 kg",
        weight: "5.0 kg",
        mrp: "₹610",
      },
      {
        sku: "FMCG-OIL-1L",
        ean: "8901000000035",
        name: "Sunflower Oil 1L",
        qty: 10,
        image: img("oil-1l"),
        brand: "Fortune",
        color: "Yellow",
        size: "1 L",
        weight: "0.95 kg",
        mrp: "₹145",
      },
      {
        sku: "FMCG-SUGAR-1KG",
        ean: "8901000000042",
        name: "Refined Sugar 1kg",
        qty: 12,
        image: img("sugar-1kg"),
        brand: "Madhur",
        color: "White",
        size: "1 kg",
        weight: "1.0 kg",
        mrp: "₹52",
      },
      {
        sku: "FMCG-SALT-1KG",
        ean: "8901000000059",
        name: "Iodized Salt 1kg",
        qty: 10,
        image: img("salt-1kg"),
        brand: "Tata",
        color: "White",
        size: "1 kg",
        weight: "1.0 kg",
        mrp: "₹28",
      },
      {
        sku: "FMCG-TEA-500",
        ean: "8901000000066",
        name: "Tea Leaves 500g",
        qty: 5,
        image: img("tea-500"),
        brand: "Red Label",
        color: "Brown",
        size: "500 g",
        weight: "0.5 kg",
        mrp: "₹275",
      },
      {
        sku: "FMCG-BISC-PK",
        ean: "8901000000073",
        name: "Marie Biscuits (Pack of 6)",
        qty: 15,
        image: img("bisc-pk"),
        brand: "Britannia",
        color: "Yellow",
        size: "6 × 120 g",
        weight: "0.75 kg",
        mrp: "₹90",
      },
      {
        sku: "FMCG-SOAP-4PK",
        ean: "8901000000080",
        name: "Bath Soap (4-pack)",
        qty: 9,
        image: img("soap-4pk"),
        brand: "Lifebuoy",
        color: "Red",
        size: "4 × 100 g",
        weight: "0.42 kg",
        mrp: "₹120",
      },
      {
        sku: "FMCG-SHMP-1L",
        ean: "8901000000097",
        name: "Anti-Dandruff Shampoo 1L",
        qty: 4,
        image: img("shmp-1l"),
        brand: "Clinic Plus",
        color: "Green",
        size: "1 L",
        weight: "1.05 kg",
        mrp: "₹640",
      },
      {
        sku: "FMCG-DETRG-2KG",
        ean: "8901000000103",
        name: "Detergent Powder 2kg",
        qty: 7,
        image: img("detrg-2kg"),
        brand: "Surf Excel",
        color: "Blue",
        size: "2 kg",
        weight: "2.0 kg",
        mrp: "₹340",
      },
      {
        sku: "FMCG-TOOTH-150",
        ean: "8901000000110",
        name: "Toothpaste 150g",
        qty: 6,
        image: img("tooth-150"),
        brand: "Colgate",
        color: "White",
        size: "150 g",
        weight: "0.18 kg",
        mrp: "₹95",
      },
      {
        sku: "FMCG-NOODLE-12",
        ean: "8901000000127",
        name: "Instant Noodles (12-pack)",
        qty: 8,
        image: img("noodle-12"),
        brand: "Maggi",
        color: "Yellow",
        size: "12 × 70 g",
        weight: "0.9 kg",
        mrp: "₹168",
      },
    ],
  },
];

const toteOrderMap: Record<string, PackOrder> = {
  "TOTE-A-114": packOrders[0],
  "TOTE-B-207": packOrders[1],
  "TOTE-C-301": packOrders[2],
  "TOTE-D-408": packOrders[3],
  "TOTE-B2B-500": packOrders[4],
  "PLT-B2B-500": packOrders[4],
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
