# Screen & Module Map

A quick reference of every screen in the app and where its code lives. Routes use
TanStack Router file-based routing in `src/routes/` — the `_wms.` prefix means the
screen renders inside the WMS shell (`_wms.tsx`, which mounts the sidebar +
top bar). A `.$param` segment is a dynamic route.

There are two kinds of screen:

- **Native screens** — fully built React screens with their own logic and mock
  data from `src/lib/wms/`.
- **SRF mocks** — static design mockups imported from the SRF 2.0 design system.
  Each route is a thin wrapper that renders a component out of
  `src/srf/srf-screens.tsx` inside a `.srf-mock` div (styles in
  `src/srf/srf-mock.css`). Non-functional / display only.

---

## Shell & shared code

| Piece | File |
| --- | --- |
| App shell (sidebar + top bar layout) | `src/routes/_wms.tsx` |
| Sidebar nav (sections + icons) | `src/components/wms/app-sidebar.tsx` |
| Shared page header | `src/components/wms/page-header.tsx` |
| Status badge | `src/components/wms/status-badge.tsx` |
| Order journey stepper | `src/components/wms/order-journey-stepper.tsx` |
| Placeholder screen | `src/components/wms/placeholder.tsx` |
| UI primitives (shadcn) | `src/components/ui/` |
| Design tokens / global CSS | `src/styles.css` |
| Mock data | `src/lib/wms/*.ts` |
| SRF mock screens + CSS | `src/srf/srf-screens.tsx`, `src/srf/srf-mock.css` |

---

## Command Center  *(SRF mocks)*

| Screen | Route file | Data / source |
| --- | --- | --- |
| Dashboard | `_wms.dashboard.tsx` | `srf-screens.tsx` |
| Control Tower | `_wms.control-tower.tsx` | `srf-screens.tsx` |
| Stuck Orders | `_wms.stuck-orders.tsx` | `srf-screens.tsx` |
| Site Performance | `_wms.site-performance.tsx` | `srf-screens.tsx` |
| Trends | `_wms.trends.tsx` | `srf-screens.tsx` |
| Alerts | `_wms.alerts.tsx` | `srf-screens.tsx` |

## AI Agents  *(SRF mocks)*

| Screen | Route file |
| --- | --- |
| Agent Health | `_wms.agent-health.tsx` |
| Agent Directory | `_wms.agent-directory.tsx` |
| Drift & Feedback | `_wms.drift-feedback.tsx` |

## Exceptions  *(SRF mocks)*

| Screen | Route file |
| --- | --- |
| Inbound Exceptions | `_wms.inbound-exceptions.tsx` |
| Outbound Exceptions | `_wms.outbound-exceptions.tsx` |
| Incidents | `_wms.incidents.tsx` |
| Recovery Queue | `_wms.recovery-queue.tsx` |
| Customer Disputes | `_wms.customer-disputes.tsx` |

## Reverse & QC  *(SRF mocks)*

| Screen | Route file |
| --- | --- |
| Returns Intake | `_wms.returns-intake.tsx` |
| Returns Evaluation | `_wms.returns-evaluation.tsx` |
| RTO · Origin | `_wms.returns-rto.tsx` |
| RTV · Vendor | `_wms.returns-rtv.tsx` |
| CIR · Customer | `_wms.returns-cir.tsx` |
| QC Station | `_wms.qc-station.tsx` |
| Cycle Count | `_wms.cycle-count.tsx` |

## Admin & Governance  *(SRF mocks)*

| Screen | Route file |
| --- | --- |
| Users & Roles | `_wms.users-roles.tsx` |
| Policies | `_wms.policies.tsx` |
| Master Data | `_wms.master-data.tsx` |
| Audit Log | `_wms.audit-log.tsx` |
| Platform Health | `_wms.admin.tsx` |
| Billing Leakage | `_wms.billing-leakage.tsx` |
| Carrier Scorecards | `_wms.carrier-scorecards.tsx` |
| Vendor Scorecards | `_wms.vendor-scorecards.tsx` |
| Gatepass Log | `_wms.gatepass-log.tsx` |

## Devices  *(SRF mock)*

| Screen | Route file |
| --- | --- |
| Floor Handhelds | `_wms.floor-handhelds.tsx` |

---

## Outbound  *(native screens)*

| Screen | Route file | Mock data |
| --- | --- | --- |
| Orders (list) | `_wms.orders.index.tsx` | `lib/wms/mock-data.ts` |
| Order detail | `_wms.orders.$orderNo.tsx` | `lib/wms/mock-data.ts` |
| Wave Creation | `_wms.wave-creation.tsx` | inline |
| Pick (picklists) | `_wms.pick.index.tsx` | `lib/wms/picklist-data.ts` |
| Pick detail | `_wms.pick.$picklistId.tsx` | `lib/wms/picklist-data.ts` |
| View Picklists | `_wms.view-picklist.index.tsx` | `lib/wms/picklist-data.ts` |
| View Picklist detail | `_wms.view-picklist.$picklistId.tsx` | `lib/wms/picklist-data.ts` |
| Sort (tasks) | `_wms.sort.index.tsx` | `lib/wms/sort-data.ts` |
| Sort detail | `_wms.sort.$taskId.tsx` | `lib/wms/sort-data.ts` |
| Putwall | `_wms.putwall.tsx` | inline |
| Pack | `_wms.pack.tsx` | `lib/wms/pack-data.ts` |
| View Packlists | `_wms.view-pack.index.tsx` | `lib/wms/pack-data.ts` |
| View Packlist detail | `_wms.view-pack.$packlistId.tsx` | `lib/wms/pack-data.ts` |
| Create Manifest | `_wms.manifest.tsx` | `lib/wms/manifest-data.ts` |
| View Manifests | `_wms.view-manifest.tsx` | `lib/wms/manifest-data.ts` |
| Dispatch | `_wms.dispatch.tsx` | `lib/wms/dispatch-data.ts` |
| View Shiplists | `_wms.view-dispatch.tsx` | `lib/wms/dispatch-data.ts` |

## Inbound  *(native screens)*

| Screen | Route file | Mock data |
| --- | --- | --- |
| Gate Entry | `_wms.gate-entry.tsx` | `lib/wms/gate-entry-data.ts` |
| Unloading | `_wms.unloading.tsx` | `lib/wms/inbound-data.ts` |
| GRN | `_wms.grn.tsx` | `lib/wms/grn-data.ts` |
| Sales Return GRN | `_wms.sales-return-grn.tsx` | `lib/wms/grn-data.ts` |
| Putaway | `_wms.putaway.tsx` | `lib/wms/inbound-data.ts` |

## Inventory  *(native screens)*

| Screen | Route file | Mock data |
| --- | --- | --- |
| Detailed Inventory View | `_wms.detailed-inventory-view.tsx` | inline |
| Item Movement | `_wms.item-movement.tsx` | inline |
| Create Movement | `_wms.movement-task-create.tsx` | inline |
| Bin Inventory | `_wms.item-info-update.tsx` | inline |
| Kit Mapping | `_wms.kit-mapping.tsx` | `lib/wms/kit-data.ts` |
| Kit Order | `_wms.kit-order.tsx` | `lib/wms/kit-data.ts` |
| Kitting | `_wms.kitting.tsx` | `lib/wms/kit-data.ts` |
| Approvals | `_wms.approvals.tsx` | inline |
| Replenishment | `_wms.replenishment.tsx` | inline |
| Replenishment Setup | `_wms.replenishment-setup.tsx` | inline |
| Density Heatmap (Slotting) | `_wms.slotting.tsx` | inline |
| Slotting Config | `_wms.slotting-config.tsx` | inline |

## Masters / Reports  *(native screens)*

| Screen | Route file |
| --- | --- |
| Dock Management | `_wms.dock-management.tsx` |
| Reports | `_wms.reports.tsx` |
