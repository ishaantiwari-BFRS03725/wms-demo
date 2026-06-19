import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

// Faithful port of the Claude Design handoff "Warehouse Settings.dc.html".
// The design is self-contained (its own warm palette + Newsreader/Hanken/IBM Plex
// fonts), so it is recreated verbatim: markup + CSS are scoped under `.wh-settings`
// and the original vanilla interactivity (keyword search, conditional sub-rows,
// dirty-state save bar, scroll-spy nav) runs in a useEffect against a ref.
// Frontend-only demo — all control state is local DOM and resets on refresh.

export const Route = createFileRoute("/_wms/warehouse-settings")({
  head: () => ({
    meta: [{ title: "Warehouse Settings — Configuration" }],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,500&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: WarehouseSettings,
});

const CSS = `
.wh-settings{
  --canvas:#e9e6df; --card:#ffffff; --ink:#1c1a16; --ink2:#6f685c; --label:#928a7d;
  --line:#e4dfd5; --line2:#efebe3; --rust:#ab451f; --amber:#bd8722; --green:#3e7a4f;
  --accent:#ab451f;
  --sans:'Hanken Grotesk',system-ui,-apple-system,sans-serif; --serif:'Newsreader',Georgia,serif; --mono:'IBM Plex Mono',ui-monospace,monospace;
}
.wh-settings *{box-sizing:border-box}
.wh-settings ::selection{background:#f6e2b8}
.wh-settings mark{background:#f6e2b8;color:inherit;border-radius:2px;padding:0 1px;box-shadow:inset 0 -2px 0 #e7c87a}

.wh-settings .s-row{border-top:1px solid var(--line2)}
.wh-settings .s-row:first-child{border-top:none}
.wh-settings[data-density="compact"] .s-row{padding-top:10px !important;padding-bottom:10px !important}
.wh-settings [data-section]{scroll-margin-top:140px}

.wh-settings .search-input:focus{outline:none;border-color:var(--ink) !important;box-shadow:0 0 0 3px rgba(28,26,22,.06)}
.wh-settings .num:focus,.wh-settings .sel:focus,.wh-settings input[type=time]:focus{outline:none;border-color:var(--ink) !important;box-shadow:0 0 0 3px rgba(28,26,22,.06)}

.wh-settings .nav-link:hover{background:#fff;color:var(--ink)}
.wh-settings .nav-link.active{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(28,26,22,.05)}
.wh-settings .nav-link.active .nav-num{color:var(--accent)}

.wh-settings .tgl{position:relative;width:42px;height:24px;flex:none;display:inline-block}
.wh-settings .tgl input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:2}
.wh-settings .tgl .trk{position:absolute;inset:0;background:#d7d0c4;border-radius:999px;transition:.18s ease}
.wh-settings .tgl .trk::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.18s ease;box-shadow:0 1px 2px rgba(28,26,22,.25)}
.wh-settings .tgl input:checked+.trk{background:var(--green)}
.wh-settings .tgl input:checked+.trk::after{transform:translateX(18px)}
.wh-settings .tgl input:focus-visible+.trk{box-shadow:0 0 0 3px rgba(28,26,22,.12)}

.wh-settings .seg{display:inline-block;cursor:pointer}
.wh-settings .seg input{position:absolute;opacity:0;width:0;height:0}
.wh-settings .seg span{display:block;padding:5px 13px;border-radius:6px;font-size:13px;font-weight:500;color:var(--ink2);white-space:nowrap;transition:.12s}
.wh-settings .seg input:checked+span{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(28,26,22,.1);font-weight:600}
.wh-settings .seg:hover span{color:var(--ink)}

.wh-settings .sel{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%236f685c' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center}

.wh-settings .info{position:relative;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1px solid #cfc8ba;color:var(--label);cursor:help;flex:none}
.wh-settings .info::before{content:'i';font-family:var(--serif);font-style:italic;font-weight:500;font-size:11px;line-height:1}
.wh-settings .info:hover,.wh-settings .info:focus-visible{border-color:var(--ink);color:var(--ink);outline:none}
.wh-settings .info .tip{position:absolute;bottom:calc(100% + 9px);left:50%;transform:translateX(-50%) translateY(4px);width:252px;background:var(--ink);color:#f1ece3;padding:11px 13px;border-radius:9px;font-size:12.5px;line-height:1.5;font-family:var(--sans);font-weight:400;letter-spacing:0;text-transform:none;opacity:0;visibility:hidden;transition:.16s ease;z-index:60;box-shadow:0 10px 30px rgba(28,26,22,.28);pointer-events:none}
.wh-settings .info .tip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:var(--ink)}
.wh-settings .info:hover .tip,.wh-settings .info:focus-visible .tip{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}

.wh-settings .ghostbtn:hover{color:#fff !important}
.wh-settings .savebtn:hover{background:#f3efe7 !important}
`;

const MARKUP = `
<div style="min-height:100vh;background:var(--canvas);font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased;padding-bottom:160px">

  <div style="max-width:1180px;margin:0 auto;padding:52px 36px 0">
    <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">Settings · Site BLR-01</div>
    <h1 style="font-family:var(--serif);font-weight:500;font-size:42px;letter-spacing:-.015em;margin:10px 0 8px;line-height:1.05">Warehouse configuration</h1>
    <p style="color:var(--ink2);font-size:15.5px;line-height:1.55;max-width:580px;margin:0 0 26px">Define how BLR-01 receives, stores, picks and ships. Changes apply to this site only and take effect at the start of the next shift.</p>
  </div>

  <div data-searchbar style="position:sticky;top:48px;z-index:40;background:var(--canvas);border-bottom:1px solid transparent;transition:box-shadow .2s ease,border-color .2s ease">
    <div style="max-width:1180px;margin:0 auto;padding:16px 36px">
    <div style="position:relative;max-width:720px">
      <svg style="position:absolute;left:16px;top:50%;transform:translateY(-50%);pointer-events:none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#928a7d" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.5" y2="16.5"></line></svg>
      <input data-search class="search-input" type="text" autocomplete="off" spellcheck="false" placeholder="Search settings — try “stop mixing batches in one bin”" style="width:100%;height:54px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:0 46px;font-size:16px;font-family:var(--sans);color:var(--ink);box-shadow:0 1px 2px rgba(28,26,22,.04)">
      <button data-clear type="button" aria-label="Clear search" style="display:none;position:absolute;right:11px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:none;background:#f1ede5;border-radius:7px;cursor:pointer;align-items:center;justify-content:center;color:var(--ink2)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg>
      </button>
    </div>
    <div data-resultline style="display:none;align-items:center;gap:7px;margin-top:13px;font-size:13.5px;color:var(--ink2)">
      <span style="font-weight:600;color:var(--accent,#ab451f)"><span data-count>0</span> settings</span>
      <span>match your search</span>
      <button data-clear2 type="button" style="margin-left:6px;border:none;background:none;color:var(--ink2);text-decoration:underline;text-underline-offset:2px;cursor:pointer;font:inherit;font-size:13px">clear</button>
    </div>
    </div>
  </div>

  <div style="max-width:1180px;margin:0 auto;padding:26px 36px;display:flex;gap:44px;align-items:flex-start">

    <nav style="width:196px;flex:none;position:sticky;top:140px">
      <div style="font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--label);padding:0 10px 10px">On this page</div>
      <div style="display:flex;flex-direction:column;gap:1px">
        <a class="nav-link active" href="#sec-general" style="display:flex;gap:11px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500"><span class="nav-num" style="font-family:var(--mono);font-size:11px;color:var(--label)">01</span>General</a>
        <a class="nav-link" href="#sec-inbound" style="display:flex;gap:11px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500"><span class="nav-num" style="font-family:var(--mono);font-size:11px;color:var(--label)">02</span>Inbound &amp; receiving</a>
        <a class="nav-link" href="#sec-putaway" style="display:flex;gap:11px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500"><span class="nav-num" style="font-family:var(--mono);font-size:11px;color:var(--label)">03</span>Putaway &amp; storage</a>
        <a class="nav-link" href="#sec-inventory" style="display:flex;gap:11px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500"><span class="nav-num" style="font-family:var(--mono);font-size:11px;color:var(--label)">04</span>Inventory control</a>
        <a class="nav-link" href="#sec-outbound" style="display:flex;gap:11px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500"><span class="nav-num" style="font-family:var(--mono);font-size:11px;color:var(--label)">05</span>Outbound &amp; picking</a>
        <a class="nav-link" href="#sec-dispatch" style="display:flex;gap:11px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500"><span class="nav-num" style="font-family:var(--mono);font-size:11px;color:var(--label)">06</span>Dispatch &amp; manifest</a>
        <a class="nav-link" href="#sec-agents" style="display:flex;gap:11px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500"><span class="nav-num" style="font-family:var(--mono);font-size:11px;color:var(--label)">07</span>Automation &amp; agents</a>
      </div>
    </nav>

    <div data-content style="flex:1;min-width:0;display:flex;flex-direction:column;gap:42px">

      <!-- 01 GENERAL -->
      <section id="sec-general" data-section>
        <div style="margin-bottom:14px">
          <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">01 / General</div>
          <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;letter-spacing:-.01em;margin:6px 0 4px">General &amp; site</h2>
          <p style="color:var(--ink2);font-size:14px;margin:0;line-height:1.5">Operating model and site-wide defaults.</p>
        </div>
        <div style="background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(28,26,22,.04)">

          <div class="s-row" data-setting data-keywords="shift model shifts operating hours roster labour labor planning single double two three 24x7 round the clock schedule" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Shift model</span><span class="info" tabindex="0"><span class="tip">How many operating shifts the site runs. Drives labour planning, cut-off times and SLA clocks.</span></span></div></div>
            <select name="shift_model" class="sel" style="height:34px;border:1px solid var(--line);border-radius:8px;padding:0 32px 0 11px;font:inherit;font-size:14px;background-color:#fff;color:var(--ink);cursor:pointer">
              <option>Single shift</option><option selected>Two-shift</option><option>Three-shift</option><option>24×7 continuous</option>
            </select>
          </div>

          <div class="s-row" data-setting data-keywords="receiving cut off cutoff time deadline inbound receipt roll over next day late sla clock" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Receiving cut-off time</span><span class="info" tabindex="0"><span class="tip">Inbound receipts logged after this time roll over to the next working day for SLA calculation.</span></span></div></div>
            <input name="cutoff" type="time" value="11:00" style="height:34px;border:1px solid var(--line);border-radius:8px;padding:0 10px;font:inherit;font-size:14px;background:#fff;color:var(--ink)">
          </div>

          <div class="s-row" data-setting data-keywords="default weight unit measurement kg kilogram lb pound mass uom" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Default weight unit</span><span class="info" tabindex="0"><span class="tip">Unit used across receiving, packing and manifests. Operators can still scan items in either unit.</span></span></div></div>
            <div role="radiogroup" style="display:inline-flex;background:#f1ede5;border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px">
              <label class="seg"><input type="radio" name="weight_unit" value="kg"><span>kg</span></label>
              <label class="seg"><input type="radio" name="weight_unit" value="lb"><span>lb</span></label>
            </div>
          </div>

          <div class="s-row" data-setting data-keywords="barcode symbology format label code 128 ean qr datamatrix scan print bin tote" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Barcode symbology</span><span class="info" tabindex="0"><span class="tip">Primary barcode format generated for bins, totes and labels printed at this site.</span></span></div></div>
            <select name="barcode" class="sel" style="height:34px;border:1px solid var(--line);border-radius:8px;padding:0 32px 0 11px;font:inherit;font-size:14px;background-color:#fff;color:var(--ink);cursor:pointer">
              <option selected>Code 128</option><option>EAN-13</option><option>QR Code</option><option>DataMatrix</option>
            </select>
          </div>

        </div>
      </section>

      <!-- 02 INBOUND -->
      <section id="sec-inbound" data-section>
        <div style="margin-bottom:14px">
          <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">02 / Inbound</div>
          <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;letter-spacing:-.01em;margin:6px 0 4px">Inbound &amp; receiving</h2>
          <p style="color:var(--ink2);font-size:14px;margin:0;line-height:1.5">How goods are received, counted and quality-checked at the dock.</p>
        </div>
        <div style="background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(28,26,22,.04)">

          <div class="s-row" data-setting data-keywords="blind receiving hide expected po quantity count independent error copy through receive" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Blind receiving</span><span class="info" tabindex="0"><span class="tip">Hide expected PO quantities from the receiving operator so counts are recorded independently, reducing copy-through errors.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="blind_receiving"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="auto create grn goods receipt note dock scan vehicle gate automatic generate" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Auto-create GRN on dock scan</span><span class="info" tabindex="0"><span class="tip">Open a Goods Receipt Note automatically when a vehicle is scanned at the dock, instead of creating it manually.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="auto_grn"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="over receipt tolerance percent percentage above po quantity exception extra surplus" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Over-receipt tolerance</span><span class="info" tabindex="0"><span class="tip">Maximum percentage above the PO quantity that can be received without an exception approval.</span></span></div></div>
            <div style="display:inline-flex;align-items:center;gap:6px"><input name="over_tolerance" class="num" type="number" min="0" max="100" value="5" style="width:60px;height:34px;border:1px solid var(--line);border-radius:8px;padding:0 8px;font:inherit;font-size:14px;text-align:right;background:#fff;color:var(--ink)"><span style="color:var(--ink2);font-size:13px">%</span></div>
          </div>

          <div class="s-row" data-setting data-keywords="block over receipt prevent reject hard stop beyond tolerance exceed surplus" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Block over-receipt beyond tolerance</span><span class="info" tabindex="0"><span class="tip">Prevent receiving beyond the tolerance entirely, rather than flagging it for supervisor approval.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="block_over"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="qc quality control policy inspect inspection all sampling risk based vendor every line check" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Quality control policy</span><span class="info" tabindex="0"><span class="tip">Which receipts go through quality control — every line, a sampled subset, or only vendors flagged as high-risk.</span></span></div></div>
            <div role="radiogroup" style="display:inline-flex;background:#f1ede5;border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px">
              <label class="seg"><input type="radio" name="qc_policy" value="All"><span>All</span></label>
              <label class="seg"><input type="radio" name="qc_policy" value="Sampling"><span>Sampling</span></label>
              <label class="seg"><input type="radio" name="qc_policy" value="Risk-based"><span>Risk-based</span></label>
            </div>
          </div>

          <div class="s-row" data-setting data-show-when="qc_policy:Sampling" data-keywords="sampling rate percent inspected subset share qc quality sample" style="display:flex;align-items:center;gap:20px;padding:16px 22px 16px 38px;background:#faf8f3">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:14.5px;font-weight:600;color:var(--ink2)">↳ Sampling rate</span><span class="info" tabindex="0"><span class="tip">Share of each receipt inspected when QC is set to sampling.</span></span></div></div>
            <div style="display:inline-flex;align-items:center;gap:6px"><input name="sampling_rate" class="num" type="number" min="1" max="100" value="10" style="width:60px;height:34px;border:1px solid var(--line);border-radius:8px;padding:0 8px;font:inherit;font-size:14px;text-align:right;background:#fff;color:var(--ink)"><span style="color:var(--ink2);font-size:13px">%</span></div>
          </div>

          <div class="s-row" data-setting data-keywords="capture damage photos require attach image damaged units classifier broken defect cosmetic" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Require damage photos</span><span class="info" tabindex="0"><span class="tip">Require operators to attach photos when logging damaged units, feeding the damage classifier.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="capture_damage"><span class="trk"></span></label>
          </div>

        </div>
      </section>

      <!-- 03 PUTAWAY -->
      <section id="sec-putaway" data-section>
        <div style="margin-bottom:14px">
          <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">03 / Putaway</div>
          <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;letter-spacing:-.01em;margin:6px 0 4px">Putaway &amp; storage</h2>
          <p style="color:var(--ink2);font-size:14px;margin:0;line-height:1.5">Where stock goes and how bins may be mixed.</p>
        </div>
        <div style="background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(28,26,22,.04)">

          <div class="s-row" data-setting data-keywords="putaway strategy directed system suggest fixed bin home location manual operator slotting" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Putaway strategy</span><span class="info" tabindex="0"><span class="tip">Directed lets the system suggest the best bin; Fixed assigns each SKU a home location; Manual leaves it to the operator.</span></span></div></div>
            <div role="radiogroup" style="display:inline-flex;background:#f1ede5;border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px">
              <label class="seg"><input type="radio" name="putaway_strategy" value="Directed"><span>Directed</span></label>
              <label class="seg"><input type="radio" name="putaway_strategy" value="Fixed bin"><span>Fixed bin</span></label>
              <label class="seg"><input type="radio" name="putaway_strategy" value="Manual"><span>Manual</span></label>
            </div>
          </div>

          <div class="s-row" data-setting data-keywords="one single sku per bin location only do not mix products different items together unambiguous pick" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">One SKU per bin</span><span class="info" tabindex="0"><span class="tip">Block storing more than one SKU in the same bin to keep picks unambiguous.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="one_sku_bin"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="one single batch lot per bin location stop mixing mix mixed combine batches lots together segregate separate traceability" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">One batch per bin</span><span class="info" tabindex="0"><span class="tip">Stop mixing different batches or lots of the same SKU in a single bin, so traceability and recall scope stay intact.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="one_batch_bin"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="mix expiry expiration date shelf life bin location combine different dates fefo clean separate" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Allow mixed expiry dates in a bin</span><span class="info" tabindex="0"><span class="tip">Allow units with different expiry dates to share a bin. Turn off to keep FEFO picking clean.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="mix_expiry"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="enforce bin capacity limit volume weight max overfill block putaway exceed" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Enforce bin capacity</span><span class="info" tabindex="0"><span class="tip">Reject putaway that would exceed a bin's configured volume or weight limit.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="enforce_capacity"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="cold chain segregation temperature controlled chilled frozen zone separate block ambient cold" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Cold-chain segregation</span><span class="info" tabindex="0"><span class="tip">Keep temperature-controlled SKUs in designated cold zones and block putaway elsewhere.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="cold_seg"><span class="trk"></span></label>
          </div>

        </div>
      </section>

      <!-- 04 INVENTORY -->
      <section id="sec-inventory" data-section>
        <div style="margin-bottom:14px">
          <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">04 / Inventory</div>
          <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;letter-spacing:-.01em;margin:6px 0 4px">Inventory control</h2>
          <p style="color:var(--ink2);font-size:14px;margin:0;line-height:1.5">Allocation, counting and how variances are handled.</p>
        </div>
        <div style="background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(28,26,22,.04)">

          <div class="s-row" data-setting data-keywords="allocation rule method fefo fifo lifo first expiry in out consume order stock rotation" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Allocation rule</span><span class="info" tabindex="0"><span class="tip">Order in which stock is consumed against orders — earliest expiry, earliest received, or latest received first.</span></span></div></div>
            <div role="radiogroup" style="display:inline-flex;background:#f1ede5;border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px">
              <label class="seg"><input type="radio" name="allocation" value="FEFO"><span>FEFO</span></label>
              <label class="seg"><input type="radio" name="allocation" value="FIFO"><span>FIFO</span></label>
              <label class="seg"><input type="radio" name="allocation" value="LIFO"><span>LIFO</span></label>
            </div>
          </div>

          <div class="s-row" data-setting data-keywords="allow negative stock oversell below zero on hand drive sell reconcile" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Allow negative stock</span><span class="info" tabindex="0"><span class="tip">Permit picks and sales to drive on-hand below zero, reconciling later. Usually left off.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="negative_stock"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="cycle count cadence frequency counting audit perpetual abc daily weekly schedule fast movers" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Cycle count cadence</span><span class="info" tabindex="0"><span class="tip">How often perpetual cycle counts are scheduled. ABC-based counts fast movers more frequently.</span></span></div></div>
            <select name="cycle_count" class="sel" style="height:34px;border:1px solid var(--line);border-radius:8px;padding:0 32px 0 11px;font:inherit;font-size:14px;background-color:#fff;color:var(--ink);cursor:pointer">
              <option>Daily</option><option>Weekly</option><option selected>ABC-based</option><option>Off</option>
            </select>
          </div>

          <div class="s-row" data-setting data-keywords="auto quarantine variance count discrepancy threshold move hold review block stock" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Auto-quarantine on variance</span><span class="info" tabindex="0"><span class="tip">Automatically move stock to a quarantine bin when a count variance exceeds the threshold.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="auto_quarantine"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-show-when="auto_quarantine:on" data-keywords="variance threshold percent discrepancy trigger quarantine review count tolerance" style="display:flex;align-items:center;gap:20px;padding:16px 22px 16px 38px;background:#faf8f3">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:14.5px;font-weight:600;color:var(--ink2)">↳ Variance threshold</span><span class="info" tabindex="0"><span class="tip">Count discrepancy, as a percentage of expected quantity, that triggers quarantine and review.</span></span></div></div>
            <div style="display:inline-flex;align-items:center;gap:6px"><input name="variance_threshold" class="num" type="number" min="0" max="100" value="2" style="width:60px;height:34px;border:1px solid var(--line);border-radius:8px;padding:0 8px;font:inherit;font-size:14px;text-align:right;background:#fff;color:var(--ink)"><span style="color:var(--ink2);font-size:13px">%</span></div>
          </div>

          <div class="s-row" data-setting data-keywords="reservation hold time minutes allocated reserved release back available order expire" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Reservation hold time</span><span class="info" tabindex="0"><span class="tip">How long allocated stock stays reserved for an order before it is released back to available.</span></span></div></div>
            <div style="display:inline-flex;align-items:center;gap:6px"><input name="reservation_hold" class="num" type="number" min="0" max="1440" value="30" style="width:64px;height:34px;border:1px solid var(--line);border-radius:8px;padding:0 8px;font:inherit;font-size:14px;text-align:right;background:#fff;color:var(--ink)"><span style="color:var(--ink2);font-size:13px">min</span></div>
          </div>

        </div>
      </section>

      <!-- 05 OUTBOUND -->
      <section id="sec-outbound" data-section>
        <div style="margin-bottom:14px">
          <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">05 / Outbound</div>
          <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;letter-spacing:-.01em;margin:6px 0 4px">Outbound &amp; picking</h2>
          <p style="color:var(--ink2);font-size:14px;margin:0;line-height:1.5">How orders are waved, picked and verified.</p>
        </div>
        <div style="background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(28,26,22,.04)">

          <div class="s-row" data-setting data-keywords="wave release strategy auto automatic scheduled manual planner cadence batch orders releasing" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Wave release</span><span class="info" tabindex="0"><span class="tip">Auto releases waves on a cadence, Scheduled at fixed times, Manual only when a planner releases them.</span></span></div></div>
            <div role="radiogroup" style="display:inline-flex;background:#f1ede5;border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px">
              <label class="seg"><input type="radio" name="wave_release" value="Auto"><span>Auto</span></label>
              <label class="seg"><input type="radio" name="wave_release" value="Scheduled"><span>Scheduled</span></label>
              <label class="seg"><input type="radio" name="wave_release" value="Manual"><span>Manual</span></label>
            </div>
          </div>

          <div class="s-row" data-setting data-keywords="optimize pick path route travel distance sequence floor minimise shortest walking" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Optimize pick path</span><span class="info" tabindex="0"><span class="tip">Sequence pick tasks to minimise travel distance across the floor.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="optimize_path"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="picking method discrete single batch zone cluster cart group order pick" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Picking method</span><span class="info" tabindex="0"><span class="tip">How picks are grouped — one order at a time, batched across orders, by zone, or clustered to a cart.</span></span></div></div>
            <select name="picking_method" class="sel" style="height:34px;border:1px solid var(--line);border-radius:8px;padding:0 32px 0 11px;font:inherit;font-size:14px;background-color:#fff;color:var(--ink);cursor:pointer">
              <option>Discrete</option><option selected>Batch</option><option>Zone</option><option>Cluster</option>
            </select>
          </div>

          <div class="s-row" data-setting data-keywords="short pick handling shortage out of stock missing substitute backorder hold order face stockout" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Short-pick handling</span><span class="info" tabindex="0"><span class="tip">What happens when stock is missing at the face — substitute, backorder the line, or hold the order.</span></span></div></div>
            <div role="radiogroup" style="display:inline-flex;background:#f1ede5;border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px">
              <label class="seg"><input type="radio" name="short_pick" value="Substitute"><span>Substitute</span></label>
              <label class="seg"><input type="radio" name="short_pick" value="Backorder"><span>Backorder</span></label>
              <label class="seg"><input type="radio" name="short_pick" value="Hold"><span>Hold</span></label>
            </div>
          </div>

          <div class="s-row" data-setting data-keywords="scan verify before pack confirm match unit mispick check station accuracy" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Scan-verify before pack</span><span class="info" tabindex="0"><span class="tip">Require each unit to be scanned and matched before it can be packed, catching mispicks.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="scan_verify"><span class="trk"></span></label>
          </div>

        </div>
      </section>

      <!-- 06 DISPATCH -->
      <section id="sec-dispatch" data-section>
        <div style="margin-bottom:14px">
          <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">06 / Dispatch</div>
          <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;letter-spacing:-.01em;margin:6px 0 4px">Dispatch &amp; manifest</h2>
          <p style="color:var(--ink2);font-size:14px;margin:0;line-height:1.5">Carrier allocation and gate controls at the point of exit.</p>
        </div>
        <div style="background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(28,26,22,.04)">

          <div class="s-row" data-setting data-keywords="auto manifest pack complete carrier add shipment automatic generate close" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Auto-manifest on pack complete</span><span class="info" tabindex="0"><span class="tip">Add shipments to the carrier manifest automatically once packing is complete.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="auto_manifest"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="carrier selection courier shipping rule cheapest fastest cost speed allocation choose default" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Carrier selection</span><span class="info" tabindex="0"><span class="tip">Default rule for choosing a carrier per shipment when none is specified.</span></span></div></div>
            <div role="radiogroup" style="display:inline-flex;background:#f1ede5;border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px">
              <label class="seg"><input type="radio" name="carrier" value="Cheapest"><span>Cheapest</span></label>
              <label class="seg"><input type="radio" name="carrier" value="Fastest"><span>Fastest</span></label>
              <label class="seg"><input type="radio" name="carrier" value="Rule-based"><span>Rule-based</span></label>
            </div>
          </div>

          <div class="s-row" data-setting data-keywords="gatepass scan exit gate vehicle leave chain of custody security require dispatch" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Require gatepass scan on exit</span><span class="info" tabindex="0"><span class="tip">Require a gatepass scan at the gate before a vehicle can leave, closing the chain of custody.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="gatepass_scan"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="weight dimension dim check dispatch verify actual measure mismatch flag scale" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Weight &amp; dim check at dispatch</span><span class="info" tabindex="0"><span class="tip">Verify actual weight and dimensions against the order at dispatch and flag mismatches.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="weightdim_check"><span class="trk"></span></label>
          </div>

        </div>
      </section>

      <!-- 07 AGENTS -->
      <section id="sec-agents" data-section>
        <div style="margin-bottom:14px">
          <div style="font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--label)">07 / Automation</div>
          <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;letter-spacing:-.01em;margin:6px 0 4px">Automation &amp; agents</h2>
          <p style="color:var(--ink2);font-size:14px;margin:0;line-height:1.5">How much the AI agent does on its own, and who hears about it.</p>
        </div>
        <div style="background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(28,26,22,.04)">

          <div class="s-row" data-setting data-keywords="enable agent recommendations ai suggestions copilot inbound outbound show recommend" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Enable agent recommendations</span><span class="info" tabindex="0"><span class="tip">Show the AI agent's suggestions across inbound and outbound workflows.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="agent_recs"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-keywords="auto apply high confidence actions automatic execute without approval agent autonomous self" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Auto-apply high-confidence actions</span><span class="info" tabindex="0"><span class="tip">Let the agent execute actions automatically when its confidence is above the threshold, instead of asking for approval.</span></span></div></div>
            <label class="tgl"><input type="checkbox" name="auto_apply"><span class="trk"></span></label>
          </div>

          <div class="s-row" data-setting data-show-when="auto_apply:on" data-keywords="confidence threshold percent minimum agent action apply auto review score" style="display:flex;align-items:center;gap:20px;padding:16px 22px 16px 38px;background:#faf8f3">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:14.5px;font-weight:600;color:var(--ink2)">↳ Confidence threshold</span><span class="info" tabindex="0"><span class="tip">Minimum confidence an agent action needs before it is applied without human review.</span></span></div></div>
            <div style="display:inline-flex;align-items:center;gap:6px"><input name="confidence_threshold" class="num" type="number" min="50" max="100" value="85" style="width:60px;height:34px;border:1px solid var(--line);border-radius:8px;padding:0 8px;font:inherit;font-size:14px;text-align:right;background:#fff;color:var(--ink)"><span style="color:var(--ink2);font-size:13px">%</span></div>
          </div>

          <div class="s-row" data-setting data-keywords="alert routing notification who receives supervisor lead operators escalation send" style="display:flex;align-items:center;gap:20px;padding:16px 22px">
            <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span data-hl style="font-size:15px;font-weight:600">Alert routing</span><span class="info" tabindex="0"><span class="tip">Who receives operational alerts raised by the system and agents.</span></span></div></div>
            <select name="alert_routing" class="sel" style="height:34px;border:1px solid var(--line);border-radius:8px;padding:0 32px 0 11px;font:inherit;font-size:14px;background-color:#fff;color:var(--ink);cursor:pointer">
              <option>Supervisor only</option><option selected>Supervisor + lead</option><option>All operators</option>
            </select>
          </div>

        </div>
      </section>

      <div data-empty style="display:none;text-align:center;padding:64px 20px;border:1px dashed var(--line);border-radius:10px;color:var(--ink2)">
        <div style="font-family:var(--serif);font-size:20px;color:var(--ink);margin-bottom:6px">No settings match your search</div>
        <div style="font-size:14px">Try fewer or different words — for example “bin”, “quality”, or “short pick”.</div>
      </div>

    </div>
  </div>

  <!-- save bar -->
  <div data-savebar style="position:fixed;left:0;right:0;bottom:28px;display:flex;justify-content:center;transform:translateY(160%);transition:transform .3s cubic-bezier(.34,1.2,.5,1);pointer-events:none;z-index:80">
    <div style="pointer-events:auto;background:var(--ink);color:#f1ece3;border-radius:13px;padding:11px 13px 11px 20px;display:flex;align-items:center;gap:20px;box-shadow:0 16px 40px rgba(28,26,22,.32)">
      <div style="display:flex;align-items:center;gap:10px"><span style="width:8px;height:8px;border-radius:50%;background:var(--amber);box-shadow:0 0 0 3px rgba(189,135,34,.25)"></span><span style="font-size:14px;font-weight:500">Unsaved changes</span></div>
      <div style="display:flex;align-items:center;gap:8px">
        <button data-discard type="button" class="ghostbtn" style="background:transparent;border:none;color:#c9c1b4;font:inherit;font-size:14px;font-weight:500;cursor:pointer;padding:9px 12px;transition:color .12s">Discard</button>
        <button data-save type="button" class="savebtn" style="background:#fff;color:var(--ink);border:none;border-radius:8px;padding:9px 20px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:background .12s">Save</button>
      </div>
    </div>
  </div>

  <!-- saved toast -->
  <div data-toast style="position:fixed;left:0;right:0;bottom:34px;display:flex;justify-content:center;pointer-events:none;z-index:70;opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s">
    <div style="background:var(--green);color:#fff;border-radius:10px;padding:10px 18px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:9px;box-shadow:0 12px 30px rgba(28,26,22,.22)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Settings saved
    </div>
  </div>

</div>
`;

function WarehouseSettings() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const search = root.querySelector("[data-search]") as HTMLInputElement;
    const clearBtn = root.querySelector("[data-clear]") as HTMLElement;
    const clear2 = root.querySelector("[data-clear2]") as HTMLElement;
    const resultLine = root.querySelector("[data-resultline]") as HTMLElement;
    const resultCount = root.querySelector("[data-count]") as HTMLElement;
    const emptyState = root.querySelector("[data-empty]") as HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = [...root.querySelectorAll("[data-setting]")] as any[];
    const sections = [
      ...root.querySelectorAll("[data-section]"),
    ] as HTMLElement[];
    const navLinks = [...root.querySelectorAll(".nav-link")] as HTMLElement[];

    rows.forEach((r) => {
      r._hls = [...r.querySelectorAll("[data-hl]")];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r._hls.forEach((h: any) => (h.dataset.orig = h.textContent));
    });

    const STOP = new Set(
      "a an and are as at be but by can do dont for from how i if in is it its let me my need never no not of off on onto or our over per should so stop that the then these this those to under want we what when where which while with you your".split(
        " ",
      ),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SYN: any = {
      mixing: ["mix"], mixed: ["mix"], combine: ["mix"], combined: ["mix"], together: ["mix"],
      batches: ["batch"], lots: ["lot", "batch"], lot: ["batch"],
      locations: ["bin"], location: ["bin"], slot: ["bin"], slots: ["bin"],
      expiration: ["expiry"], expire: ["expiry"], expires: ["expiry"], shelf: ["expiry"],
      qc: ["quality"], inspect: ["quality"], inspection: ["quality"], check: ["verify", "quality"],
      courier: ["carrier"], shipping: ["carrier", "dispatch"], ship: ["dispatch", "carrier"],
      chilled: ["cold"], frozen: ["cold"], temperature: ["cold"], temp: ["cold"],
      oversell: ["negative"], counting: ["count"], audit: ["count"], cycle: ["count"],
      releasing: ["wave"], release: ["wave"], shortage: ["short"], stockout: ["short"],
      picks: ["pick"], picking: ["pick"],
    };
    const tk = (s: string) => s.toLowerCase().match(/[a-z0-9%]+/g) || [];
    function content(q: string) {
      const out: string[] = [];
      tk(q).forEach((t) => {
        if (STOP.has(t) || t.length < 2) return;
        out.push(t);
        (SYN[t] || []).forEach((x: string) => out.push(x));
      });
      return [...new Set(out)];
    }
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    function clearHl() {
      rows.forEach((r) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r._hls.forEach((h: any) => {
          if (h.dataset.orig != null) h.textContent = h.dataset.orig;
        }),
      );
    }
    function applyHl(terms: string[]) {
      if (!terms.length) return;
      const re = new RegExp("(" + terms.map(esc).join("|") + ")", "ig");
      rows.forEach((r) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r._hls.forEach((h: any) => {
          const o = h.dataset.orig;
          if (re.test(o)) h.innerHTML = o.replace(re, "<mark>$1</mark>");
        }),
      );
    }

    function runSearch() {
      const q = search.value.trim();
      clearBtn.style.display = q ? "flex" : "none";
      clearHl();
      if (!q) {
        rows.forEach((r) => (r.style.display = r._depHidden ? "none" : ""));
        sections.forEach((s) => (s.style.display = ""));
        resultLine.style.display = "none";
        emptyState.style.display = "none";
        return;
      }
      const ct = content(q);
      let visible = 0;
      const used = new Set<string>();
      rows.forEach((r) => {
        if (r._depHidden) {
          r.style.display = "none";
          return;
        }
        const hay = (
          (r.getAttribute("data-keywords") || "") +
          " " +
          r.textContent
        ).toLowerCase();
        const matched = ct.filter((t) => hay.includes(t));
        const need = ct.length <= 2 ? 1 : Math.ceil(ct.length * 0.5);
        const ok = matched.length >= need && matched.length > 0;
        r.style.display = ok ? "" : "none";
        if (ok) {
          visible++;
          matched.forEach((t) => used.add(t));
        }
      });
      applyHl([...used].filter((t) => t.length >= 2));
      sections.forEach((s) => {
        const any = [...s.querySelectorAll("[data-setting]")].some(
          (r) => (r as HTMLElement).style.display !== "none",
        );
        s.style.display = any ? "" : "none";
      });
      resultLine.style.display = "flex";
      resultCount.textContent = String(visible);
      emptyState.style.display = visible ? "none" : "block";
    }
    search.addEventListener("input", runSearch);
    const doClear = () => {
      search.value = "";
      search.focus();
      runSearch();
    };
    clearBtn.addEventListener("click", doClear);
    clear2.addEventListener("click", doClear);

    // ---- dirty tracking / save bar ----
    const controls = [
      ...root.querySelectorAll("input,select"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ].filter((c) => !(c as any).hasAttribute("data-search")) as any[];

    // Apply intended defaults (the design notes runtime ignores checked/selected attrs).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DEFAULTS: any = {
      shift_model: "Two-shift", cutoff: "11:00", weight_unit: "kg", barcode: "Code 128",
      blind_receiving: false, auto_grn: true, over_tolerance: "5", block_over: false,
      qc_policy: "Sampling", sampling_rate: "10", capture_damage: true,
      putaway_strategy: "Directed", one_sku_bin: true, one_batch_bin: true, mix_expiry: false,
      enforce_capacity: true, cold_seg: true,
      allocation: "FEFO", negative_stock: false, cycle_count: "ABC-based",
      auto_quarantine: true, variance_threshold: "2", reservation_hold: "30",
      wave_release: "Auto", optimize_path: true, picking_method: "Batch", short_pick: "Backorder", scan_verify: true,
      auto_manifest: true, carrier: "Rule-based", gatepass_scan: true, weightdim_check: true,
      agent_recs: true, auto_apply: false, confidence_threshold: "85", alert_routing: "Supervisor + lead",
    };
    controls.forEach((c) => {
      const d = DEFAULTS[c.name];
      if (d === undefined) return;
      if (c.type === "checkbox") c.checked = !!d;
      else if (c.type === "radio") c.checked = c.value === d;
      else c.value = d;
    });
    const saveBar = root.querySelector("[data-savebar]") as HTMLElement;
    const toast = root.querySelector("[data-toast]") as HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseline = new Map<any, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cur = (c: any) =>
      c.type === "checkbox" || c.type === "radio" ? c.checked : c.value;
    const snap = () => {
      baseline.clear();
      controls.forEach((c) => baseline.set(c, cur(c)));
    };
    const isDirty = () => controls.some((c) => baseline.get(c) !== cur(c));
    const refresh = () => {
      saveBar.style.transform = isDirty()
        ? "translateY(0)"
        : "translateY(160%)";
    };
    snap();

    const val = (name: string) => {
      const els = controls.filter((c) => c.name === name);
      if (!els.length) return null;
      if (els[0].type === "radio") {
        const r = els.find((e) => e.checked);
        return r ? r.value : null;
      }
      if (els[0].type === "checkbox") return els[0].checked ? "on" : "off";
      return els[0].value;
    };
    const deps = [
      ...root.querySelectorAll("[data-show-when]"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any[];
    function updateDeps() {
      deps.forEach((d) => {
        const [n, v] = d.getAttribute("data-show-when").split(":");
        const hide = val(n) !== v;
        d._depHidden = hide;
        if (!search.value.trim()) d.style.display = hide ? "none" : "";
      });
    }
    updateDeps();

    const onChange = (e: Event) => {
      if ((e.target as HTMLElement).hasAttribute("data-search")) return;
      updateDeps();
      refresh();
      if (search.value.trim()) runSearch();
    };
    const onInput = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.hasAttribute("data-search") || t.tagName === "SELECT") return;
      refresh();
    };
    root.addEventListener("change", onChange);
    root.addEventListener("input", onInput);

    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    const onSave = () => {
      snap();
      refresh();
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
      }, 1800);
    };
    const onDiscard = () => {
      controls.forEach((c) => {
        const b = baseline.get(c);
        if (c.type === "checkbox" || c.type === "radio") c.checked = b;
        else c.value = b;
      });
      updateDeps();
      refresh();
      if (search.value.trim()) runSearch();
    };
    const saveBtn = saveBar.querySelector("[data-save]") as HTMLElement;
    const discardBtn = saveBar.querySelector("[data-discard]") as HTMLElement;
    saveBtn.addEventListener("click", onSave);
    discardBtn.addEventListener("click", onDiscard);

    // ---- sticky search bar shadow on scroll ----
    const bar = root.querySelector("[data-searchbar]") as HTMLElement;
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const stuck = y > 4;
      bar.style.boxShadow = stuck ? "0 8px 22px rgba(28,26,22,.07)" : "none";
      bar.style.borderBottomColor = stuck ? "var(--line)" : "transparent";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ---- nav active state ----
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byId: any = {};
    navLinks.forEach(
      (a) => (byId[(a.getAttribute("href") || "").slice(1)] = a),
    );
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((en) => {
          if (en.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("active"));
            const a = byId[en.target.id];
            if (a) a.classList.add("active");
          }
        });
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );
    sections.forEach((s) => io.observe(s));

    return () => {
      search.removeEventListener("input", runSearch);
      clearBtn.removeEventListener("click", doClear);
      clear2.removeEventListener("click", doClear);
      root.removeEventListener("change", onChange);
      root.removeEventListener("input", onInput);
      saveBtn.removeEventListener("click", onSave);
      discardBtn.removeEventListener("click", onDiscard);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, []);

  return (
    <div
      className="wh-settings"
      ref={containerRef}
      style={{ background: "#e9e6df" }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </div>
  );
}
