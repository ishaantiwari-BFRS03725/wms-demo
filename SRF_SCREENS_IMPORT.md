# SRF 2.0 — Missing Screens Import Plan

Goal: add the design screens that exist in the **SRF 2.0 reference** (`~/Downloads/SRF 2.0/`)
but are **missing from the prototype**, by directly copy-pasting the design markup.
**Static mockups only — no functional JS this pass** (no real navigation, no state wiring).
Lowest effort possible.

---

## Approach (decided)

The design source is a set of `.jsx` files that share one **global scope** (concatenated bundle,
no ES imports). Screens depend on data arrays (`GATE_INBOUND`, `BILLING_CASES`, …) and a
`useApp()` context (`go`, `approvals`, `notify`, …) from `shell.jsx`.

Lowest-effort port that preserves all content:

1. **One bundle module** `src/srf/srf-screens.tsx`
   - Header: `// @ts-nocheck` + `/* eslint-disable */` + `import React, { useState } from "react";`
   - **Stubs** (replace the design runtime, no behaviour):
     - `const go = () => {};`
     - `const useApp = () => ({ go, approvals: APPROVALS, resolveApproval: () => {}, notify: () => {}, open: () => {}, close: () => {}, modal: null });`
     - `const Modal = ({ title, children, footer }) => null;` (modals never open in static mode)
   - **Concatenate** the design files (in this order; const arrow fns aren't hoisted but are
     only referenced at render time, so order is safe):
     `data.jsx`, `core-ops-data.jsx`, `returns-flows.jsx`, `dashboard.jsx`, `roles.jsx`,
     `core-ops-screens.jsx`, `detail-screens.jsx`, `handheld-screens.jsx`, `gate.jsx`,
     `reverse.jsx`, `misc.jsx`
   - **Strip** every `Object.assign(window, {…});` line (avoids SSR/`window` crash + dead refs)
   - **Append** a single `export { … }` listing the screen components used by routes
   - Files already use `className` / `style={{}}` (real JSX) → paste verbatim, `&amp;` decodes fine

2. **Scoped stylesheet** `src/srf/srf-mock.css`
   - Generated from the design's `app.css` (the screens' stylesheet).
   - `app.css` defines generic utility classes (`.flex`, `.gap-8`, `.mb-16`, `.card`, `.btn`, `.tag`,
     `.tbl`, `.row`…) that **collide with Tailwind** → must be scoped.
   - Transform: prefix every selector with `.srf-mock`; keep `:root {…}` global (vars `--bg`,`--ink`,
     `--ai`… unused by Tailwind, harmless); scope the global `*` / `html,body` / `button` rules under
     `.srf-mock` too.

3. **Route wrappers** (one tiny file per screen) `src/routes/_wms.<route>.tsx`
   - Pattern (≈8 lines each, generated in a loop):
     ```tsx
     import { createFileRoute } from "@tanstack/react-router";
     import { ScreenName } from "@/srf/srf-screens";
     import "@/srf/srf-mock.css";
     export const Route = createFileRoute("/_wms/<route>")({ component: () => (
       <div className="srf-mock"><ScreenName /></div>
     )});
     ```
   - Sidebar nav links (`src/components/wms/app-sidebar.tsx`) — **optional**, add a "Command Center"
     / "Returns" / "Admin" section so the screens are reachable. (Flag: decide whether to wire nav
     this pass or leave routes URL-only.)

---

## Screen → component → route map

### Tier 1 — Command surfaces  ✅ DONE (2026-06-19)
- [x] Supervisor dashboard — `Dashboard` (dashboard.jsx) → `/dashboard`
- [x] Network control tower — `ControlTowerHome` (roles.jsx) → `/control-tower`
- [x] Stuck orders · network — `CtStuck` (detail-screens.jsx) → `/stuck-orders`
- [x] Site performance / Manager home — `ManagerHome` (roles.jsx) → `/site-performance`
- [x] Trends — `MgrTrends` (detail-screens.jsx) → `/trends`
- [x] Alerts — `Alerts` (misc.jsx) → `/alerts`

### Tier 2 — AI agent + exceptions  ✅ DONE (2026-06-19)
- [x] Agent health — `MgrAgents` (detail-screens.jsx) → `/agent-health`
- [x] Agent directory — `Agents` (misc.jsx) → `/agent-directory`
- [x] Drift & feedback — `AdmDrift` (detail-screens.jsx) → `/drift-feedback`
- [x] Inbound exceptions — `InboundExceptionsScreen` (core-ops-screens.jsx) → `/inbound-exceptions`
- [x] Outbound exceptions — `OutboundExceptionsScreen` (core-ops-screens.jsx) → `/outbound-exceptions`
- [x] Incidents — `CtIncidents` (detail-screens.jsx) → `/incidents`
- [x] Recovery queue — `FinRecovery` (detail-screens.jsx) → `/recovery-queue`
- [x] Customer disputes — `FinDisputes` (detail-screens.jsx) → `/customer-disputes`

### Tier 3 — Reverse logistics + QC  ✅ DONE (2026-06-19)
- [x] Returns intake — `OpReturns` (detail-screens.jsx) → `/returns-intake`
- [x] Returns evaluation · QC — `QcReturns` (detail-screens.jsx) → `/returns-evaluation`
- [x] RTO flow — `RTOFlow` (returns-flows.jsx) → `/returns-rto`
- [x] RTV flow — `RTVFlow` (returns-flows.jsx) → `/returns-rtv`
- [x] CIR flow — `CIRFlow` (returns-flows.jsx) → `/returns-cir`
- [x] QC station — `QCHome` (roles.jsx) → `/qc-station`
- [x] Cycle count & audit — `CycleCountScreen` (core-ops-screens.jsx) → `/cycle-count`

### Tier 4 — Admin / governance / misc  ✅ DONE (2026-06-19)
- [x] Users & roles — `AdmUsers` (detail-screens.jsx) → `/users-roles`
- [x] Policies & thresholds — `AdmPolicies` (detail-screens.jsx) → `/policies`
- [x] Master data — `AdmMaster` (detail-screens.jsx) → `/master-data`
- [x] Audit log — `AdmAudit` (detail-screens.jsx) → `/audit-log`
- [x] Admin · platform health — `AdminHome` (roles.jsx) → `/admin`
- [x] Billing leakage — `FinanceHome` (roles.jsx) → `/billing-leakage`
- [x] Carrier scorecards — `CtCarriers` (detail-screens.jsx) → `/carrier-scorecards`
- [x] Vendor scorecards — `FinScorecards` (detail-screens.jsx) → `/vendor-scorecards`
- [x] Gatepass log — `GatepassScreen` (core-ops-screens.jsx) → `/gatepass-log`
- [x] Floor handhelds — `FloorScreens` (handheld-screens.jsx) → `/floor-handhelds`

(30 screens. Already in prototype, so excluded: gate entry, unloading, putaway, picklist gen,
sortation, pack, dispatch, manifest, GRN, approvals inbox, bin map, returns GRN.)

---

## Build checklist
- [ ] Create `src/srf/srf-mock.css` (scoped from `app.css`)
- [ ] Create `src/srf/srf-screens.tsx` (concatenated + stubbed bundle, `@ts-nocheck`, exports)
- [ ] Generate 30 route wrapper files `src/routes/_wms.<route>.tsx`
- [ ] (Decision) wire sidebar nav links for the new screens — yes / no
- [ ] `npx tsc --noEmit` clean (bundle is `@ts-nocheck`; check route files compile)
- [ ] Spot-check 2–3 routes render in browser (user runs preview)
- [ ] Append CHANGELOG.md entry

---

## Open questions for go-ahead
1. **Scope confirm** — add **all 30** screens, or only Tier 1–2 first?
2. **Sidebar nav** — add menu links now, or leave routes URL-only this pass?
3. **JetBrains Mono** is already imported by the prototype (Phase 1) — reuse it (no new font load). OK?
