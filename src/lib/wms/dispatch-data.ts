// Deterministic outcome for an AWB. Same AWB always produces the same result —
// useful for repeatable demos. Roughly 20% pre-screened exceptions.
export type AwbOutcome =
  | { status: "accepted" }
  | { status: "rejected"; reason: string };

export const awbOutcome = (awb: string): AwbOutcome => {
  let h = 0;
  const s = awb.trim().toUpperCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const mod = Math.abs(h) % 10;
  if (mod === 0) return { status: "rejected", reason: "Order cancelled by customer" };
  return { status: "accepted" };
};

// Reasons shown in the Remove-from-Shiplist dropdown — courier-side rejections
// after the shipment was already on the shiplist.
export const removalReasons = [
  "Damaged at handover",
  "Documentation mismatch",
  "Weight / dimension mismatch",
  "Service mismatch",
  "Courier capacity full",
  "Other",
] as const;

export type RemovalReason = (typeof removalReasons)[number];

const ID_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const rndChunk = (n: number) =>
  Array.from(
    { length: n },
    () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)],
  ).join("");

export const genShiplistId = (): string => `SL-${rndChunk(8)}`;
