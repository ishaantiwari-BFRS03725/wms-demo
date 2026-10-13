// Demo data for the USN-tracking GRN flow. Layers unit-level serial (USN)
// capture on top of the baseline box-level GRN data — the box/ASN/seller
// resolution is identical, only the per-item USN-tracked flag is added.
import {
  boxConsignment as baseBoxConsignment,
  GRN_TASKS as BASE_TASKS,
  genGrnDocId,
  genUsn as genItemUsn,
  genWid,
  binQcType,
  grnBarcodePattern,
  type GrnItem,
  type BoxConsignment,
} from "./grn-data";

export type UsnMode = "wms" | "vendor";

export interface UsnGrnItem extends GrnItem {
  usnTracked: boolean;
}

export interface UsnBoxConsignment extends Omit<BoxConsignment, "items"> {
  items: UsnGrnItem[];
}

// Electronics/serialized SKUs are USN-tracked; apparel/consumables aren't —
// mirrors how warehouses typically decide what gets serial tracking.
const USN_TRACKED_PREFIX = "EL-";

export const usnBoxConsignment = (boxId: string): UsnBoxConsignment => {
  const base = baseBoxConsignment(boxId);
  return {
    ...base,
    items: base.items.map((it) => ({
      ...it,
      usnTracked: it.sku.startsWith(USN_TRACKED_PREFIX),
    })),
  };
};

export const USN_GRN_TASKS = BASE_TASKS;

const hash = (s: string) => {
  let h = 0;
  const v = s.trim().toUpperCase();
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// The USN mode (WMS-generated vs Vendor-attached) is a per-table setting the
// Warehouse Manager configures — derived here so scanning a given QC table
// always resolves to the same mode. A demo toggle lets the operator flip it
// without re-scanning to show both branches.
export const usnModeForTable = (tableId: string): UsnMode =>
  hash(tableId) % 2 === 0 ? "wms" : "vendor";

export const usnModeLabel = (m: UsnMode) =>
  m === "wms" ? "WMS-generated · Bulk" : "Vendor-attached";

export { genGrnDocId, genItemUsn, genWid, binQcType, grnBarcodePattern };
