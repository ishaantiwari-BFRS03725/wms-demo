# SRF 2.0 Design Migration

Migrating the OrderFlow Manager prototype to match the SRF 2.0 design system.

**Source**: `/Users/ishaantiwari/Downloads/SRF 2.0.zip`  
**Reference files**: `app.css`, `styles.css`, `components/shell.jsx`, `components/dashboard.jsx`

---

## Design System Summary (SRF 2.0)

| Token | Value |
|---|---|
| Background | `#f5f3ee` (warm off-white) |
| Elevated bg | `#eeebe3` |
| Panel (cards) | `#ffffff` |
| Primary ink | `#1a1a1a` |
| Secondary ink | `#555` |
| Tertiary ink | `#8a8a85` |
| Border light | `#e2dfd5` |
| Border medium | `#d0ccbf` |
| Sidebar bg | `#1f1d17` (dark brown-black) |
| AI accent | `#b8751f` (amber) |
| AI bg | `#fbf0dc` |
| Risk/error | `#b5321f` |
| OK/success | `#2e7a4e` |
| Warn | `#a86b1a` |
| System/blue | `#2d5aa8` |
| Border radius | 2–4px (sharp, utilitarian — no rounded-full) |
| Sans font | Helvetica Neue, Helvetica, Arial |
| Mono font | JetBrains Mono (labels, tags, table headers, meta) |
| Base font size | 13px |

**Key style rules:**
- All section labels, table headers, tags → monospace, uppercase, letter-spacing
- Tags: dot prefix (`::before` circle), 2px radius, border, `font-size: 9.5px`
- Cards: `border-radius: 4px`, `1px solid border`, no shadows
- Buttons: flat, `1px solid`, `border-radius: 4px`
- Primary button: dark `#1f1d17` bg, white text
- Tables: monospace `th`, warm alt row bg, no outer border

---

## Phases

### Phase 1 — Foundation (CSS Design Tokens + Global Styles)
> Touches every screen. Do this first before any screen work.

- [x] **1.1** Update `src/styles.css` — remap CSS variables to SRF 2.0 warm palette:
  - `--background` → `#f5f3ee`
  - `--card` → `#ffffff`
  - `--muted` → `#eeebe3`
  - `--border` → `#e2dfd5`
  - `--foreground` → `#1a1a1a`
  - `--muted-foreground` → `#8a8a85`
  - `--primary` → `#1f1d17`
  - `--radius` → `0.25rem` (4px — sharp corners)
  - Sidebar vars → dark theme (`#1f1d17`, warm text)
- [x] **1.2** Add SRF semantic tokens: `--ai`, `--ai-bg`, `--ai-ring`, `--risk`, `--risk-bg`, `--ok`, `--ok-bg`, `--warn`, `--warn-bg`, `--sys`, `--sys-bg`
- [x] **1.3** Add JetBrains Mono font import (Google Fonts or local)
- [x] **1.4** Global base styles: `font-family: 'Helvetica Neue'`, `font-size: 13px`, `line-height: 1.5`
- [x] **1.5** Update shadcn button variants to match SRF style (flat, `border-radius: 4px`, primary = dark fill)
- [x] **1.6** Update shadcn Card to match (warm bg, 4px radius, `1px solid var(--border)`)
- [x] **1.7** Update shadcn Badge → SRF tag style (mono, uppercase, dot prefix, 2px radius) — added `ok`/`warn`/`sys`/`ai` variants
- [x] **1.8** Update table base styles (monospace `th`, warm header bg, compact row padding)

---

### Phase 2 — Shell (Sidebar + Top Bar + Layout wrapper)
> Affects every page. Do after Phase 1.

- [x] **2.1** **Sidebar** (`app-sidebar.tsx`): dark theme driven by sidebar tokens (Phase 1); brand → "Shiprocket" bold + "OMS · WMS" mono caps, amber icon chip; section headers → mono 10px uppercase tracking; active/hover via tokens; sharp radii
- [x] **2.2** **Top bar**: elevated warm bg (`bg-muted`), mono uppercase site label (Site BLR-01), flat white search bar with ⌘K kbd, flat bordered tools buttons (Alerts/Approvals/Copilot) with amber mono count pills
- [ ] **2.3** **Page padding**: `padding: 22px 28px 60px` — applied per-screen during Phase 3
- [ ] **2.4** **Page header** (h1): `font-size: 22px`, `font-weight: 500`, mono subtitle — applied per-screen during Phase 3

---

### Phase 3 — Core Screens (High-traffic, high-visibility)

> **Carried over from Phase 2 — apply to every screen as it is migrated:**
> - [~] **2.3** Page padding `22px 28px 60px` (replace `p-6`) — done on Orders + Wave Creation; pending other screens
> - [x] **2.4** Page header: h1 22px / weight 500 / `-0.01em`, mono uppercase subtitle — handled centrally via `PageHeader` component

#### 3.1 — Dashboard / Home (`index.tsx`) — **N/A** (`/` just redirects to `/orders`; no dashboard screen in this app)

#### 3.2 — Orders (`orders.index.tsx`, `orders.$orderNo.tsx`) ✅
- [x] Shared `PageHeader` → SRF (22px/500 h1, mono uppercase subtitle, 28px padding) — propagates to all screens
- [x] Shared `StatusBadge` → SRF tag system (mono, dot prefix, 2px radius, semantic colors) — propagates to all screens
- [x] Order pool table → mono headers, sharp card, warm header bg, mono status tabs (no rounded-full)
- [x] Order type & filter pills → SRF tags; SRF page padding
- [x] Order detail cards → flat card, mono meta rows, sharp channel/status chips, mono section headers, "Now" tag

#### 3.3 — Wave Creation (`wave-creation.tsx`) ✅
- [x] Wave cards → flat border (Card now SRF), mono meta row
- [x] Release mode + active badges → SRF tag style (no rounded-full, mono uppercase, semantic colors)
- [x] Sheet form → section/sub-section headers in mono uppercase
- [x] Filter chips (RadioChip/FilterChip) → `4px` radius, flat active style
- [x] Picklist type radio cards → flat bordered option cards (4px); SRF page header/padding

#### 3.4 — Pick (`pick.index.tsx`, `pick.$picklistId.tsx`) ✅
- [x] Picklist list → SRF priority tags (mono, dot, semantic risk/warn)
- [x] Status/priority tags → SRF tags
- [x] Detail scan flow → sharp shell (rounded-md, no shadow), mono labels/subtitle, mono count pill, sharp progress bar

#### 3.5 — Pack (`pack.tsx`) ✅
- [x] Mono uppercase section labels + sharp progress bars
- [x] Adherence pill → SRF semantic (ok/warn/risk), mono; Damaged pill → SRF risk tag
- [x] Channel chips → SRF semantic tokens, 4px mono; QC image → rounded-md

#### 3.6 — GRN / Receiving (`grn.tsx`) ✅
- [x] GRN table → mono headers (global) + mono section labels
- [x] Line item / good-bad / mode status → SRF sharp tags (mono, semantic)
- [x] Scan/camera boxes → rounded-md; camera REC dots intentionally kept round

#### 3.7 — Gate Entry (`gate-entry.tsx`) ✅
- [x] Mono uppercase labels throughout
- [x] Community / Activity / Open / seller-count tags → SRF sharp mono tags
- [x] Dashed option/recommendation boxes → rounded-md; flat toggles (no shadow)

#### 3.8 — Putaway (`putaway.tsx`) ✅
- [x] Sharp shell (rounded-md, no shadow), mono labels
- [x] Storage/Holding pills → SRF sharp mono tags; orange → warn tokens

#### 3.9 — Approvals (`approvals.tsx`) ✅
- [x] Approval cards → flat SRF Card, mono labels; StatTiles rounded-md
- [x] Status filter tabs → flat underline (not pill); local StatusBadge uses shared SRF Badge

#### 3.10 — Kitting (`kitting.tsx`, `kit-order.tsx`, `kit-mapping.tsx`) ✅
- [x] Kit order tables → mono headers (global), sharp containers (rounded-md)
- [x] Status tags (Open/Picked/Kitting/Putaway) → SRF semantic mono tags
- [x] Callout banners → semantic ok/risk/warn tokens; progress bars sharp; count pills mono 3px

---

### Phase 4 — Slotting Module

#### 4.1 — Bin Density Heatmap (`slotting.tsx`) ✅
- [x] KPI tiles → SRF `.tile` style (mono label, large value)
- [x] Zone tabs → flat bordered buttons, not rounded-full pills
- [x] Heatmap cells → sharp corners (2px radius)
- [x] Density filter chips → flat SRF style
- [x] Detail panel → flat `.card`, mono labels

#### 4.2 — Slotting Config (`slotting-config.tsx`) ✅
- [x] Tab bar → flat underline tabs (not rounded pill tabs)
- [x] Section headers → mono, uppercase, border-bottom
- [x] Lookback selects → flat SRF select style
- [x] Golden zone level toggles → flat bordered buttons (4px)
- [x] Strategy rule cards → flat, mono step badge; Active/Inactive → SRF ok-tag
- [x] Decision flow nodes → flat, sharp-cornered boxes; semantic action colors
- [x] Summary sentence footer → amber-rule callout

---

### Phase 5 — Secondary Screens

> **One screen per item — migrate, verify, check off, then move to the next.**
> Note: a global mono-label batch (`uppercase tracking-wide/wider` → `font-mono … tracking-[0.06em/0.08em]`) was already applied across all screens 5.3–5.18; each still needs its own shape/color pass (rounded-full/-lg/-xl → SRF radii, legacy Tailwind palette → semantic tokens, pills → SRF tags).

- [x] **5.1** — Manifest (`manifest.tsx`) — sharp shell/tiles (rounded-md), dashed box, mono labels
- [x] **5.2** — View Manifest (`view-manifest.tsx`) — STATE_BADGE → semantic (warn/ok), table rounded-md no shadow, tab/filter count pills mono 3px, status badges → SRF tags
- [x] **5.3** — Dispatch (`dispatch.tsx`) — mono labels; Removed pill → SRF tag, count pill → mono 3px, dashed box → rounded-md; success-icon circle + status dot intentionally kept round
- [x] **5.4** — View Dispatch (`view-dispatch.tsx`) — filter count pill → mono 3px, table → rounded-md no shadow, Closed badge → SRF ok tag
- [x] **5.5** — Replenishment (`replenishment.tsx`) — hand-rolled header → shared `PageHeader` (mono subtitle) + `p-6` body; filter count pill → mono 3px; legacy hex sparkline tones (blue/violet/amber) → semantic sys/ok/warn; delta arrows `text-green-600/red-600` → `text-ok/text-risk`
- [x] **5.6** — Replenishment Setup (`replenishment-setup.tsx`) — header → shared `PageHeader` (back-link moved into body); legacy green/amber/red palette → semantic ok/warn/risk (file icon, success banner, error box, Stat tones); `rounded-lg` → `rounded-md`, dead Toggle `shadow-sm` removed
- [x] **5.7** — Unloading (`unloading.tsx`) — outer scan shell `rounded-xl`+`shadow-sm` → `rounded-md` flat; legacy `orange-*` palette (shortage exceptions, damaged-box capture, unidentified pile/badges, AwbRow, BucketTile) → `warn` tokens; `rounded-full` community/date/seller/RAN pills → sharp `rounded-[3px]`; dashed POD/sticker boxes `rounded-lg` → `rounded-md`; sticker "Shipments" label → mono
- [x] **5.8** — Sort index (`sort.index.tsx`) — verified clean (uses shared PageHeader, no legacy patterns)
- [x] **5.9** — Sort task (`sort.$taskId.tsx`) — suggestion card border-2+ring → semantic border, Sorting-done pill rounded-full+ring → SRF mono rounded-[3px] tag, decorative icon circles kept round
- [x] **5.10** — Reports (`reports.tsx`) — self-contained `<style>` mockup: remapped cool-navy palette → warm SRF tokens, sys-blue info accent, 12/8/9/7px radii → 4px/3px, 0.5px borders → 1px, req red → risk, primary btn → dark `#1f1d17`, field/quick labels → mono uppercase
- [x] **5.11** — Dock Management (`dock-management.tsx`) — self-contained `<style>` mockup: warm SRF palette, status green/amber/red → semantic ok/warn/risk (metrics, badges, dots), rounded-20px chips/badges → 4px/2px sharp tags, 12/8/9/6px radii → 4px/3px, table th + section/fieldset/field/metric/filter labels → mono uppercase, primary btn → dark
- [x] **5.12** — View Pack index (`view-pack.index.tsx`) — filter pill + tab count → mono rounded-[3px], table container → rounded-md (no shadow)
- [x] **5.13** — View Pack detail (`view-pack.$packlistId.tsx`) — 3 containers rounded-lg+shadow-sm → rounded-md
- [x] **5.14** — View Picklist index (`view-picklist.index.tsx`) — STATUS_BADGE semantic (Assigned→sys, Part Picked→ai, Picked→ok, Cancelled→risk) border tags, rounded-full→rounded-[3px] mono, filter/tab pills → mono
- [x] **5.15** — View Picklist detail (`view-picklist.$picklistId.tsx`) — LINE_BADGE emerald/amber+ring → semantic ok/warn/created border tags, status badge ring→border rounded-[3px], table containers rounded-lg+shadow-sm → rounded-md, picked/PNA qty text → text-ok/text-warn
- [x] **5.16** — Item Movement (`item-movement.tsx`) — scan shells rounded-xl+shadow-sm → rounded-md flat, icon chips rounded-lg → rounded-md, unrecognised-SKU box amber-50/300/800 → warn-bg/warn/30/warn
- [x] **5.17** — Item Info Update (`item-info-update.tsx`) — scan shells rounded-xl+shadow-sm → rounded-md, count pill + pending-approval badge rounded-full → SRF mono tags, photo X-button kept round
- [x] **5.18** — Movement Task Create (`movement-task-create.tsx`) — shells/dropzone/icon chips rounded-xl/-lg → rounded-md, Created-Tasks count pill rounded-full → mono rounded-[3px]
- [x] **5.19** — Putwall (`putwall.tsx`) — self-contained `<style>` mockup: normalized warm palette to SRF tokens, sys-blue info accent, status colors → semantic ok/warn/risk (cells, ids, dots, badges), rounded-20px chips/badges → 4px/2px, 12/8px radii → 4px, 0.5px borders → 1px, metric/section/filter/table labels → mono uppercase, blocked inline `#A32D2D` → risk
- [x] **5.20** — Sales Return GRN (`sales-return-grn.tsx`) — orange-50/100/300/600/700 → warn tokens, Unidentified + Good/Bad badges rounded-full → SRF mono tags (ok/risk), scanner shell/dropzone rounded-lg+shadow-sm → rounded-md, Rec live-pill rounded-full → rounded-[3px], red-500 dots → bg-risk, ping/icon/decorative circles kept round

---

## Execution Rules

1. **Work Phase 1 first** — all subsequent phases depend on design tokens being correct.
2. **Work Phase 2 next** — shell changes propagate globally before touching any screen.
3. **Phases 3–5**: work screen by screen, update this checklist after each one.
4. **Do not mix shadcn rounded-pill patterns** with SRF sharp style — once we start, go all the way.
5. **Tags**: always replace `rounded-full` badges with SRF tag style (mono, dot, 2px radius, border).
6. **Buttons**: replace shadcn Button variants with SRF btn classes or remap variants to match.

---

## Progress Log

| Date | Phase | What was done |
|---|---|---|
| 2026-06-17 | — | Task file created; SRF 2.0 zip analysed |
| 2026-06-17 | 1 | Foundation done: styles.css warm palette + semantic tokens, JetBrains Mono import, Helvetica Neue 13px base, dark sidebar vars; button (flat), card (4px/1px), badge (mono tag + dot + ok/warn/sys/ai variants), table (mono warm header) |
| 2026-06-17 | 2 | Shell done: sidebar brand + mono section labels + amber icon chip; rebuilt top bar (elevated bg, mono site label, search bar, flat tools buttons w/ count pills). 2.3/2.4 page padding & header deferred to per-screen Phase 3 |
| 2026-06-17 | 3 | Started core screens: shared PageHeader (SRF h1 + mono subtitle, handles 2.4 globally) & StatusBadge (SRF tag); migrated Orders index + detail (3.2) and Wave Creation (3.3). 3.1 Dashboard N/A (redirects to /orders). Remaining 3.4–3.10 pending |
| 2026-06-18 | 3 | Completed core screens 3.4–3.10: Pick, Pack, GRN, Gate Entry, Putaway, Approvals, Kitting (kitting/kit-order/kit-mapping) — mono labels, SRF semantic sharp tags, sharp shells/boxes, flat underline tabs, legacy Tailwind palette → semantic tokens |
| 2026-06-17 | 4 | Slotting module done: Heatmap (4.1) + Slotting Config (4.2) — flat underline tabs, mono SectionHeader/Field labels, 4px golden-zone toggles, mono rule step badges, SRF ok-tag Active/Inactive toggle, amber-rule summary callout, semantic decision-flow colors |
