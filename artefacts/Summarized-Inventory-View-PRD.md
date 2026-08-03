# PRD: Summarized Inventory View

## 1. Problem
The [Detailed Inventory View](../src/routes/_wms.detailed-inventory-view.tsx) shows inventory at lot/bin/LPN grain across five stages (Receiving, Storage, Outward Processing, Cancel, Missing) — the right tool for tracing a specific unit, but too granular for a fast stock-health check. The Inventory View screen answers the simpler question a supervisor or seller asks first: **"how much of SKU X do we have, broken down by warehouse and state?"**

## 2. Goal
A single consolidated table — one row per (Warehouse × SKU × Storage Type × Inventory Type) combination — showing Total/Available/Blocked quantities, filterable and sortable, as a companion screen to the Detailed view.

## 3. Non-Goals
- Not a replacement for the Detailed Inventory View — both screens coexist.
- No write actions (adjustments, transfers) — read-only.
- No cross-warehouse aggregation — WH Name is a row dimension, not collapsed away.

## 4. Users
Warehouse supervisors and seller-ops users who need a fast stock-on-hand check without wading through lot-level noise.

## 5. Data Grain & Columns
One row per **Warehouse + SKU + Storage Type + Inventory Type** combination — a SKU can and does appear multiple times if it has stock in more than one state (e.g. SKU `600868` has separate rows for Quarantine/Bad and Virtual/Missing at `boAt_Dasna`). This is a state breakdown, not a SKU-level rollup.

| Column | Notes |
|---|---|
| WH Name | Warehouse identifier (e.g. `boAt_Dasna`) |
| SKU | Numeric SKU id |
| Description | Product name |
| Product Category | e.g. Electronics, Accessories |
| Storage Type | Sellable / Quarantine / Virtual |
| Inventory Type | Good / Bad / Missing / Cancel — "Bad" renders in red to flag it visually |
| Total Quantity | Right-aligned, numeric |
| Available Quantity | Right-aligned, numeric |
| Blocked Quantity | Right-aligned, numeric |

## 6. Screen Requirements
- **Placement**: sidebar, under Inventory, alongside "Detailed Inventory View."
- **Header**: title + subtitle ("Consolidated stock by storage type and inventory state"), search box (placeholder "Search SKU / Description / WH" — matches against every column, not just those three), a "Clear" button that appears once search or a filter is active, and a "Download Inventory" button that exports the currently filtered + sorted rows as CSV.
- **Totals summary**: a line directly under the header, above the Filters row, reading "Total Inventory: X · Available: Y" — sums of the Total Quantity and Available Quantity columns across whatever rows survive the current search + filters. Recomputes live as search/filters change; unaffected by sort order since it's a sum.
- **Filters**: single-select dropdowns for WH Name, Product Category, Storage Type, and Inventory Type. Each is a plain "column value" filter (exact match), not a range or multi-select. An active filter is visually highlighted (amber border/background). Filters and search combine with AND logic.
- **Sorting**: the three quantity columns are click-sortable. Clicking a header cycles unsorted → ascending → descending → unsorted, with an arrow icon (up/down when active, a faint up-down icon when idle) indicating state. Only one column can be sorted at a time. CSV export respects the active sort.
- **Row flagging**: rows where Inventory Type = "Bad" render that cell in red/semibold to draw the eye; no other conditional styling exists yet.
- **Footer**: "Showing X of Y records" reflecting the filtered count against the total mock dataset size.
- **Empty state**: "No matching records" row spanning the table when a filter/search combination returns nothing.

## 7. Out of Scope / Open Questions
- No drill-down from a row into the Detailed Inventory View yet
- No SKU-level rollup view (summing Total/Available/Blocked across all of a SKU's state rows) exists today — if that "one number per SKU" need still stands, it's a separate addition on top of this state-breakdown table, not a replacement for it.
- No shelf-life, ageing, or velocity-class data in this screen (that detail lives only in the Detailed view's Storage tab).
