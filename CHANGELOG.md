# Changelog

- 2026-06-18: SRF 2.0 migration Phase 5 COMPLETE (5.9, 5.16–5.18, 5.20) — Sort task suggestion card/done-pill ring→border SRF tags; Item Movement, Item Info Update & Movement Task Create scan shells rounded-xl/-lg+shadow-sm → rounded-md, count/status pills rounded-full → mono SRF tags, amber → warn; Sales Return GRN orange→warn tokens, Unidentified/Good/Bad badges → ok/risk mono tags, scanner shell/dropzone → rounded-md, Rec live-pill → rounded-[3px], red dots → bg-risk; decorative icon/ping circles kept round throughout

- 2026-06-18: SRF 2.0 migration 5.12–5.15 (View Pack/Picklist) — View Pack index/detail filter+tab pills → mono rounded-[3px] & containers rounded-lg+shadow-sm → rounded-md; View Picklist index STATUS_BADGE → semantic sys/ai/ok/risk border tags; View Picklist detail LINE_BADGE emerald/amber+ring → semantic ok/warn/created tags, status badge ring→border, picked/PNA qty text → text-ok/text-warn

- 2026-06-18: SRF 2.0 migration 5.8/5.10/5.11/5.19 — Sort index verified clean (shared PageHeader); Reports, Dock Management & Putwall self-contained `<style>` mockups remapped from cool-navy to warm SRF palette (sys-blue accent, status → semantic ok/warn/risk), 12/8/9/6/20px radii → 4px/3px/2px sharp, 0.5px borders → 1px, labels/table headers → mono uppercase, primary buttons → dark #1f1d17

- 2026-06-18: SRF 2.0 migration 5.7 Unloading — scan shell rounded-xl+shadow-sm → rounded-md flat, legacy orange-* palette (shortage exceptions, damaged-box capture, unidentified pile/badges, AwbRow, BucketTile) → warn tokens, rounded-full pills → sharp rounded-[3px], dashed POD/sticker boxes rounded-lg → rounded-md

- 2026-06-18: SRF 2.0 migration 5.6 Replenishment Setup — header → shared PageHeader (back-link moved into body), legacy green/amber/red palette → semantic ok/warn/risk (file icon, success banner, error box, Stat tones), rounded-lg → rounded-md, dead Toggle shadow-sm removed

- 2026-06-18: Wave Creation form — removed Order Creation Date filter, added "8 hrs +" SLA option, replaced Order Quantity at-least/at-most number inputs with Single/Multi quantity radio toggle (applies to create + edit)

- 2026-06-18: SRF 2.0 migration 5.5 Replenishment — hand-rolled header → shared PageHeader (mono subtitle) + p-6 body, filter count pill → mono rounded-[3px], legacy hex sparkline tones (blue/violet/amber) → semantic sys/ok/warn, delta arrows text-green-600/red-600 → text-ok/text-risk

- 2026-06-18: SRF 2.0 migration 5.4 View Dispatch — filter count pill → mono rounded-[3px], table container → rounded-md (no shadow), Closed badge → SRF ok tag (border, no ring)

- 2026-06-18: SRF 2.0 migration Phase 5 start — broke Phase 5 checklist into 20 per-screen items (5.1–5.20) for screen-by-screen token management; applied global mono-label batch across all secondary screens; completed 5.1 Manifest (sharp shell/tiles), 5.2 View Manifest (semantic STATE_BADGE, rounded-md table, mono pills, SRF status tags), and 5.3 Dispatch (Removed/count pills → SRF mono tags, dashed box → rounded-md)
- 2026-06-18: SRF 2.0 migration Phase 3 complete (3.4–3.10) — migrated Pick, Pack, GRN, Gate Entry, Putaway, Approvals, and Kitting (kitting/kit-order/kit-mapping). Mono uppercase labels, SRF semantic sharp tags (ok/warn/risk/sys/ai), sharp shells/scan boxes (rounded-md, no shadow), flat underline tabs on Approvals, sharp progress bars + mono count pills, and legacy Tailwind palette (green/amber/blue/red/violet/orange) remapped to semantic tokens
- 2026-06-17: SRF 2.0 migration Phase 4 (Slotting) — migrated Slotting Config (slotting-config.tsx): flat underline tabs, mono uppercase SectionHeader + Field labels, 4px golden-zone level toggles, mono rule step badges, SRF ok-tag Active/Inactive toggle, amber-rule summary callout, semantic decision-flow action colors. Heatmap (slotting.tsx) already migrated
- 2026-06-17: SRF 2.0 migration Phase 3 start — restyled shared PageHeader (22px/500 h1 + mono uppercase subtitle) and StatusBadge (mono tag, dot prefix, semantic colors) so all screens inherit; migrated Orders index + detail and Wave Creation to SRF (sharp cards, mono headers/tabs, SRF tag pills replacing rounded-full, 28px page padding). Dashboard 3.1 N/A (redirects to /orders)
- 2026-06-17: SRF 2.0 migration Phase 2 (Shell) — sidebar brand restyle ("Shiprocket" + mono "OMS · WMS", amber icon chip), mono uppercase section labels; rebuilt top bar with elevated warm bg, mono site label (BLR-01), flat search bar with ⌘K, and flat bordered Alerts/Approvals/Copilot tools buttons with amber count pills
- 2026-06-17: SRF 2.0 migration Phase 1 (Foundation) — remapped styles.css to warm palette + semantic tokens (ai/risk/ok/warn/sys), added JetBrains Mono import & Helvetica Neue 13px base, dark sidebar tokens, sharp 4px radius; restyled button (flat), card (4px/1px border), badge (mono tag + dot prefix + ok/warn/sys/ai variants), table (mono uppercase headers, warm header bg)
- 2026-06-17: Slotting Config — Tab 1 (Global Parameters) and Tab 3 (Strategy Builder: if/else fallback cascades, waterfall decision flow, collapsible rule cards, live summary)
- 2026-06-17: Added Bin Density Heatmap (/slotting) — zone tabs, density chips, 4 KPI cards, interactive grid with golden-zone markers, bin detail panel
- 2026-06-17: Added Wave Creation (/wave-creation) — schedule-based picklist batching with order/seller/courier/channel/SLA/qty/amount filters, time + day picker, mandatory Picklist Type, activate/edit/delete
- 2026-06-17: Created DESIGN_MIGRATION.md — SRF 2.0 migration task file (5 phases, 40+ items)
