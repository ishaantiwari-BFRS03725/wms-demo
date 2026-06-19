export interface ManifestCombo {
  seller: string;
  channel: "Amazon" | "Flipkart" | "Shopify" | "Myntra";
  courier: "Delhivery" | "BlueDart" | "XpressBees" | "Ecom Express";
}

// Pool of combinations. New scans deterministically map into one of these,
// so AWBs distribute across piles naturally during a demo.
export const comboPool: ManifestCombo[] = [
  { seller: "Northwind Apparel", channel: "Amazon", courier: "Delhivery" },
  { seller: "Verde Beauty", channel: "Flipkart", courier: "BlueDart" },
  { seller: "Loom & Linen", channel: "Shopify", courier: "XpressBees" },
  { seller: "Acme Electronics", channel: "Myntra", courier: "Ecom Express" },
  { seller: "Acme Electronics", channel: "Amazon", courier: "BlueDart" },
];

export const channelStyles: Record<ManifestCombo["channel"], string> = {
  Amazon: "bg-orange-50 text-orange-700 border-orange-300",
  Flipkart: "bg-blue-50 text-blue-700 border-blue-300",
  Shopify: "bg-green-50 text-green-700 border-green-300",
  Myntra: "bg-pink-50 text-pink-700 border-pink-300",
};

export const courierStyles: Record<ManifestCombo["courier"], string> = {
  Delhivery: "bg-red-50 text-red-700 border-red-300",
  BlueDart: "bg-sky-50 text-sky-700 border-sky-300",
  XpressBees: "bg-violet-50 text-violet-700 border-violet-300",
  "Ecom Express": "bg-amber-50 text-amber-700 border-amber-300",
};

// Stable hash → same AWB always assigns to the same combo
export const assignCombo = (awb: string): ManifestCombo => {
  let h = 0;
  const s = awb.trim().toUpperCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return comboPool[Math.abs(h) % comboPool.length];
};

export const comboKey = (c: ManifestCombo) =>
  `${c.seller}|${c.channel}|${c.courier}`;

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const letterAt = (idx: number) => {
  if (idx < 26) return ALPHA[idx];
  const a = ALPHA[Math.floor(idx / 26) - 1];
  const b = ALPHA[idx % 26];
  return a + b;
};

const ID_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const genManifestId = (): string => {
  let rnd = "";
  for (let i = 0; i < 8; i++) {
    rnd += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `MNFST-${rnd}`;
};

// Deterministic barcode pattern from a string. Returns an array of bar widths
// in pixels — alternates bar / gap starting with bar.
export const barcodePattern = (seed: string): number[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 1103515245 + seed.charCodeAt(i)) | 0;
  const bars: number[] = [];
  let x = Math.abs(h);
  for (let i = 0; i < 45; i++) {
    bars.push(1 + (x & 3));
    x = (x * 1664525 + 1013904223) | 0;
    x = Math.abs(x);
  }
  return bars;
};
