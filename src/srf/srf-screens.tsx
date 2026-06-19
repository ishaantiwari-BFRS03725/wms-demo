// @ts-nocheck
/* eslint-disable */
/* SRF 2.0 reference screens — design components copy-pasted verbatim from ~/Downloads/SRF 2.0/components/.
   Runtime stubbed (useApp/go/Modal are no-ops) — STATIC MOCKUPS, not functional. Do not hand-edit; re-port from source. */
import React, { useState } from "react";

const go = () => {};
const Modal = () => null;
const useApp = () => ({
  go,
  approvals: typeof APPROVALS !== "undefined" ? APPROVALS : [],
  resolveApproval: () => {},
  notify: () => {},
  open: () => {},
  close: () => {},
  modal: null,
});

/* ============================ data.jsx ============================ */
// data.jsx — realistic warehouse data for the prototype

const SITE = { code: 'BLR-01', name: 'Bengaluru FC 01', tz: 'IST' };

const VEHICLES_AT_GATE = [
  {
    id: 'GT-1042', reg: 'KA-05-AB-8821', vendor: 'Hindustan Unilever', vendorId: 'V-2041',
    vendorScore: 88, loadType: 'FMCG · Dry', asn: 'ASN-2041-7782',
    eta: '09:42', arrived: '09:38', pallets: 12, cases: 384, priority: 'std',
    cutoff: null,
  },
  {
    id: 'GT-1043', reg: 'TN-09-CF-2210', vendor: 'Amul Dairy Cold', vendorId: 'V-1108',
    vendorScore: 94, loadType: 'Cold chain · 2–8°C', asn: 'ASN-1108-3340',
    eta: '09:55', arrived: '09:51', pallets: 6, cases: 180, priority: 'cold',
    cutoff: '11:00',
  },
  {
    id: 'GT-1044', reg: 'KA-01-PQ-7732', vendor: 'Reckitt Benckiser', vendorId: 'V-2712',
    vendorScore: 62, loadType: 'Personal care · Dry', asn: 'ASN-2712-5519',
    eta: '10:05', arrived: '10:02', pallets: 9, cases: 212, priority: 'std',
    cutoff: null,
  },
  {
    id: 'GT-1045', reg: 'MH-14-JK-0091', vendor: 'LG Electronics', vendorId: 'V-3301',
    vendorScore: 71, loadType: 'Oversize · Fragile', asn: null,
    eta: '10:10', arrived: '10:12', pallets: 4, cases: 24, priority: 'fragile',
    cutoff: null,
  },
];

const DOCKS = [
  { id: 'D-01', type: 'dry',  status: 'busy',    until: '10:20', who: 'GT-1039' },
  { id: 'D-02', type: 'dry',  status: 'free' },
  { id: 'D-03', type: 'dry',  status: 'busy',    until: '10:45', who: 'GT-1040' },
  { id: 'D-04', type: 'cold', status: 'free' },
  { id: 'D-05', type: 'cold', status: 'busy',    until: '11:30', who: 'GT-1041' },
  { id: 'D-06', type: 'dry',  status: 'free' },
  { id: 'D-07', type: 'oversize', status: 'free' },
  { id: 'D-08', type: 'dry',  status: 'blocked', until: '13:00', who: 'Maintenance' },
];

const GRN_LINES = [
  { sku: 'HUL-RIN-BR-500', name: 'Rin Detergent Bar · 500g', expected: 48, scanned: 48, batch: 'B-A7431', exp: '2027-02', status: 'ok' },
  { sku: 'HUL-LUX-SP-125', name: 'Lux Soap · 125g (Pink)', expected: 120, scanned: 120, batch: 'B-A7432', exp: '2027-08', status: 'ok' },
  { sku: 'HUL-SRF-PW-1KG', name: 'Surf Excel Powder · 1 kg', expected: 60, scanned: 54, batch: 'B-A7433', exp: '2026-11', status: 'short' },
  { sku: 'HUL-CLR-SH-180', name: 'Clinic Plus Shampoo · 180 ml', expected: 72, scanned: 72, batch: 'B-A7434', exp: '2027-04', status: 'ok' },
  { sku: 'HUL-VIM-LQ-750', name: 'Vim Liquid · 750 ml', expected: 48, scanned: 48, batch: 'B-A7435', exp: '2027-01', status: 'ok' },
  { sku: 'HUL-DOV-SP-100', name: 'Dove Soap · 100g', expected: 36, scanned: 32, batch: 'B-A7436', exp: '2026-09', status: 'damage' },
];

const QC_QUEUE = [
  { id: 'QC-8841', grn: 'GRN-2026-1234', vendor: 'HUL', vendorScore: 88, lines: 6, sla: '45m', sample: '15%', priority: 'std' },
  { id: 'QC-8842', grn: 'GRN-2026-1235', vendor: 'Reckitt', vendorScore: 62, lines: 4, sla: '15m', sample: '100%', priority: 'high' },
  { id: 'QC-8843', grn: 'GRN-2026-1236', vendor: 'Amul', vendorScore: 94, lines: 3, sla: '1h 20m', sample: '5%', priority: 'std' },
  { id: 'QC-8844', grn: 'GRN-2026-1237', vendor: 'Nestle', vendorScore: 81, lines: 5, sla: '55m', sample: '10%', priority: 'std' },
];

const PUTAWAY_QUEUE = [
  { id: 'PW-20462', sku: 'HUL-RIN-BR-500', qty: 48, batch: 'B-A7431', bin: 'P-A12', alt: ['P-A14','F-B05'], conf: 92, reasons: ['Pick zone · 65% full','FEFO match','45m from pack'] },
  { id: 'PW-20463', sku: 'HUL-LUX-SP-125', qty: 120, batch: 'B-A7432', bin: 'P-B08', alt: ['P-B10','F-C02'], conf: 87, reasons: ['Velocity A class','Adjacent to pick face','Low aisle traffic'] },
  { id: 'PW-20464', sku: 'HUL-CLR-SH-180', qty: 72, batch: 'B-A7434', bin: 'P-C21', alt: ['P-C19','F-D11'], conf: 78, reasons: ['Category affinity','FEFO ok','60m from pack'] },
  { id: 'PW-20465', sku: 'HUL-VIM-LQ-750', qty: 48, batch: 'B-A7435', bin: 'P-D05', alt: ['P-D07','F-B12'], conf: 90, reasons: ['Velocity B class','Slot open','FEFO match'] },
];

const APPROVALS = [
  { id: 'AP-551', kind: 'GRN variance', who: 'Receiving Agent', src: 'GRN-2026-1234', diff: '-10% on SURF-EX 1kg', impact: '1 line · ₹ 4,320', age: '3m', sev: 'med' },
  { id: 'AP-552', kind: 'QC reject', who: 'Receiving Agent', src: 'QC-8842', diff: 'Reject 42/60 units · chargeback ₹ 18,900', impact: '1 vendor', age: '7m', sev: 'high' },
  { id: 'AP-553', kind: 'Putaway override', who: 'R. Singh', src: 'PW-20460', diff: 'P-A14 → F-B12 (bin full)', impact: '1 task', age: '12m', sev: 'low' },
  { id: 'AP-554', kind: 'Dock reassign', who: 'Dock Agent', src: 'GT-1044', diff: 'D-06 → D-02 (load balance)', impact: '1 vehicle', age: '14m', sev: 'low' },
];

const ALERTS = [
  { t: 'Cold-chain cutoff nearing', d: 'GT-1043 Amul · 1h 4m to 11:00 cutoff', sev: 'high', age: '2m' },
  { t: 'Vendor variance trending up', d: 'Reckitt · 12% avg · +4pp vs 7d', sev: 'med', age: '22m' },
  { t: 'Bin P-A14 unreachable', d: 'Reported by R. Singh · facilities paged', sev: 'med', age: '35m' },
  { t: 'Dock D-08 under maintenance', d: 'Expected free 13:00', sev: 'low', age: '2h' },
];

const SHIFT_THROUGHPUT = [22,28,34,31,40,44,38,46,51,48,42,39,44,47,52,49,44,41,38,36,33,28,24,20];

const ROLES = [
  { id: 'operator',   name: 'R. Singh',   title: 'Warehouse operator',     sub: 'Handheld · Putaway team',   home: 'op_home',   shift: 'Morning · 06:00–14:00' },
  { id: 'qc',         name: 'S. Iyer',    title: 'QC operator',            sub: 'Station 2 · Inbound QC',    home: 'qc_home',   shift: 'Morning · 06:00–14:00' },
  { id: 'supervisor', name: 'A. Mehta',   title: 'Shift supervisor',       sub: 'Site BLR-01',                home: 'dashboard', shift: 'Morning · 06:00–14:00' },
  { id: 'manager',    name: 'V. Shah',    title: 'Warehouse manager',      sub: 'Site BLR-01',                home: 'mgr_home',  shift: 'Day · 09:00–18:00' },
  { id: 'tower',      name: 'D. Pillai',  title: 'Control tower',          sub: '9 sites · Network ops',      home: 'ct_home',   shift: 'Always on' },
  { id: 'finance',    name: 'K. Menon',   title: 'Finance / billing ops',  sub: 'Commercial recovery',        home: 'fin_home',  shift: 'Day · 09:00–18:00' },
  { id: 'admin',      name: 'T. Ravi',    title: 'Admin / AI ops',         sub: 'Platform · config owner',    home: 'adm_home',  shift: 'Day · 09:00–18:00' },
];

const NETWORK_SITES = [
  { code:'BLR-01', name:'Bengaluru 01', sla:98.2, risk:17, tp:420, status:'ok' },
  { code:'BLR-02', name:'Bengaluru 02', sla:96.4, risk:42, tp:380, status:'watch' },
  { code:'MUM-01', name:'Mumbai 01',    sla:97.1, risk:28, tp:510, status:'ok' },
  { code:'MUM-02', name:'Mumbai 02',    sla:92.8, risk:88, tp:440, status:'risk' },
  { code:'DEL-01', name:'Delhi 01',     sla:98.6, risk:9,  tp:470, status:'ok' },
  { code:'DEL-02', name:'Delhi 02',     sla:97.8, risk:21, tp:360, status:'ok' },
  { code:'HYD-01', name:'Hyderabad 01', sla:95.2, risk:54, tp:290, status:'watch' },
  { code:'PUN-01', name:'Pune 01',      sla:98.0, risk:12, tp:320, status:'ok' },
  { code:'KOL-01', name:'Kolkata 01',   sla:94.4, risk:61, tp:260, status:'watch' },
];

const BILLING_CASES = [
  { id:'BL-2241', customer:'Zepto Retail',   period:'Mar 2026', amount:142500, type:'Storage overage',     evidence:'Complete',  conf:94, age:'1d' },
  { id:'BL-2242', customer:'BlueStar Ltd',   period:'Mar 2026', amount:86400,  type:'VAS undercharged',    evidence:'Complete',  conf:88, age:'2d' },
  { id:'BL-2243', customer:'Nova Foods',     period:'Mar 2026', amount:58200,  type:'Handling — oversize', evidence:'Partial',   conf:71, age:'3d' },
  { id:'BL-2244', customer:'UrbanKart',      period:'Mar 2026', amount:212000, type:'Returns processing',  evidence:'Complete',  conf:91, age:'2d' },
  { id:'BL-2245', customer:'Goodlife Co',    period:'Mar 2026', amount:34500,  type:'Cold-chain surcharge',evidence:'Complete',  conf:86, age:'4d' },
  { id:'BL-2246', customer:'Bennett Retail', period:'Mar 2026', amount:98700,  type:'Peak handling',       evidence:'Missing',   conf:58, age:'5d' },
];

const AGENT_INVENTORY = [
  { n:'Dock Scheduling',      status:'live',   level:'L1', acc:88, runs:1284, drift:0,  site:'all' },
  { n:'Receiving · variance', status:'live',   level:'L2', acc:76, runs:812,  drift:-2, site:'all' },
  { n:'Receiving · QC plan',  status:'live',   level:'L2', acc:81, runs:812,  drift:1,  site:'all' },
  { n:'Putaway',              status:'live',   level:'L1', acc:84, runs:2104, drift:3,  site:'all' },
  { n:'Damage classifier',    status:'shadow', level:'L0', acc:72, runs:412,  drift:null, site:'BLR-01' },
  { n:'Allocation',           status:'live',   level:'L3', acc:79, runs:4210, drift:-4, site:'all' },
  { n:'Wave planner',         status:'live',   level:'L2', acc:72, runs:308,  drift:-6, site:'all' },
  { n:'Exception triage',     status:'live',   level:'L2', acc:68, runs:940,  drift:2,  site:'all' },
  { n:'Handover delay',       status:'shadow', level:'L0', acc:74, runs:520,  drift:null, site:'all' },
  { n:'Returns disposition',  status:'shadow', level:'L0', acc:64, runs:180,  drift:null, site:'BLR-01' },
  { n:'Billing leakage',      status:'live',   level:'L2', acc:58, runs:68,   drift:0,  site:'all' },
  { n:'Copilot',              status:'live',   level:'L1', acc:82, runs:1840, drift:4,  site:'all' },
];

const POLICIES = [
  { id:'P-001', agent:'Receiving',   rule:'Variance auto-accept threshold', value:'< 2% AND vendor score ≥ 80', editedBy:'T. Ravi', at:'12 Apr' },
  { id:'P-002', agent:'Receiving',   rule:'QC sampling by vendor tier',     value:'A:5% · B:15% · C:100%',      editedBy:'T. Ravi', at:'04 Apr' },
  { id:'P-003', agent:'Putaway',     rule:'Max distance from pick face',    value:'60 meters',                   editedBy:'V. Shah', at:'18 Mar' },
  { id:'P-004', agent:'Allocation',  rule:'Auto-commit confidence',         value:'≥ 85% AND not split',         editedBy:'T. Ravi', at:'02 Apr' },
  { id:'P-005', agent:'Billing',     rule:'Manager approval threshold',     value:'≥ ₹ 1,00,000',                editedBy:'K. Menon', at:'28 Mar' },
];

const OPERATOR_TASKS = [
  { id:'PW-20462', kind:'Putaway', sku:'HUL-RIN-BR-500', detail:'48 units → P-A12',  sla:'20m', priority:'std'  },
  { id:'PW-20463', kind:'Putaway', sku:'HUL-LUX-SP-125', detail:'120 units → P-B08', sla:'45m', priority:'std'  },
  { id:'PW-20464', kind:'Putaway', sku:'HUL-CLR-SH-180', detail:'72 units → P-C21',  sla:'1h',  priority:'std'  },
  { id:'RP-441',   kind:'Replen',  sku:'HUL-VIM-LQ-750', detail:'F-B12 → P-D05',     sla:'15m', priority:'high' },
];

const NETWORK_STUCK = [
  { id:'SO-88712', site:'MUM-02', age:'2h 10m', cause:'Allocation · no-stock',   owner:'—' },
  { id:'SO-88713', site:'MUM-02', age:'1h 42m', cause:'Handover · carrier late', owner:'Tower' },
  { id:'SO-88714', site:'KOL-01', age:'1h 18m', cause:'Pick exception',          owner:'Supervisor' },
  { id:'SO-88715', site:'BLR-02', age:'58m',     cause:'QC hold',                 owner:'QC' },
];

/* ===== OUTBOUND ===== */
const ORDER_POOL = [
  { id:'SO-88720', customer:'Zepto · BLR-Indiranagar', channel:'Q-comm', sla:'45m', cutoff:'12:00', lines:8,  units:14, value:2840,  zone:'P-A', status:'ready',     priority:'rush', conf:96 },
  { id:'SO-88721', customer:'Bigbasket · BLR-Koramangala', channel:'E-comm', sla:'4h', cutoff:'14:00', lines:5, units:9, value:1680, zone:'P-B', status:'ready',     priority:'std',  conf:91 },
  { id:'SO-88722', customer:'D-Mart · MYS-Saraswatipuram', channel:'B2B', sla:'24h', cutoff:'18:00', lines:42, units:980, value:184500, zone:'F-A', status:'ready',  priority:'std',  conf:88 },
  { id:'SO-88723', customer:'Reliance Smart · BLR-Whitefield', channel:'B2B', sla:'24h', cutoff:'18:00', lines:36, units:720, value:142800, zone:'F-B', status:'ready', priority:'std', conf:84 },
  { id:'SO-88724', customer:'Zepto · BLR-HSR', channel:'Q-comm', sla:'45m', cutoff:'12:15', lines:6, units:11, value:2120, zone:'P-A', status:'short',    priority:'rush', conf:62 },
  { id:'SO-88725', customer:'Swiggy Instamart · BLR-Jayanagar', channel:'Q-comm', sla:'45m', cutoff:'12:30', lines:9, units:18, value:3420, zone:'P-A', status:'ready', priority:'rush', conf:94 },
  { id:'SO-88726', customer:'Nykaa · MUM-Andheri (transfer)', channel:'STO', sla:'24h', cutoff:'20:00', lines:24, units:480, value:96400, zone:'F-C', status:'ready', priority:'std', conf:79 },
  { id:'SO-88727', customer:'Apollo Pharmacy · BLR-Marathahalli', channel:'B2B', sla:'8h', cutoff:'17:00', lines:14, units:112, value:38900, zone:'P-C', status:'ready', priority:'std', conf:90 },
];

const WAVES = [
  { id:'WV-4421', kind:'Q-comm rush',  orders:14, lines:96,  units:184, route:'Cluster · 6 stops', cutoff:'12:00', status:'releasing', conf:93, agents:['Wave planner','Allocation'] },
  { id:'WV-4422', kind:'E-comm batch', orders:38, lines:212, units:472, route:'Zone P · cart-pick', cutoff:'14:00', status:'queued',    conf:87, agents:['Wave planner'] },
  { id:'WV-4423', kind:'B2B pallet',   orders:6,  lines:182, units:2840, route:'Zone F · pallet-pick', cutoff:'18:00', status:'queued',  conf:81, agents:['Wave planner','Allocation'] },
  { id:'WV-4424', kind:'STO transfer', orders:4,  lines:64,  units:1280, route:'Zone F · split-case', cutoff:'20:00', status:'draft',    conf:76, agents:['Wave planner'] },
];

const PICK_LINES = [
  { id:'PL-1', wave:'WV-4421', so:'SO-88720', sku:'HUL-LUX-SP-125', name:'Lux Soap · 125g', bin:'P-A04', qty:6, status:'done',    picker:'R. Singh' },
  { id:'PL-2', wave:'WV-4421', so:'SO-88720', sku:'HUL-VIM-LQ-750', name:'Vim Liquid · 750ml', bin:'P-A12', qty:2, status:'done', picker:'R. Singh' },
  { id:'PL-3', wave:'WV-4421', so:'SO-88720', sku:'HUL-CLR-SH-180', name:'Clinic Plus · 180ml', bin:'P-A18', qty:3, status:'active', picker:'R. Singh' },
  { id:'PL-4', wave:'WV-4421', so:'SO-88720', sku:'HUL-RIN-BR-500', name:'Rin Bar · 500g', bin:'P-A22', qty:3, status:'queued', picker:'R. Singh' },
  { id:'PL-5', wave:'WV-4421', so:'SO-88725', sku:'HUL-DOV-SP-100', name:'Dove Soap · 100g', bin:'P-A09', qty:6, status:'short', picker:'M. Das', alt:'P-B11' },
  { id:'PL-6', wave:'WV-4421', so:'SO-88725', sku:'HUL-SRF-PW-1KG', name:'Surf Excel · 1kg', bin:'P-A14', qty:4, status:'queued', picker:'M. Das' },
];

const PACK_QUEUE = [
  { id:'PK-9921', so:'SO-88720', items:14, dim:'M (340×280×220)', weight:'4.2 kg', carton:'C2', value:2840,  fragile:false, ai:{ carton:'C2', conf:94, void:8,  reasons:['Volume fit 88%','Std cube · drop-tested'] } },
  { id:'PK-9922', so:'SO-88725', items:18, dim:'L (440×340×260)', weight:'5.1 kg', carton:'C3', value:3420, fragile:false, ai:{ carton:'C3', conf:91, void:12, reasons:['Volume fit 82%','Aisle ≤ 25kg'] } },
  { id:'PK-9923', so:'SO-88727', items:112, dim:'XL (560×420×320)', weight:'18.4 kg', carton:'C5+pad', value:38900, fragile:true, ai:{ carton:'C5', conf:78, void:18, reasons:['Glass items detected','Pad recommended','Split into 2 if > 22kg'] } },
];

const MANIFEST = [
  { id:'MF-7711', carrier:'Delhivery',  service:'Express · 24h', dropoff:'14:00', cartons:84,  weight:'412 kg',  status:'sealing', conf:92, alts:[{c:'BlueDart', cost:'+8%', sla:'12h'}, {c:'Ekart', cost:'-12%', sla:'24h'}] },
  { id:'MF-7712', carrier:'Ekart',      service:'Std · 48h',     dropoff:'16:00', cartons:212, weight:'984 kg',  status:'open',     conf:88, alts:[{c:'XpressBees', cost:'-4%', sla:'48h'}] },
  { id:'MF-7713', carrier:'BlueDart',   service:'Cold · 24h',    dropoff:'15:30', cartons:32,  weight:'162 kg',  status:'open',     conf:94, alts:[] },
  { id:'MF-7714', carrier:'Self-fleet', service:'Cluster · BLR', dropoff:'12:00', cartons:18,  weight:'78 kg',   status:'sealing',  conf:90, alts:[{c:'Dunzo', cost:'+22%', sla:'45m'}] },
];

/* ===== REVERSE ===== */
const RETURNS_INBOUND = [
  { id:'RT-3341', so:'SO-88102', customer:'Zepto · BLR-Indiranagar', reason:'Damaged on arrival',     items:2, value:480,  age:'2h', photos:3, ai:{ disp:'Quarantine · vendor recovery', conf:88 } },
  { id:'RT-3342', so:'SO-88087', customer:'Bigbasket · BLR-Kora',    reason:'Wrong item',             items:1, value:340,  age:'4h', photos:2, ai:{ disp:'Restock · A-grade',          conf:92 } },
  { id:'RT-3343', so:'SO-88054', customer:'D-Mart · MYS',            reason:'Customer refused',       items:18,value:3680, age:'1d', photos:0, ai:{ disp:'Restock · sealed cartons',   conf:84 } },
  { id:'RT-3344', so:'SO-87991', customer:'Apollo · BLR',            reason:'Expired (FEFO miss)',    items:6, value:2240, age:'1d', photos:5, ai:{ disp:'Scrap · loss event',         conf:95 } },
  { id:'RT-3345', so:'SO-88012', customer:'Nykaa · MUM (STO)',       reason:'Overage',                items:12,value:1620, age:'2d', photos:0, ai:{ disp:'Restock · B-grade',          conf:78 } },
];

const DISPOSITION_RULES = [
  { cat:'Restock A-grade', when:'Sealed · within FEFO ≥ 6mo · no damage',          target:'Pick zone · same SKU bin', valueRecover:'100%' },
  { cat:'Restock B-grade', when:'Open or repacked · FEFO ≥ 3mo · cosmetic only',  target:'Discount channel · zone D', valueRecover:'70%' },
  { cat:'Vendor recovery', when:'Manufacturer defect · within window',             target:'Quarantine Q-01 · chargeback', valueRecover:'80%' },
  { cat:'Scrap',           when:'Expired · contamination · safety risk',           target:'Scrap log · disposal',     valueRecover:'0%' },
];

/* ===== CONTROL TOWER · CARRIERS / INCIDENTS ===== */
const CARRIERS = [
  { c:'Delhivery',    onTime:96.4, lost:0.04, cost:'baseline', vol:'34%', drift:+1.2 },
  { c:'BlueDart',     onTime:97.8, lost:0.02, cost:'+8%',      vol:'18%', drift:+0.4 },
  { c:'Ekart',        onTime:94.2, lost:0.07, cost:'-12%',     vol:'22%', drift:-0.8 },
  { c:'XpressBees',   onTime:93.1, lost:0.09, cost:'-4%',      vol:'14%', drift:-2.4 },
  { c:'Self-fleet',   onTime:98.6, lost:0.01, cost:'+22%',     vol:'12%', drift:+0.2 },
];

const INCIDENTS = [
  { id:'IN-552', site:'MUM-02', t:'Allocation engine slow', age:'18m', sev:'high', owner:'Platform', status:'investigating' },
  { id:'IN-551', site:'KOL-01', t:'Carrier late pickup (Ekart)', age:'1h 22m', sev:'med',  owner:'Tower',    status:'mitigating' },
  { id:'IN-550', site:'BLR-02', t:'Bin scanner offline · aisle 4', age:'2h 4m', sev:'low',  owner:'Site',     status:'resolved' },
];

/* ===== ADMIN: USERS + AUDIT + DRIFT ===== */
const USERS = [
  { name:'A. Mehta',  role:'Shift supervisor', site:'BLR-01', active:'now',     sso:'Okta', acc:99.0 },
  { name:'V. Shah',   role:'Warehouse manager', site:'BLR-01', active:'2m ago', sso:'Okta', acc:null },
  { name:'R. Singh',  role:'Operator',          site:'BLR-01', active:'now',    sso:'Okta', acc:99.2 },
  { name:'S. Iyer',   role:'QC operator',       site:'BLR-01', active:'now',    sso:'Okta', acc:99.5 },
  { name:'D. Pillai', role:'Control tower',     site:'NW',     active:'now',    sso:'Okta', acc:null },
  { name:'K. Menon',  role:'Finance',           site:'HQ',     active:'1h ago', sso:'Okta', acc:null },
  { name:'T. Ravi',   role:'Admin',             site:'HQ',     active:'now',    sso:'Okta', acc:null },
];

const AUDIT_LOG = [
  { t:'10:14', who:'A. Mehta',     act:'Approved', detail:'GRN variance AP-551 · Surf Excel -10%', src:'Approvals' },
  { t:'10:11', who:'Putaway agent', act:'Recommended', detail:'PW-20465 → P-D05 (conf 90%)', src:'Agent' },
  { t:'10:08', who:'R. Singh',     act:'Override', detail:'PW-20460 P-A14 → F-B12 · reason: bin full', src:'Handheld' },
  { t:'10:02', who:'T. Ravi',      act:'Edited policy', detail:'P-002 QC sampling · B 10% → 15%', src:'Policies' },
  { t:'09:54', who:'Dock agent',   act:'Recommended', detail:'GT-1044 → D-02 (load balance)',     src:'Agent' },
  { t:'09:47', who:'V. Shah',      act:'Approved', detail:'BL-2244 chargeback ₹ 2.12L', src:'Billing' },
];

const DRIFT_SERIES = {
  'Receiving · variance': [82,80,79,78,76,77,76,75,76,76,75,74],
  'Allocation':            [86,85,84,82,82,81,80,79,79,79,79,79],
  'Wave planner':          [82,80,78,77,76,74,73,72,71,72,72,72],
};


/* ============================ core-ops-data.jsx ============================ */
// core-ops-data.jsx — Data for 9 core ops workflows

const GATE_INBOUND = [
  { id:'GP-7711', type:'PO',  ref:'PO-22041', vendor:'ACME Foods',       vehicle:'KA-05-AB-8821', driver:'R. Kumar',   pallets:12, cases:384, eta:'09:42', arrived:'09:38', status:'pending', priority:'std',  asn:'ASN-2041-7782' },
  { id:'GP-7712', type:'PO',  ref:'PO-22055', vendor:'Northpole Dairy',  vehicle:'TN-09-CF-2210', driver:'S. Lal',     pallets:6,  cases:180, eta:'09:55', arrived:'09:51', status:'cleared', priority:'cold', asn:'ASN-1108-3340', dock:'D-04' },
  { id:'GP-7713', type:'STN', ref:'STN-3022', vendor:'MUM-01 → BLR-01',  vehicle:'KA-01-PQ-7732', driver:'M. Singh',   pallets:9,  cases:212, eta:'10:05', arrived:'10:02', status:'security', priority:'std' },
  { id:'GP-7714', type:'PO',  ref:'PO-22078', vendor:'Halo Apparel',     vehicle:'MH-14-JK-0091', driver:'K. Roy',     pallets:4,  cases:24,  eta:'10:10', arrived:'10:12', status:'pending', priority:'fragile', asn:null },
  { id:'GP-7715', type:'STN', ref:'STN-3025', vendor:'HYD-01 → BLR-01',  vehicle:'AP-09-RT-4421', driver:'V. Naidu',   pallets:18, cases:540, eta:'10:30', arrived:null, status:'awaited', priority:'std' },
];

const GATEPASS_LOG = [
  { id:'GP-7708', ref:'PO-22038', vehicle:'KA-02-XR-7281', issuedTo:'ACME Foods', sealNo:'SL-44128', issuedAt:'08:42', clearedAt:'09:15', supervisor:'A. Mehta', status:'cleared' },
  { id:'GP-7709', ref:'PO-22039', vehicle:'KA-03-LM-9921', issuedTo:'Greenleaf', sealNo:'SL-44129', issuedAt:'09:02', clearedAt:'09:24', supervisor:'A. Mehta', status:'cleared' },
  { id:'GP-7710', ref:'STN-3020', vehicle:'KA-04-AB-1142', issuedTo:'CHN-01',    sealNo:'SL-44130', issuedAt:'09:18', clearedAt:'09:38', supervisor:'A. Mehta', status:'cleared' },
  { id:'GP-7712', ref:'PO-22055', vehicle:'TN-09-CF-2210', issuedTo:'Northpole', sealNo:'SL-44131', issuedAt:'09:55', clearedAt:null,    supervisor:'A. Mehta', status:'active' },
];

const UNLOADING = [
  { id:'UL-2204', dock:'D-04', vehicle:'TN-09-CF-2210', ref:'PO-22055', vendor:'Northpole Dairy', totalCases:180, unloaded:142, started:'10:02', sla:90, slaUsed:32, lead:'P. Kumar', priority:'cold' },
  { id:'UL-2205', dock:'D-02', vehicle:'KA-05-AB-8821', ref:'PO-22041', vendor:'ACME Foods',      totalCases:384, unloaded:48,  started:'10:08', sla:120, slaUsed:18, lead:'M. Das',   priority:'std' },
  { id:'UL-2206', dock:'D-06', vehicle:'KA-01-PQ-7732', ref:'STN-3022', vendor:'MUM-01 → BLR-01', totalCases:212, unloaded:0,   started:null,    sla:90, slaUsed:0, lead:'—', priority:'std' },
];

const PUTAWAY_SUGGEST = [
  {
    id:'PWS-9912', sku:'SKU-3318', name:'Greenleaf Iced Tea · 500ml', qty:240, batch:'B-7821', exp:'2027-04',
    suggested:'A-12-04',
    score:92,
    factors:[
      { f:'Velocity class A · pick-zone preferred', w:30, s:30 },
      { f:'FEFO match · existing batch exp 2027-03', w:25, s:24 },
      { f:'Zone affinity (beverage family)', w:20, s:18 },
      { f:'Distance from pack lane', w:15, s:11 },
      { f:'Capacity headroom (62% full)', w:10, s:9 },
    ],
    alts:[
      { bin:'A-12-08', score:84, reason:'Lower velocity match · empty bin' },
      { bin:'C-04-12', score:71, reason:'Family affinity OK · 28m further' },
    ],
  },
  {
    id:'PWS-9913', sku:'SKU-2204', name:'ACME Cereal · 750g', qty:96, batch:'B-7822', exp:'2026-12',
    suggested:'B-08-02', score:78,
    factors:[
      { f:'Velocity class B', w:30, s:21 },
      { f:'FEFO exp Dec 2026', w:25, s:18 },
      { f:'Family affinity (dry packaged)', w:20, s:16 },
      { f:'Distance score', w:15, s:13 },
      { f:'Capacity headroom (34% full)', w:10, s:10 },
    ],
    alts:[
      { bin:'B-08-05', score:74, reason:'Same row · slightly less velocity' },
      { bin:'B-09-01', score:69, reason:'New bin · no affinity yet' },
    ],
  },
  {
    id:'PWS-9914', sku:'SKU-1102', name:'Northpole Cold Brew · 250ml', qty:120, batch:'B-7823', exp:'2026-08',
    suggested:'COLD-A-02-01', score:88,
    factors:[
      { f:'Cold-chain bin required', w:35, s:35 },
      { f:'FEFO exp Aug 2026 · short-life', w:25, s:24 },
      { f:'Velocity class B', w:20, s:14 },
      { f:'Distance from cold-pack lane', w:10, s:8 },
      { f:'Capacity headroom', w:10, s:7 },
    ],
    alts:[
      { bin:'COLD-A-02-04', score:81, reason:'Cold zone · further from pack' },
    ],
  },
];

const PICKLISTS = [
  { id:'PL-4421', wave:'WV-2204', orders:14, lines:96, units:184, zone:'A', strategy:'cluster · 6 stops', assignedTo:'R. Singh', status:'active', progress:54, sla:'cutoff 12:00' },
  { id:'PL-4422', wave:'WV-2204', orders:8,  lines:52, units:108, zone:'B', strategy:'discrete',          assignedTo:'M. Das',   status:'active', progress:31, sla:'cutoff 12:00' },
  { id:'PL-4423', wave:'WV-2205', orders:38, lines:212, units:472, zone:'A+B', strategy:'cart-pick',      assignedTo:null,        status:'queued', progress:0,  sla:'cutoff 14:00' },
  { id:'PL-4424', wave:'WV-2206', orders:6,  lines:182, units:2840, zone:'F-pallet', strategy:'pallet',   assignedTo:null,        status:'queued', progress:0,  sla:'cutoff 18:00' },
  { id:'PL-4425', wave:'WV-2206', orders:4,  lines:64, units:1280, zone:'F-case', strategy:'split-case',  assignedTo:null,        status:'draft',  progress:0,  sla:'cutoff 20:00' },
];

const PICKERS_ROSTER = [
  { name:'R. Singh', zone:'A',   exp:'2y', rate:42, load:54, status:'picking' },
  { name:'M. Das',   zone:'B',   exp:'1y', rate:38, load:31, status:'picking' },
  { name:'P. Kumar', zone:'A',   exp:'3y', rate:51, load:0,  status:'idle'    },
  { name:'N. Rao',   zone:'B',   exp:'8m', rate:34, load:0,  status:'idle'    },
  { name:'V. Lal',   zone:'C',   exp:'4y', rate:48, load:18, status:'picking' },
  { name:'S. Iyer',  zone:'F',   exp:'2y', rate:22, load:0,  status:'idle'    },
];

const SORT_LANES = [
  { lane:'L-01', kind:'Q-comm rush', orders:14, sorted:11, pending:3,  destination:'Pack station P-01', status:'active',  cutoff:'12:00' },
  { lane:'L-02', kind:'E-comm std',  orders:38, sorted:24, pending:14, destination:'Pack station P-02', status:'active',  cutoff:'14:00' },
  { lane:'L-03', kind:'Fragile',     orders:6,  sorted:2,  pending:4,  destination:'Pack station P-03 (fragile)', status:'active', cutoff:'14:00' },
  { lane:'L-04', kind:'B2B pallet',  orders:6,  sorted:0,  pending:6,  destination:'Pallet wrap station', status:'queued', cutoff:'18:00' },
  { lane:'L-05', kind:'Oversize',    orders:2,  sorted:0,  pending:2,  destination:'Manual pack', status:'queued', cutoff:'18:00' },
];

const INBOUND_EXC = [
  { id:'EXC-IN-441', type:'Variance',   ref:'GRN-44128', vendor:'ACME Foods',      detail:'+8% on SKU-3318 (240 → 259)',   age:'12m', sev:'med',  owner:'Receiving', aiAct:'Auto-accept (vendor A-tier, <10% bound)' },
  { id:'EXC-IN-442', type:'Damage',     ref:'GRN-44129', vendor:'Halo Apparel',    detail:'6 of 24 cartons crushed corners', age:'24m', sev:'high', owner:'QC',         aiAct:'Quarantine + RTV evidence pack' },
  { id:'EXC-IN-443', type:'No ASN',     ref:'GP-7714',   vendor:'Halo Apparel',    detail:'Vehicle arrived without ASN',     age:'8m',  sev:'med',  owner:'Inbound',    aiAct:'Hold at marshalling · paged supervisor' },
  { id:'EXC-IN-444', type:'Cold breach',ref:'GRN-44131', vendor:'Northpole Dairy', detail:'Temp 6.4°C for 90m in transit',   age:'1h',  sev:'high', owner:'QC',         aiAct:'Quarantine · vendor recovery review' },
  { id:'EXC-IN-445', type:'Vehicle hold',ref:'GP-7713',  vendor:'STN MUM-01',      detail:'Seal SL-44130 broken at gate',    age:'14m', sev:'high', owner:'Security',   aiAct:'Block unload · supervisor + sender notified' },
  { id:'EXC-IN-446', type:'Short',      ref:'GRN-44128', vendor:'ACME Foods',      detail:'-3% on SKU-2204 (96 → 93)',       age:'18m', sev:'low',  owner:'Receiving', aiAct:'Auto-accept (within 5% bound)' },
];

const OUTBOUND_EXC = [
  { id:'EXC-OUT-881', type:'Short pick',     ref:'PL-4421',  order:'SO-44021', detail:'SKU-3318 → bin empty (system says 27)', age:'4m',  sev:'high', owner:'Supervisor', aiAct:'Propose substitute SKU-3320 (same family)' },
  { id:'EXC-OUT-882', type:'Stockout',       ref:'PL-4422',  order:'SO-44188', detail:'SKU-2204 unavailable across bins',       age:'9m',  sev:'high', owner:'Allocation', aiAct:'Re-allocate from MUM-01 · cost +₹ 220' },
  { id:'EXC-OUT-883', type:'Address fail',   ref:'MF-7712',  order:'SO-44204', detail:'PIN-code unserviceable by carrier',      age:'22m', sev:'med',  owner:'Carrier ops', aiAct:'Switch to BlueDart · +12% cost' },
  { id:'EXC-OUT-884', type:'Oversize',       ref:'PL-4424',  order:'SO-44091', detail:'Carton exceeds carrier dim limits',      age:'8m',  sev:'med',  owner:'Pack',        aiAct:'Split into 2 cartons · re-label' },
  { id:'EXC-OUT-885', type:'Sort mismatch',  ref:'L-02',     order:'SO-44316', detail:'Order in wrong lane (E-comm vs B2B)',    age:'6m',  sev:'low',  owner:'Sortation',   aiAct:'Move to L-04 · update manifest' },
  { id:'EXC-OUT-886', type:'Pack weight',    ref:'PK-9923',  order:'SO-43887', detail:'Weight +18% over expected · possible missing item', age:'3m',  sev:'high', owner:'Pack', aiAct:'Re-scan tote · hold label' },
];

const CYCLE_COUNTS = [
  { id:'CC-2204', kind:'ABC · A-class',  bins:42, counted:28, variance:1, accuracy:99.4, assignedTo:'P. Kumar', started:'09:00', sla:'12:00', status:'active' },
  { id:'CC-2205', kind:'Ad-hoc · bin',   bins:1,  counted:1,  variance:1, accuracy:0,    assignedTo:'M. Das',   started:'10:08', sla:'10:30', status:'discrepancy' },
  { id:'CC-2206', kind:'ABC · B-class',  bins:84, counted:0,  variance:0, accuracy:null, assignedTo:'N. Rao',   started:null,    sla:'15:00', status:'queued' },
  { id:'CC-2207', kind:'Snap · zone F',  bins:62, counted:62, variance:2, accuracy:98.8, assignedTo:'V. Lal',   started:'08:30', sla:'11:00', status:'review' },
];

const CYCLE_DISCREPANCY = [
  { bin:'A-12-04', sku:'SKU-3318', system:240, counted:236, delta:-4, value:208, suspect:'Pick error', age:'6m' },
  { bin:'B-08-02', sku:'SKU-2204', system:96,  counted:101, delta:+5, value:425, suspect:'Putaway misroute', age:'18m' },
  { bin:'C-04-12', sku:'SKU-4471', system:18,  counted:14,  delta:-4, value:1140, suspect:'Damage write-off pending', age:'2h' },
];


/* ============================ dashboard.jsx ============================ */
// dashboard.jsx — Supervisor dashboard

const Dashboard = () => {
  const { go, approvals } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Good morning, Anika.</h1>
          <div className="sub">SUPERVISOR · SITE BLR-01 · SHIFT 1</div>
        </div>
        <div className="act">
          <button className="btn">Export shift report</button>
          <button className="btn primary">Start floor walk</button>
        </div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile"><div className="k">Open tasks</div><div className="v">284</div><div className="d"><b>+12%</b> vs 7d avg</div></div>
        <div className="tile risk"><div className="k">SLA at risk</div><div className="v">17</div><div className="d">Inbound receipts · cutoff 11:00</div></div>
        <div className="tile ai"><div className="k">Approvals waiting</div><div className="v">{approvals.length}</div><div className="d">Oldest · 14m</div></div>
        <div className="tile"><div className="k">Labor utilization</div><div className="v">82%</div><div className="d">14 / 17 operators on floor</div></div>
      </div>

      <div className="row c2 mb-16">
        <div className="card">
          <div className="card-head"><h3>Inbound pipeline · now</h3><span className="meta">LIVE</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>Stage</th><th>In queue</th><th>Oldest</th><th>Throughput /h</th><th></th></tr></thead>
              <tbody>
                <tr className="clickable" onClick={() => go('gate')}><td><b>Gate & dock</b></td><td className="num">4</td><td className="num">12m</td><td className="num">6</td><td><span className="tag ok">on plan</span></td></tr>
                <tr className="clickable" onClick={() => go('receiving')}><td><b>Receiving / GRN</b></td><td className="num">3</td><td className="num">38m</td><td className="num">8</td><td><span className="tag warn">watch</span></td></tr>
                <tr className="clickable" onClick={() => go('qc')}><td><b>Quality control</b></td><td className="num">{QC_QUEUE.length}</td><td className="num">22m</td><td className="num">5</td><td><span className="tag ok">on plan</span></td></tr>
                <tr className="clickable" onClick={() => go('putaway')}><td><b>Putaway</b></td><td className="num">{PUTAWAY_QUEUE.length}</td><td className="num">8m</td><td className="num">12</td><td><span className="tag ok">on plan</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card ai-accent">
          <div className="card-head"><h3>Agent recommendations</h3><span className="tag ai nodot">LIVE</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 10 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', marginBottom: 4 }}><b>Swap D-06 → D-02</b> for GT-1044 (Reckitt)</div>
              <div className="small">Balances queue · frees D-06 for cold chain GT-1043. Confidence 86%.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary" onClick={() => go('gate')}>Review</button><button className="btn ghost">Dismiss</button></div>
            </div>
            <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 10 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', marginBottom: 4 }}><b>100% QC</b> on QC-8842 (Reckitt · score 62)</div>
              <div className="small">Vendor variance trending up · sampling rule auto-escalated.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary" onClick={() => go('qc')}>Open QC</button><button className="btn ghost">Why</button></div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', marginBottom: 4 }}><b>Hold Vim 750ml</b> in quarantine bin Q-02</div>
              <div className="small">Damage photo classifier · 3 of 48 units cosmetic damage.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Approve</button><button className="btn ghost">Edit</button></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row c3 mb-16">
        <div className="card">
          <div className="card-head"><h3>Dock utilization · today</h3><span className="meta">8 DOCKS</span></div>
          <div className="card-body">
            <div className="barline mb-8">
              {[45,62,78,88,92,85,70,58,72,80,75,60].map((v,i)=>
                <div key={i} className={'bar' + (v>85?' ai':'')} style={{height: v+'%'}}/>
              )}
            </div>
            <div className="flex between small"><span>06:00</span><span>10:00</span><span>14:00</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Throughput · last 24h</h3><span className="meta">RECEIPTS/HR</span></div>
          <div className="card-body">
            <div className="barline mb-8">
              {SHIFT_THROUGHPUT.map((v,i)=>
                <div key={i} className="bar" style={{height: (v*1.8)+'%'}}/>
              )}
            </div>
            <div className="flex between small"><span>-24h</span><span>-12h</span><span>now</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Agent acceptance · 7d</h3><span className="meta">INBOUND AGENTS</span></div>
          <div className="card-body">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <AgentBar name="Dock scheduling" pct={88} />
              <AgentBar name="Receiving (variance)" pct={76} />
              <AgentBar name="Receiving (QC plan)" pct={81} />
              <AgentBar name="Putaway" pct={84} />
            </div>
          </div>
        </div>
      </div>

      <div className="row c2">
        <div className="card">
          <div className="card-head"><h3>Alerts</h3><span className="meta">{ALERTS.length} OPEN</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <tbody>
                {ALERTS.map((a,i) => (
                  <tr key={i}>
                    <td style={{ width: 80 }}><span className={'tag ' + (a.sev==='high'?'risk':a.sev==='med'?'warn':'')}>{a.sev}</span></td>
                    <td><b>{a.t}</b><div className="small">{a.d}</div></td>
                    <td className="num" style={{ width: 60, textAlign:'right' }}>{a.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Shift roster · now on floor</h3><span className="meta">14 ACTIVE</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>Operator</th><th>Role</th><th>Current task</th><th>Acc.</th></tr></thead>
              <tbody>
                <tr><td><b>R. Singh</b></td><td>Putaway</td><td>PW-20460 · P-A14</td><td className="num">99.2%</td></tr>
                <tr><td><b>P. Kumar</b></td><td>Receiving</td><td>GRN-1234 · HUL</td><td className="num">98.7%</td></tr>
                <tr><td><b>S. Iyer</b></td><td>QC</td><td>QC-8842 · Reckitt</td><td className="num">99.5%</td></tr>
                <tr><td><b>M. Das</b></td><td>Receiving</td><td>Gate scan · GT-1044</td><td className="num">97.9%</td></tr>
                <tr><td><b>N. Rao</b></td><td>Putaway</td><td>PW-20461 · P-B08</td><td className="num">98.1%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentBar = ({ name, pct }) => (
  <div>
    <div className="flex between small mb-8" style={{ marginBottom: 4 }}><span style={{ color: 'var(--ink)', fontSize: 12 }}>{name}</span><span className="mono" style={{ color: 'var(--ai)' }}>{pct}%</span></div>
    <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 2 }}>
      <div style={{ width: pct+'%', height: '100%', background: 'var(--ai)', borderRadius: 2 }}/>
    </div>
  </div>
);


/* ============================ roles.jsx ============================ */
// roles.jsx — Home screens for all seven user types

/* =========================================================
   OPERATOR HOME — handheld-style task list
   ========================================================= */
const OperatorHome = () => {
  const { go, notify } = useApp();
  const tasks = OPERATOR_TASKS;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Good morning, Rajesh.</h1>
          <div className="sub">WAREHOUSE OPERATOR · HANDHELD · SHIFT 1</div>
        </div>
        <div className="act">
          <button className="btn">Call supervisor</button>
          <button className="btn primary" onClick={() => go('putaway')}>Start next task</button>
        </div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile ai"><div className="k">Next task</div><div className="v" style={{ fontSize: 20 }}>PW-20462</div><div className="d">Putaway · 48 units → P-A12</div></div>
        <div className="tile"><div className="k">Shift goal</div><div className="v">34<span style={{ fontSize: 16, color: 'var(--ink-3)' }}> / 60</span></div><div className="d">On track · 4h 12m left</div></div>
        <div className="tile risk"><div className="k">Blocking you</div><div className="v">1</div><div className="d">Bin P-A14 unreachable — reroute?</div></div>
        <div className="tile"><div className="k">My accuracy</div><div className="v">99.2%</div><div className="d">Last 7 shifts</div></div>
      </div>

      <div className="row c2 mb-16">
        <div className="card">
          <div className="card-head"><h3>My task queue</h3><span className="meta">{tasks.length} ASSIGNED</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>Task</th><th>Kind</th><th>Detail</th><th>SLA</th><th></th></tr></thead>
              <tbody>
                {tasks.map((t,i) => (
                  <tr key={t.id} className="clickable" onClick={() => go('putaway')}>
                    <td><b className="mono">{t.id}</b></td>
                    <td>{t.kind}</td>
                    <td>{t.detail}</td>
                    <td className="num"><span className={'tag ' + (t.priority==='high'?'risk':'')}>{t.sla}</span></td>
                    <td style={{ width: 90 }}>{i===0 ? <span className="tag ai nodot">NEXT</span> : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card ai-accent">
          <div className="card-head"><h3>Agent guidance</h3><span className="tag ai nodot">LIVE</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 10 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Walk P-A12 before P-B08</b> · saves 32m</div>
              <div className="small">Both in pick zone A · same aisle · replen blocker clearing in 4m.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary" onClick={() => notify('Route accepted')}>Accept route</button><button className="btn ghost">Why</button></div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>P-A14 unreachable</b> — use alternate F-B12</div>
              <div className="small">Bin flagged by 2 ops · facilities ETA 40m · FEFO still compliant.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary" onClick={() => notify('Bin swapped')}>Use F-B12</button><button className="btn ghost">Call lead</button></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Handheld preview</h3><span className="meta">AS SEEN ON SCANNER</span></div>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-2)' }}>
          <div style={{ width: 300, border: '1px solid var(--rule-2)', background: '#1f1d17', color: '#eae6d8', fontFamily: 'var(--mono)', padding: 16, borderRadius: 6, fontSize: 11.5, lineHeight: 1.6 }}>
            <div style={{ color: '#86827a', letterSpacing: '0.1em' }}>PUTAWAY · PW-20462</div>
            <div style={{ borderTop: '1px solid #3a372d', margin: '8px 0' }}/>
            <div>SKU&nbsp;&nbsp;&nbsp;&nbsp;HUL-RIN-BR-500</div>
            <div>QTY&nbsp;&nbsp;&nbsp;&nbsp;48 units</div>
            <div>BATCH&nbsp;&nbsp;B-A7431 · exp 2027-02</div>
            <div style={{ marginTop: 12, color: '#e8c389' }}>● RECOMMENDED BIN: P-A12</div>
            <div style={{ color: '#a6a190', fontSize: 10.5 }}>Pick zone · 65% full · FEFO match</div>
            <div style={{ color: '#a6a190', fontSize: 10.5 }}>45m from packing · conf 92%</div>
            <div style={{ marginTop: 12, background: '#3e382a', color: '#fff', textAlign: 'center', padding: '10px 8px', fontWeight: 600 }}>[  GO TO P-A12  ]</div>
            <div style={{ marginTop: 10, color: '#a6a190', fontSize: 10.5 }}>Alternates:</div>
            <div style={{ color: '#a6a190', fontSize: 10.5 }}>&nbsp;&nbsp;P-A14 · 40m · 30% full</div>
            <div style={{ color: '#a6a190', fontSize: 10.5 }}>&nbsp;&nbsp;F-B05 · 80m · empty</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   QC HOME — station queue
   ========================================================= */
const QCHome = () => {
  const { go, notify } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>QC station · today</h1>
          <div className="sub">S. IYER · STATION 2 · INBOUND QC</div>
        </div>
        <div className="act">
          <button className="btn">View vendor scorecards</button>
          <button className="btn primary" onClick={() => go('qc')}>Start next QC</button>
        </div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile"><div className="k">Queue</div><div className="v">{QC_QUEUE.length}</div><div className="d">Oldest 22m · next SLA 15m</div></div>
        <div className="tile risk"><div className="k">High-risk vendors</div><div className="v">1</div><div className="d">Reckitt · 100% sampling</div></div>
        <div className="tile ai"><div className="k">Defect catch rate</div><div className="v">7.2%</div><div className="d">+0.4pp vs 7d</div></div>
        <div className="tile"><div className="k">Avg time / task</div><div className="v">11m</div><div className="d">Target ≤ 12m</div></div>
      </div>

      <div className="row c2 mb-16">
        <div className="card">
          <div className="card-head"><h3>QC queue</h3><span className="meta">SORTED BY SLA</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>QC</th><th>GRN</th><th>Vendor</th><th>Sample</th><th>SLA</th><th></th></tr></thead>
              <tbody>
                {QC_QUEUE.map(q => (
                  <tr key={q.id} className="clickable" onClick={() => go('qc')}>
                    <td><b className="mono">{q.id}</b></td>
                    <td className="mono">{q.grn}</td>
                    <td><b>{q.vendor}</b> <span className="small">score {q.vendorScore}</span></td>
                    <td className="num"><span className={'tag ' + (q.sample==='100%'?'risk':'')}>{q.sample}</span></td>
                    <td className="num"><span className={'tag ' + (q.priority==='high'?'risk':q.sla.includes('1h')?'':'warn')}>{q.sla}</span></td>
                    <td style={{ width: 80 }}><button className="btn" onClick={(e) => { e.stopPropagation(); go('qc'); }}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card ai-accent">
          <div className="card-head"><h3>Agent briefing</h3><span className="tag ai nodot">BEFORE YOU PICK A TASK</span></div>
          <div className="card-body">
            <div style={{ fontSize: 13, marginBottom: 8 }}><b>Reckitt arrivals trending down</b> on quality</div>
            <div className="small" style={{ marginBottom: 10 }}>90-day variance 12% · 4pp rise vs prior 90 days. Agent has auto-escalated sampling to 100% for next 5 GRNs; your verdicts feed the policy back.</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <span className="tag ai">ESCALATED</span>
              <span className="tag warn">WATCH VENDOR</span>
              <span className="tag">FEEDBACK CAPTURED</span>
            </div>
            <div className="mt-16" style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Damage classifier ready</b></div>
              <div className="small">Photo model up to 72% on Reckitt category. Confirm or re-grade to feed the loop.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary" onClick={() => notify('Classifier enabled')}>Use on station 2</button></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent verdicts · me</h3><span className="meta">LAST 10</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>QC</th><th>Vendor</th><th>Verdict</th><th>AI pre-grade</th><th>Match</th><th>When</th></tr></thead>
            <tbody>
              <tr><td className="mono">QC-8839</td><td>HUL</td><td><span className="tag ok">Accept</span></td><td>Accept</td><td>✓</td><td className="num">09:42</td></tr>
              <tr><td className="mono">QC-8838</td><td>Reckitt</td><td><span className="tag risk">Reject</span></td><td>Hold</td><td>—</td><td className="num">09:18</td></tr>
              <tr><td className="mono">QC-8837</td><td>Nestle</td><td><span className="tag ok">Accept</span></td><td>Accept</td><td>✓</td><td className="num">08:55</td></tr>
              <tr><td className="mono">QC-8836</td><td>Amul</td><td><span className="tag warn">Partial</span></td><td>Partial</td><td>✓</td><td className="num">08:31</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MANAGER HOME — KPI + agent health
   ========================================================= */
const ManagerHome = () => {
  const { go } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Site performance · BLR-01</h1>
          <div className="sub">V. SHAH · WAREHOUSE MANAGER · LAST 7 DAYS</div>
        </div>
        <div className="act">
          <button className="btn">Export KPI pack</button>
          <button className="btn primary" onClick={() => go('agents')}>Tune agents</button>
        </div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile"><div className="k">SLA adherence</div><div className="v">97.8%</div><div className="d" style={{ color: 'var(--risk)' }}>Target 98% · -0.3pp WoW</div></div>
        <div className="tile"><div className="k">Cost / order</div><div className="v">₹ 62.4</div><div className="d" style={{ color: 'var(--ok)' }}>-3% WoW</div></div>
        <div className="tile"><div className="k">Picks / labor hr</div><div className="v">112</div><div className="d">Target 120</div></div>
        <div className="tile"><div className="k">Inventory accuracy</div><div className="v">99.1%</div><div className="d">92% cycle counts on time</div></div>
      </div>

      <div className="row c2 mb-16">
        <div className="card">
          <div className="card-head"><h3>Throughput · 7 days</h3><span className="meta">RECEIPTS + OUTBOUND</span></div>
          <div className="card-body">
            <div className="barline mb-8">
              {[62,70,58,74,81,77,84,88,79,82,86,91,84,80,78,82,86,89,92,88,85,81,78,74].map((v,i) =>
                <div key={i} className={'bar' + (v>85?' ai':'')} style={{ height: v+'%' }}/>
              )}
            </div>
            <div className="flex between small"><span>Mon</span><span>Thu</span><span>Sun</span></div>
          </div>
        </div>

        <div className="card ai-accent">
          <div className="card-head"><h3>Anomalies detected</h3><span className="tag ai nodot">AGENT</span></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 10 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Returns Agent drift</b> · acceptance -6pp in 14d</div>
              <div className="small">Override reason "reason mismatch" clustering. Recommend re-train + threshold review.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Open agent</button><button className="btn ghost">Ask Copilot</button></div>
            </div>
            <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 10 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Replen SLA hits at 14:00</b> daily</div>
              <div className="small">Forklift capacity bottleneck · same 4 aisles · propose additional shift overlap.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Review</button></div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Dock 3 over-utilized</b> · 94% average</div>
              <div className="small">Consider re-allocating cold-chain vendors to Dock 5 on afternoons.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Open plan</button></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row c3 mb-16">
        <div className="card">
          <div className="card-head"><h3>Agent acceptance · 7d</h3><span className="meta">11 LIVE</span></div>
          <div className="card-body">
            <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
              <AgentBar name="Putaway" pct={84}/>
              <AgentBar name="Dock scheduling" pct={88}/>
              <AgentBar name="Allocation" pct={79}/>
              <AgentBar name="Wave planner" pct={72}/>
              <AgentBar name="Returns" pct={64}/>
              <AgentBar name="Billing leakage" pct={58}/>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Labor · by team</h3><span className="meta">TODAY</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>Team</th><th>On floor</th><th>Util.</th></tr></thead>
              <tbody>
                <tr><td><b>Receiving</b></td><td className="num">5 / 6</td><td className="num">88%</td></tr>
                <tr><td><b>QC</b></td><td className="num">3 / 4</td><td className="num">81%</td></tr>
                <tr><td><b>Putaway</b></td><td className="num">4 / 5</td><td className="num">77%</td></tr>
                <tr><td><b>Picking</b></td><td className="num">8 / 10</td><td className="num">92%</td></tr>
                <tr><td><b>Packing</b></td><td className="num">6 / 7</td><td className="num">84%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Financial impact · MTD</h3><span className="meta">AGENT-ATTRIBUTED</span></div>
          <div className="card-body">
            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
              <div><div className="inline-k">Leakage recovered</div><div style={{ fontSize: 22, fontWeight: 500 }}>₹ 12.4 L</div><div className="small">Billing Leakage Agent</div></div>
              <div><div className="inline-k">Labor saved</div><div style={{ fontSize: 22, fontWeight: 500 }}>312 hrs</div><div className="small">Putaway + Wave agents</div></div>
              <div><div className="inline-k">Rework avoided</div><div style={{ fontSize: 22, fontWeight: 500 }}>₹ 4.1 L</div><div className="small">QC + Receiving</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   CONTROL TOWER HOME — network view
   ========================================================= */
const ControlTowerHome = () => {
  const { go } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Network control tower</h1>
          <div className="sub">D. PILLAI · 9 SITES · LIVE</div>
        </div>
        <div className="act">
          <button className="btn">Incident log</button>
          <button className="btn primary">Broadcast advisory</button>
        </div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile"><div className="k">Sites on plan</div><div className="v">7<span style={{ fontSize: 16, color: 'var(--ink-3)' }}> / 9</span></div><div className="d">2 on watch · 1 at risk</div></div>
        <div className="tile risk"><div className="k">SLA at risk · 4h</div><div className="v">312</div><div className="d">Orders across network</div></div>
        <div className="tile"><div className="k">Carrier on-time</div><div className="v">82%</div><div className="d">Live pickup rate</div></div>
        <div className="tile ai"><div className="k">Suggested reroutes</div><div className="v">18</div><div className="d">Awaiting approval</div></div>
      </div>

      <div className="card mb-16">
        <div className="card-head"><h3>Sites · network</h3><span className="meta">SLA · RISK · THROUGHPUT</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Site</th><th>Status</th><th>SLA</th><th>At-risk orders</th><th>Throughput</th><th>Owner</th><th></th></tr></thead>
            <tbody>
              {NETWORK_SITES.map(s => (
                <tr key={s.code}>
                  <td><b>{s.name}</b> <span className="mono small">{s.code}</span></td>
                  <td><span className={'tag ' + (s.status==='risk'?'risk':s.status==='watch'?'warn':'ok')}>{s.status}</span></td>
                  <td className="num">{s.sla}%</td>
                  <td className="num">{s.risk}</td>
                  <td className="num">{s.tp}/h</td>
                  <td>Site supervisor</td>
                  <td style={{ width: 100 }}><button className="btn">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row c2">
        <div className="card">
          <div className="card-head"><h3>Stuck orders queue</h3><span className="meta">{NETWORK_STUCK.length} OPEN</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>Order</th><th>Site</th><th>Age</th><th>Cause</th><th>Owner</th></tr></thead>
              <tbody>
                {NETWORK_STUCK.map(s => (
                  <tr key={s.id}>
                    <td className="mono">{s.id}</td>
                    <td>{s.site}</td>
                    <td className="num"><span className="tag warn">{s.age}</span></td>
                    <td>{s.cause}</td>
                    <td>{s.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card ai-accent">
          <div className="card-head"><h3>Carrier risk · next 4h</h3><span className="tag ai nodot">HANDOVER AGENT</span></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            <div style={{ borderBottom:'1px solid var(--rule)', paddingBottom:10 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>FedEx BLR hub</b> · 42m late on 7 pickups</div>
              <div className="small">Recommend swap to Bluedart for MUM-01 evening wave · 14 orders.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Approve swap</button><button className="btn ghost">Why</button></div>
            </div>
            <div style={{ borderBottom:'1px solid var(--rule)', paddingBottom:10 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Delhivery KOL</b> · no-show risk high</div>
              <div className="small">Weather event · pattern match to last Oct washout. Customer comms drafted.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Review comms</button></div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>MUM-02 SLA collapse</b> · forecast amber → red in 90m</div>
              <div className="small">Cross-site reroute to MUM-01 for 48 orders; low risk.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Approve reroute</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   FINANCE HOME — billing leakage
   ========================================================= */
const FinanceHome = () => {
  const { go, notify } = useApp();
  const fmt = (n) => '₹ ' + n.toLocaleString('en-IN');
  const total = BILLING_CASES.reduce((s,c) => s+c.amount, 0);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Billing leakage · March 2026</h1>
          <div className="sub">K. MENON · FINANCE / COMMERCIAL RECOVERY</div>
        </div>
        <div className="act">
          <button className="btn">Export cases</button>
          <button className="btn primary">Raise credit notes</button>
        </div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile"><div className="k">Open cases</div><div className="v">{BILLING_CASES.length}</div><div className="d">Avg age 2.8 d</div></div>
        <div className="tile"><div className="k">Recovery MTD</div><div className="v">₹ 12.4L</div><div className="d" style={{ color: 'var(--warn)' }}>Target ₹ 15L</div></div>
        <div className="tile"><div className="k">Dispute rate</div><div className="v">11%</div><div className="d" style={{ color: 'var(--ok)' }}>-3pp WoW</div></div>
        <div className="tile ai"><div className="k">Agent confidence</div><div className="v">84%</div><div className="d">Evidence complete 92%</div></div>
      </div>

      <div className="card mb-16">
        <div className="card-head"><h3>Case queue</h3><span className="meta">{fmt(total)} TOTAL</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Case</th><th>Customer</th><th>Type</th><th>Amount</th><th>Evidence</th><th>AI conf.</th><th>Age</th><th></th></tr></thead>
            <tbody>
              {BILLING_CASES.map(c => (
                <tr key={c.id} className="clickable">
                  <td className="mono">{c.id}</td>
                  <td><b>{c.customer}</b></td>
                  <td>{c.type}</td>
                  <td className="num">{fmt(c.amount)}</td>
                  <td><span className={'tag ' + (c.evidence==='Complete'?'ok':c.evidence==='Partial'?'warn':'risk')}>{c.evidence}</span></td>
                  <td className="num" style={{ color: c.conf>=80?'var(--ok)':c.conf>=65?'var(--warn)':'var(--risk)' }}>{c.conf}%</td>
                  <td className="num">{c.age}</td>
                  <td style={{ width: 180 }}>
                    <button className="btn primary" onClick={() => notify('Recovery raised for ' + c.customer)}>Accept</button>
                    <button className="btn ghost">Dispute</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row c2">
        <div className="card ai-accent">
          <div className="card-head"><h3>Agent evidence · BL-2246</h3><span className="tag ai nodot">BILLING LEAKAGE AGENT</span></div>
          <div className="card-body">
            <div style={{ fontSize: 13, marginBottom: 8 }}><b>Bennett Retail · ₹ 98,700 peak handling</b></div>
            <div className="small" style={{ marginBottom: 12 }}>Contract terms vs. executed ops reconciliation.</div>
            <table className="tbl">
              <tbody>
                <tr><td>Contract clause</td><td className="mono">§4.3 Peak surcharge</td></tr>
                <tr><td>Trigger</td><td>Volume &gt; 2.5× baseline</td></tr>
                <tr><td>Observed</td><td>3.1× (12–18 Mar)</td></tr>
                <tr><td>Invoice status</td><td><span className="tag risk">Surcharge not applied</span></td></tr>
                <tr><td>Missing evidence</td><td>Hourly dock logs 15–17 Mar</td></tr>
              </tbody>
            </table>
            <div className="mt-8 flex gap-8"><button className="btn primary">Request logs from ops</button><button className="btn ghost">Pause case</button></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Recovery trend · 12 weeks</h3><span className="meta">₹ LAKH / WEEK</span></div>
          <div className="card-body">
            <div className="barline mb-8">
              {[8,10,7,11,13,9,12,15,11,14,13,12].map((v,i) =>
                <div key={i} className={'bar' + (v>12?' ai':'')} style={{ height: (v*6)+'%' }}/>
              )}
            </div>
            <div className="flex between small"><span>W1</span><span>W6</span><span>W12</span></div>
            <div className="mt-16" style={{ borderTop: '1px solid var(--rule)', paddingTop: 12, fontSize: 12.5 }}>
              <div className="inline-k mb-8">Top leakage types</div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}><span>Storage overage</span><b>38%</b></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}><span>Returns processing</span><b>24%</b></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}><span>Peak handling</span><b>18%</b></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}><span>VAS undercharged</span><b>12%</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   ADMIN HOME — platform config + AI ops
   ========================================================= */
const AdminHome = () => {
  const { go, notify } = useApp();
  const live = AGENT_INVENTORY.filter(a => a.status==='live').length;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Admin · platform health</h1>
          <div className="sub">T. RAVI · AI OPS · ALL SITES</div>
        </div>
        <div className="act">
          <button className="btn">Simulate policy</button>
          <button className="btn primary" onClick={() => notify('Audit log exported')}>Export audit</button>
        </div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile ai"><div className="k">Live agents</div><div className="v">{live}<span style={{ fontSize: 16, color: 'var(--ink-3)' }}> / {AGENT_INVENTORY.length}</span></div><div className="d">3 shadow · 0 paused</div></div>
        <div className="tile risk"><div className="k">Drift alerts</div><div className="v">2</div><div className="d">Wave planner · Allocation</div></div>
        <div className="tile"><div className="k">Avg acceptance</div><div className="v">76%</div><div className="d">Target 70%+</div></div>
        <div className="tile"><div className="k">Pending configs</div><div className="v">4</div><div className="d">2 simulated · 2 drafted</div></div>
      </div>

      <div className="card mb-16">
        <div className="card-head"><h3>Agent directory</h3><span className="meta">STATUS · LEVEL · ACCEPTANCE · DRIFT</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Agent</th><th>Status</th><th>Level</th><th>Acceptance</th><th>Runs 7d</th><th>Drift</th><th>Site</th><th></th></tr></thead>
            <tbody>
              {AGENT_INVENTORY.map(a => (
                <tr key={a.n}>
                  <td><b>{a.n}</b></td>
                  <td><span className={'tag ' + (a.status==='live'?'ok':'warn')}>{a.status}</span></td>
                  <td className="mono">{a.level}</td>
                  <td className="num" style={{ color: a.acc>=75?'var(--ok)':a.acc>=60?'var(--warn)':'var(--risk)' }}>{a.acc}%</td>
                  <td className="num mono">{a.runs}</td>
                  <td className="num" style={{ color: a.drift==null?'var(--ink-3)':a.drift>0?'var(--ok)':a.drift<-3?'var(--risk)':'var(--warn)' }}>{a.drift==null?'—':(a.drift>0?'+':'')+a.drift+'pp'}</td>
                  <td>{a.site}</td>
                  <td style={{ width: 140 }}><button className="btn">Tune</button><button className="btn ghost">Shadow</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row c2">
        <div className="card">
          <div className="card-head"><h3>Policies &amp; thresholds</h3><span className="meta">{POLICIES.length} ACTIVE</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>Policy</th><th>Agent</th><th>Value</th><th>Edited</th></tr></thead>
              <tbody>
                {POLICIES.map(p => (
                  <tr key={p.id}>
                    <td><b>{p.rule}</b><div className="small mono">{p.id}</div></td>
                    <td>{p.agent}</td>
                    <td className="mono small">{p.value}</td>
                    <td><div>{p.editedBy}</div><div className="small">{p.at}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card ai-accent">
          <div className="card-head"><h3>Pending config changes</h3><span className="tag ai nodot">WITH SIMULATION</span></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            <div style={{ borderBottom:'1px solid var(--rule)', paddingBottom:10 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Allocation auto-commit</b> 85% → 80%</div>
              <div className="small">Simulated on 14d history · +8% coverage · +1.2% override rate. Drafted by T. Ravi.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Publish</button><button className="btn ghost">Edit</button></div>
            </div>
            <div style={{ borderBottom:'1px solid var(--rule)', paddingBottom:10 }}>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>QC sampling B-tier</b> 15% → 10%</div>
              <div className="small">Simulation blocked · regulated SKUs in sample set. Needs compliance review.</div>
              <div className="mt-8 flex gap-8"><button className="btn">Open compliance</button></div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, marginBottom: 4 }}><b>Add site</b> · MUM-03 rollout</div>
              <div className="small">Shadow mode · week 1 for Putaway + Dock agents. Awaiting site sign-off.</div>
              <div className="mt-8 flex gap-8"><button className="btn primary">Schedule</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ============================ detail-screens.jsx ============================ */
// detail-screens.jsx — Manager / Tower / Finance / Admin / Operator-QC return screens

/* ============================== MANAGER ============================== */
const MgrTrends = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Trends</h1><div className="sub">SITE BLR-01 · LAST 30 DAYS</div></div>
      <div className="act"><button className="btn">Export PDF</button><button className="btn primary">Schedule report</button></div>
    </div>

    <div className="tiles row c4 mb-16">
      <div className="tile"><div className="k">Throughput</div><div className="v">42.4K</div><div className="d">units · +6.2% vs prev</div></div>
      <div className="tile"><div className="k">SLA on time</div><div className="v">98.2%</div><div className="d">Outbound · -0.4pp</div></div>
      <div className="tile"><div className="k">Cost / unit</div><div className="v">₹ 18.40</div><div className="d">-3.1% vs prev</div></div>
      <div className="tile risk"><div className="k">Inventory accuracy</div><div className="v">99.21%</div><div className="d">-0.18pp · cycle count due</div></div>
    </div>

    <div className="row c2">
      <div className="card">
        <div className="card-head"><h3>Throughput · 30d</h3><span className="meta">UNITS / SHIFT</span></div>
        <div className="card-body"><Spark series={[820,840,890,910,920,880,940,950,970,1010,990,1020,1040,1060,1050,1080,1090,1110,1080,1140,1170,1190,1180,1210,1230,1250,1240,1280,1290,1310]} /></div>
      </div>
      <div className="card">
        <div className="card-head"><h3>SLA on time · 30d</h3><span className="meta">% · BY DAY</span></div>
        <div className="card-body"><Spark series={[97.8,98.1,98.4,98.6,98.5,98.2,97.9,98.1,98.3,98.5,98.4,98.6,98.7,98.5,98.4,98.2,98.0,97.8,97.6,97.9,98.1,98.2,98.3,98.4,98.2,98.0,97.9,98.1,98.2,98.2]} dom={[97,99]}/></div>
      </div>
    </div>

    <div className="card mt-16">
      <div className="card-head"><h3>Pareto · exception causes</h3><span className="meta">30d · 1,240 events</span></div>
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Cause</th><th>Events</th><th>% share</th><th>Cum %</th><th>Avg time-to-resolve</th><th>Owner</th></tr></thead>
          <tbody>
            {[
              ['Allocation · no-stock', 412, 33, 33, '24m', 'Inventory'],
              ['Carrier late pickup', 268, 22, 55, '38m', 'Tower'],
              ['QC hold > SLA', 184, 15, 70, '52m', 'QC'],
              ['Pick exception (short)', 142, 11, 81, '14m', 'Floor'],
              ['Putaway override', 98, 8, 89, '6m', 'Floor'],
              ['Dock reassign', 76, 6, 95, '4m', 'Gate'],
              ['Other', 60, 5, 100, '—', '—'],
            ].map(r => (
              <tr key={r[0]}>
                <td><b>{r[0]}</b></td>
                <td className="num">{r[1]}</td>
                <td className="num">{r[2]}%</td>
                <td className="num">{r[3]}%</td>
                <td className="num">{r[4]}</td>
                <td>{r[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const Spark = ({ series, dom }) => {
  const min = dom ? dom[0] : Math.min(...series);
  const max = dom ? dom[1] : Math.max(...series);
  const w = 720, h = 120, pad = 8;
  const pts = series.map((v,i) => [pad + (i/(series.length-1))*(w-pad*2), h - pad - ((v-min)/(max-min))*(h-pad*2)]);
  const d = 'M ' + pts.map(p=>p.join(' ')).join(' L ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 140 }}>
      <path d={d} fill="none" stroke="#1f1d17" strokeWidth="1.4"/>
      <path d={d + ` L ${w-pad} ${h-pad} L ${pad} ${h-pad} Z`} fill="#1f1d17" opacity="0.06"/>
      {pts.filter((_,i)=>i%6===0).map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="2" fill="#1f1d17"/>)}
    </svg>
  );
};

const MgrAgents = () => {
  const { notify } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Agent health</h1><div className="sub">12 AGENTS · 8 LIVE · 4 SHADOW</div></div>
        <div className="act"><button className="btn">Open registry</button><button className="btn primary" onClick={() => notify('Promotion request sent to admin')}>Request promotion</button></div>
      </div>

      <div className="row c4 mb-16">
        <div className="tile"><div className="k">Auto rate</div><div className="v">73%</div><div className="d">Decisions auto · +4pp 30d</div></div>
        <div className="tile ai"><div className="k">Override rate</div><div className="v">8.2%</div><div className="d">Within band</div></div>
        <div className="tile risk"><div className="k">Drift alerts</div><div className="v">3</div><div className="d">Wave · Allocation · Receiving·var</div></div>
        <div className="tile"><div className="k">Time saved</div><div className="v">186h</div><div className="d">30d · supervisor + ops</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Per-agent scorecard</h3><span className="meta">SORTED BY DRIFT</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Agent</th><th>Status</th><th>Level</th><th>Accuracy</th><th>Runs</th><th>Drift</th><th>Trend</th><th></th></tr></thead>
            <tbody>
              {AGENT_INVENTORY.map(a => (
                <tr key={a.n}>
                  <td><b>{a.n}</b></td>
                  <td>{a.status==='live' ? <span className="tag ok">live</span> : <span className="tag warn">shadow</span>}</td>
                  <td className="mono">{a.level}</td>
                  <td className="num">{a.acc}%</td>
                  <td className="num">{a.runs.toLocaleString('en-IN')}</td>
                  <td className="num">{a.drift==null ? '—' : <span style={{ color: a.drift<0?'var(--risk)':'var(--ok)' }}>{a.drift>0?'+':''}{a.drift}pp</span>}</td>
                  <td><MiniSpark trend={a.drift==null?'flat':a.drift<0?'down':'up'}/></td>
                  <td style={{ width: 90 }}><button className="btn">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MiniSpark = ({ trend }) => {
  const series = trend==='down' ? [10,9,8,8,7,6,5] : trend==='up' ? [4,5,6,7,7,8,9] : [6,6,7,6,6,7,6];
  const w=80, h=20;
  const pts = series.map((v,i) => [(i/(series.length-1))*w, h - (v/10)*(h-2) - 1]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: 80, height: 20 }}>
      <path d={'M ' + pts.map(p=>p.join(' ')).join(' L ')} fill="none" stroke={trend==='down'?'#a3382b':trend==='up'?'#3d6b3a':'#86827a'} strokeWidth="1.2"/>
    </svg>
  );
};

/* ============================== TOWER ============================== */
const CtStuck = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Stuck orders · network</h1><div className="sub">{NETWORK_STUCK.length} OPEN · ACROSS 9 SITES</div></div>
      <div className="act"><button className="btn">Filter by site</button><button className="btn primary">Bulk reassign</button></div>
    </div>

    <div className="card">
      <div className="card-head"><h3>Stuck orders</h3><span className="meta">SLA AT RISK</span></div>
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Order</th><th>Site</th><th>Age</th><th>Cause</th><th>Owner</th><th></th></tr></thead>
          <tbody>
            {NETWORK_STUCK.map(s => (
              <tr key={s.id}>
                <td className="mono"><b>{s.id}</b></td>
                <td className="mono">{s.site}</td>
                <td className="num"><span className={'tag ' + (s.age.includes('2h')?'risk':'warn')}>{s.age}</span></td>
                <td>{s.cause}</td>
                <td>{s.owner}</td>
                <td style={{ width: 220 }}><button className="btn">Reassign site</button> <button className="btn">Page owner</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const CtCarriers = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Carrier scorecards</h1><div className="sub">5 CARRIERS · 30d ROLLING</div></div>
      <div className="act"><button className="btn">Open RFQ</button></div>
    </div>
    <div className="card">
      <div className="card-head"><h3>On-time · loss · cost</h3><span className="meta">VOLUME-WEIGHTED</span></div>
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Carrier</th><th>On-time</th><th>Lost / damaged</th><th>Cost vs baseline</th><th>Volume share</th><th>Drift (7d)</th><th></th></tr></thead>
          <tbody>
            {CARRIERS.map(c => (
              <tr key={c.c}>
                <td><b>{c.c}</b></td>
                <td className="num">{c.onTime}%</td>
                <td className="num">{c.lost}%</td>
                <td className="num">{c.cost}</td>
                <td className="num">{c.vol}</td>
                <td className="num"><span style={{ color: c.drift<0?'var(--risk)':'var(--ok)' }}>{c.drift>0?'+':''}{c.drift}pp</span></td>
                <td style={{ width: 90 }}><button className="btn">Drill</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const CtIncidents = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Incidents</h1><div className="sub">{INCIDENTS.length} OPEN · NETWORK</div></div>
    </div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>ID</th><th>Site</th><th>Title</th><th>Severity</th><th>Owner</th><th>Status</th><th>Age</th></tr></thead>
          <tbody>
            {INCIDENTS.map(i => (
              <tr key={i.id}>
                <td className="mono"><b>{i.id}</b></td>
                <td className="mono">{i.site}</td>
                <td>{i.t}</td>
                <td><span className={'tag ' + (i.sev==='high'?'risk':i.sev==='med'?'warn':'')}>{i.sev}</span></td>
                <td>{i.owner}</td>
                <td>{i.status==='resolved' ? <span className="tag ok">resolved</span> : <span className="tag warn">{i.status}</span>}</td>
                <td className="mono num">{i.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* ============================== FINANCE ============================== */
const FinRecovery = () => {
  const { notify } = useApp();
  const total = BILLING_CASES.reduce((s,c)=>s+c.amount,0);
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Recovery queue</h1><div className="sub">{BILLING_CASES.length} CASES · ₹ {(total/100000).toFixed(2)}L OPEN</div></div>
        <div className="act"><button className="btn">Export CSV</button><button className="btn primary" onClick={() => notify('5 cases approved · invoices queued')}>Approve all ≥ 85% conf</button></div>
      </div>

      <div className="row c4 mb-16">
        <div className="tile"><div className="k">Open value</div><div className="v">₹ {(total/100000).toFixed(2)}L</div><div className="d">{BILLING_CASES.length} customers</div></div>
        <div className="tile ai"><div className="k">Avg conf.</div><div className="v">81%</div><div className="d">Billing leakage L2</div></div>
        <div className="tile"><div className="k">Recovered MTD</div><div className="v">₹ 8.4L</div><div className="d">+22% vs prev</div></div>
        <div className="tile risk"><div className="k">Aging &gt; 5d</div><div className="v">1</div><div className="d">BL-2246 · evidence missing</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Cases</h3><span className="meta">SORTED BY AMOUNT</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Case</th><th>Customer · period</th><th>Type</th><th>Amount</th><th>Evidence</th><th>Conf.</th><th>Age</th><th></th></tr></thead>
            <tbody>
              {BILLING_CASES.map(b => (
                <tr key={b.id}>
                  <td className="mono"><b>{b.id}</b></td>
                  <td><b>{b.customer}</b><div className="small">{b.period}</div></td>
                  <td>{b.type}</td>
                  <td className="num">₹ {b.amount.toLocaleString('en-IN')}</td>
                  <td><span className={'tag ' + (b.evidence==='Missing'?'risk':b.evidence==='Partial'?'warn':'ok')}>{b.evidence}</span></td>
                  <td><span className="mono" style={{ color: b.conf<70?'var(--risk)':'var(--ai)', fontSize: 11.5 }}>{b.conf}%</span></td>
                  <td className="num mono">{b.age}</td>
                  <td style={{ width: 80 }}><button className="btn">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinDisputes = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Customer disputes</h1><div className="sub">3 OPEN · 1 SLA-BREACH</div></div>
    </div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Dispute</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Stage</th><th>SLA</th></tr></thead>
          <tbody>
            <tr><td className="mono">DP-114</td><td>Zepto Retail</td><td className="num">₹ 38,400</td><td>Storage overage challenged</td><td><span className="tag warn">evidence req.</span></td><td className="mono num">2d 4h</td></tr>
            <tr><td className="mono">DP-115</td><td>UrbanKart</td><td className="num">₹ 12,200</td><td>VAS rate disagreement</td><td><span className="tag">manager</span></td><td className="mono num">1d 8h</td></tr>
            <tr><td className="mono">DP-116</td><td>Bennett Retail</td><td className="num">₹ 24,800</td><td>Peak surcharge challenged</td><td><span className="tag risk">SLA breach</span></td><td className="mono num">5d 2h</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const FinScorecards = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Vendor scorecards</h1><div className="sub">42 ACTIVE VENDORS · 30d</div></div>
    </div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Vendor</th><th>Score</th><th>ASN accuracy</th><th>QC pass</th><th>On-time</th><th>Chargebacks (₹)</th><th>Trend</th></tr></thead>
          <tbody>
            {[
              ['HUL', 88, 96, 94, 92, 18400, 'up'],
              ['Amul Dairy Cold', 94, 98, 97, 96, 4200, 'up'],
              ['Reckitt Benckiser', 62, 81, 78, 84, 92800, 'down'],
              ['LG Electronics', 71, 88, 86, 79, 38400, 'flat'],
              ['Nestle', 81, 92, 90, 88, 12200, 'up'],
            ].map(r => (
              <tr key={r[0]}>
                <td><b>{r[0]}</b></td>
                <td><span className={'tag ' + (r[1]<70?'risk':r[1]<85?'warn':'ok')}>{r[1]}</span></td>
                <td className="num">{r[2]}%</td>
                <td className="num">{r[3]}%</td>
                <td className="num">{r[4]}%</td>
                <td className="num">₹ {r[5].toLocaleString('en-IN')}</td>
                <td><MiniSpark trend={r[6]}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* ============================== ADMIN ============================== */
const AdmPolicies = () => {
  const { notify } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Policies &amp; thresholds</h1><div className="sub">{POLICIES.length} ACTIVE · CHANGE WINDOW: ANY · APPROVAL: 2-PERSON</div></div>
        <div className="act"><button className="btn">Diff vs last week</button><button className="btn primary" onClick={() => notify('Draft saved · awaits 2nd approver')}>New policy</button></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Active policies</h3><span className="meta">SORTED BY AGENT</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>ID</th><th>Agent</th><th>Rule</th><th>Value</th><th>Last edit</th><th></th></tr></thead>
            <tbody>
              {POLICIES.map(p => (
                <tr key={p.id}>
                  <td className="mono"><b>{p.id}</b></td>
                  <td>{p.agent}</td>
                  <td><b>{p.rule}</b></td>
                  <td className="mono">{p.value}</td>
                  <td className="small">{p.editedBy} · {p.at}</td>
                  <td style={{ width: 90 }}><button className="btn">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-head"><h3>Approval thresholds</h3><span className="meta">BY ACTION</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Action</th><th>Auto</th><th>Approver</th><th>2-person</th></tr></thead>
            <tbody>
              <tr><td>GRN variance accept</td><td className="mono">&lt; 2%</td><td>Receiving agent</td><td>—</td></tr>
              <tr><td>QC reject &gt; ₹ 25K</td><td className="mono">no</td><td>Supervisor</td><td>Manager</td></tr>
              <tr><td>Putaway override</td><td className="mono">always logged</td><td>—</td><td>—</td></tr>
              <tr><td>Carrier reassign &gt; ₹ 50K</td><td className="mono">no</td><td>Tower</td><td>Manager</td></tr>
              <tr><td>Billing chargeback &gt; ₹ 1L</td><td className="mono">no</td><td>Finance</td><td>Manager</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdmUsers = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Users &amp; roles</h1><div className="sub">{USERS.length} USERS · SSO: OKTA · MFA REQUIRED</div></div>
      <div className="act"><button className="btn">Export users</button><button className="btn primary">Invite user</button></div>
    </div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Site</th><th>Last active</th><th>SSO</th><th>Action accuracy</th><th></th></tr></thead>
          <tbody>
            {USERS.map(u => (
              <tr key={u.name}>
                <td><b>{u.name}</b></td>
                <td>{u.role}</td>
                <td className="mono">{u.site}</td>
                <td className="small">{u.active}</td>
                <td><span className="tag ok">{u.sso}</span></td>
                <td className="num">{u.acc==null ? '—' : u.acc+'%'}</td>
                <td style={{ width: 90 }}><button className="btn">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AdmMaster = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Master data</h1><div className="sub">SOURCES OF TRUTH · 7 DOMAINS</div></div>
    </div>
    <div className="row c2">
      {[
        ['SKU', '14,820 active', 'Product master · synced from PIM · 2m ago'],
        ['Vendor', '142 active', 'Vendor master · finance + procurement'],
        ['Customer', '1,840 active', 'CRM sync · channel-tagged'],
        ['Bin / location', '12,460 in 9 sites', 'WMS · bin types · zone affinities'],
        ['Carrier', '5 contracted', 'Lane-rate cards · SLA matrix'],
        ['Carton', '8 sizes', 'Drop-tested · cost per unit'],
      ].map(([t,c,d]) => (
        <div className="card" key={t}>
          <div className="card-head"><h3>{t}</h3><span className="meta">{c}</span></div>
          <div className="card-body" style={{ fontSize: 12.5 }}>{d}<div className="small mt-12">Last sync: 2m ago · <a href="#" onClick={e=>e.preventDefault()} style={{ color:'var(--ink)' }}>Open</a></div></div>
        </div>
      ))}
    </div>
  </div>
);

const AdmDrift = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Drift &amp; feedback</h1><div className="sub">3 AGENTS WITH NEGATIVE 7d DRIFT</div></div>
    </div>
    <div className="row c2">
      {Object.entries(DRIFT_SERIES).map(([name, series]) => (
        <div className="card" key={name}>
          <div className="card-head"><h3>{name}</h3><span className="meta">12-WEEK ACCURACY · %</span></div>
          <div className="card-body"><Spark series={series} dom={[60,90]}/></div>
          <div className="card-body" style={{ borderTop: '1px solid var(--rule)', fontSize: 12.5 }}>
            Drift detected · {series[series.length-1] - series[0]}pp over 12w. Recommend retrain on last 4 weeks of overrides.
            <div className="actions mt-12"><button className="btn primary">Open retrain</button><button className="btn">Mute</button></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdmAudit = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Audit log</h1><div className="sub">IMMUTABLE · ALL DECISIONS · LAST 24H</div></div>
      <div className="act"><button className="btn">Filter</button><button className="btn">Export</button></div>
    </div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th><th>Source</th></tr></thead>
          <tbody>
            {AUDIT_LOG.map((a,i) => (
              <tr key={i}>
                <td className="mono num">{a.t}</td>
                <td><b>{a.who}</b></td>
                <td>{a.act==='Approved' ? <span className="tag ok">{a.act}</span>
                    : a.act==='Override' ? <span className="tag warn">{a.act}</span>
                    : a.act==='Recommended' ? <span className="tag ai nodot">{a.act}</span>
                    : <span className="tag">{a.act}</span>}</td>
                <td>{a.detail}</td>
                <td className="mono">{a.src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* ============================== ROLE-FACING WRAPPERS ============================== */
// Operator returns intake — handheld-style version of Returns
const OpReturns = () => (
  <div className="page">
    <div className="page-head"><div><h1>Returns intake · my queue</h1><div className="sub">QUARANTINE Q-01 · 3 ASSIGNED</div></div></div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Return</th><th>Items</th><th>Reason</th><th>AI disposition</th><th></th></tr></thead>
          <tbody>
            {RETURNS_INBOUND.slice(0,3).map(r => (
              <tr key={r.id}>
                <td className="mono"><b>{r.id}</b></td>
                <td className="num">{r.items}</td>
                <td>{r.reason}</td>
                <td><span className="tag ai nodot">{r.ai.disp.split('·')[0].trim()}</span></td>
                <td style={{ width: 110 }}><button className="btn primary">Scan in</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// QC returns evaluation — same-style queue but framed for QC operator
const QcReturns = () => (
  <div className="page">
    <div className="page-head"><div><h1>Returns evaluation · QC</h1><div className="sub">REASSESS DISPOSITION · 2 PENDING</div></div></div>
    <div className="card ai-accent mb-16">
      <div className="card-head"><h3>Disposition agent · pending QC review</h3><span className="tag ai nodot">L0 SHADOW</span></div>
      <div className="card-body" style={{ fontSize: 13 }}>You confirm or override every disposition while the agent learns. Confidence band 85% required to graduate to L1.</div>
    </div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>Return</th><th>Items</th><th>AI proposes</th><th>Conf</th><th></th></tr></thead>
          <tbody>
            {RETURNS_INBOUND.filter(r => r.ai.conf < 90).map(r => (
              <tr key={r.id}>
                <td className="mono"><b>{r.id}</b></td>
                <td className="num">{r.items}</td>
                <td>{r.ai.disp}</td>
                <td><span className="mono" style={{ fontSize: 11.5, color:'var(--ai)' }}>{r.ai.conf}%</span></td>
                <td style={{ width: 200 }}><button className="btn primary">Confirm</button> <button className="btn">Override</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);


/* ============================ misc.jsx ============================ */
// misc.jsx — Approvals, Alerts, Agents, Bin map, Handheld

const Approvals = () => {
  const { approvals, resolveApproval, notify } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Approvals inbox</h1><div className="sub">{approvals.length} PENDING · YOU · SUPERVISOR</div></div>
      </div>
      <div className="card">
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Kind</th><th>Source</th><th>Diff</th><th>Impact</th><th>From</th><th>Age</th><th></th></tr></thead>
            <tbody>
              {approvals.map(a => (
                <tr key={a.id}>
                  <td><b>{a.kind}</b></td>
                  <td className="mono">{a.src}</td>
                  <td>{a.diff}</td>
                  <td>{a.impact}</td>
                  <td>{a.who}</td>
                  <td className="num"><span className={'tag ' + (a.sev==='high'?'risk':a.sev==='med'?'warn':'')}>{a.age}</span></td>
                  <td style={{ width: 160 }}>
                    <button className="btn primary" onClick={() => { resolveApproval(a.id); notify(a.kind + ' approved'); }}>Approve</button>
                    <button className="btn ghost" onClick={() => resolveApproval(a.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Alerts = () => (
  <div className="page">
    <div className="page-head"><div><h1>Alerts</h1><div className="sub">4 OPEN · SORTED BY SEVERITY</div></div></div>
    <div className="card">
      <div className="card-body p0">
        <table className="tbl">
          <tbody>
            {ALERTS.map((a,i) => (
              <tr key={i}>
                <td style={{ width: 90 }}><span className={'tag ' + (a.sev==='high'?'risk':a.sev==='med'?'warn':'')}>{a.sev}</span></td>
                <td><b>{a.t}</b><div className="small">{a.d}</div></td>
                <td className="num" style={{ width: 100, textAlign: 'right' }}>{a.age}</td>
                <td style={{ width: 200, textAlign: 'right' }}><button className="btn">Resolve</button><button className="btn ghost">Mute</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const Agents = () => (
  <div className="page">
    <div className="page-head"><div><h1>Agent directory</h1><div className="sub">INBOUND · 4 LIVE · 1 SHADOW</div></div></div>
    <div className="row c2">
      {[
        { n:'Dock scheduling', s:'live', acc:88, level:'L1', run:1284, drift:0 },
        { n:'Receiving · variance', s:'live', acc:76, level:'L2', run:812, drift:-2 },
        { n:'Receiving · QC plan', s:'live', acc:81, level:'L2', run:812, drift:+1 },
        { n:'Putaway', s:'live', acc:84, level:'L1', run:2104, drift:+3 },
        { n:'Damage classifier', s:'shadow', acc:72, level:'L0', run:412, drift:null },
      ].map(a => (
        <div className="card" key={a.n}>
          <div className="card-head">
            <h3>{a.n}</h3>
            <span className={'tag ' + (a.s==='live'?'ok':'warn')}>{a.s}</span>
          </div>
          <div className="card-body">
            <div className="row c4">
              <div><div className="inline-k">Acceptance</div><div style={{ fontSize: 20, fontWeight: 500 }}>{a.acc}%</div></div>
              <div><div className="inline-k">Level</div><div style={{ fontSize: 20, fontWeight: 500 }}>{a.level}</div></div>
              <div><div className="inline-k">Runs 7d</div><div style={{ fontSize: 20, fontWeight: 500 }} className="mono">{a.run}</div></div>
              <div><div className="inline-k">Drift</div><div style={{ fontSize: 20, fontWeight: 500, color: a.drift>0?'var(--ok)':a.drift<0?'var(--risk)':'var(--ink-3)' }}>{a.drift==null?'—':(a.drift>0?'+':'')+a.drift+'pp'}</div></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BinMap = () => (
  <div className="page">
    <div className="page-head"><div><h1>Bin map · Zone P (pick)</h1><div className="sub">SITE BLR-01 · 48 BINS · LIVE OCCUPANCY</div></div></div>
    <div className="card">
      <div className="card-body">
        <div className="binmap" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
          {Array.from({length: 48}, (_,i) => {
            const c = i%11; const klass = c===0?'full':c===2?'med':c===4?'empty':c===7?'blocked':c===9?'target':'med';
            return <div key={i} className={'bin ' + klass}>{String(i+1).padStart(2,'0')}</div>;
          })}
        </div>
        <div className="flex gap-12 mt-16 small">
          <span><span className="bin" style={{ display:'inline-block', width: 12, height: 12, background: '#fff', border: '1px solid var(--rule-2)' }}/> empty</span>
          <span><span className="bin" style={{ display:'inline-block', width: 12, height: 12, background: '#d7ceb5' }}/> partial</span>
          <span><span className="bin" style={{ display:'inline-block', width: 12, height: 12, background: '#a69879' }}/> full</span>
          <span><span className="bin" style={{ display:'inline-block', width: 12, height: 12, background: 'var(--ai)' }}/> target</span>
          <span><span className="bin" style={{ display:'inline-block', width: 12, height: 12, background: '#c4b9a3' }}/> blocked</span>
        </div>
      </div>
    </div>
  </div>
);


/* ============================ core-ops-screens.jsx (exceptions only) ============================ */
const ExceptionTable = ({ rows, kind }) => {
  const { notify } = useApp();
  return (
    <div className="card">
      <div className="card-head"><h3>{kind} exceptions</h3><span className="meta">{rows.length} OPEN · AI TRIAGE LIVE</span></div>
      <div className="card-body p0">
        <table className="tbl">
          <thead><tr><th>ID</th><th>Type</th><th>Ref</th><th>Detail</th><th>Owner</th><th>Severity</th><th>Age</th><th>AI action</th><th></th></tr></thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id}>
                <td className="mono"><b>{e.id}</b></td>
                <td><b>{e.type}</b></td>
                <td className="mono small">{e.ref}{e.vendor && ` · ${e.vendor}`}{e.order && ` · ${e.order}`}</td>
                <td className="small">{e.detail}</td>
                <td>{e.owner}</td>
                <td><span className={'tag '+(e.sev==='high'?'risk':e.sev==='med'?'warn':'ok')}>{e.sev}</span></td>
                <td className="mono num">{e.age}</td>
                <td><span className="tag ai nodot" style={{ fontSize: 11 }}>{e.aiAct}</span></td>
                <td style={{ width: 160 }}>
                  <button className="btn primary" onClick={() => notify(e.id+' accepted')}>Accept AI</button>{' '}
                  <button className="btn">Override</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InboundExceptionsScreen = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Inbound exceptions</h1><div className="sub">{INBOUND_EXC.length} OPEN · VARIANCE · DAMAGE · NO ASN · HOLDS</div></div>
      <div className="act"><button className="btn">Filter by type</button><button className="btn primary">Bulk accept low-severity</button></div>
    </div>
    <div className="tiles row c4 mb-16">
      <div className="tile risk"><div className="k">High severity</div><div className="v">{INBOUND_EXC.filter(e=>e.sev==='high').length}</div><div className="d">Damage · cold breach · seal</div></div>
      <div className="tile"><div className="k">Total open</div><div className="v">{INBOUND_EXC.length}</div><div className="d">Triage in 12m</div></div>
      <div className="tile ai"><div className="k">AI auto-eligible</div><div className="v">{INBOUND_EXC.filter(e=>e.aiAct.startsWith('Auto')).length}</div><div className="d">Within bound</div></div>
      <div className="tile"><div className="k">Avg age</div><div className="v">28m</div><div className="d">Target ≤ 30m</div></div>
    </div>
    <ExceptionTable rows={INBOUND_EXC} kind="Inbound" />
  </div>
);

const OutboundExceptionsScreen = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Outbound exceptions</h1><div className="sub">{OUTBOUND_EXC.length} OPEN · SHORT · STOCKOUT · ADDRESS · OVERSIZE</div></div>
      <div className="act"><button className="btn">Filter by type</button><button className="btn primary">Bulk accept low-severity</button></div>
    </div>
    <div className="tiles row c4 mb-16">
      <div className="tile risk"><div className="k">SLA risk</div><div className="v">{OUTBOUND_EXC.filter(e=>e.sev==='high').length}</div><div className="d">Short · stockout · weight</div></div>
      <div className="tile"><div className="k">Total open</div><div className="v">{OUTBOUND_EXC.length}</div><div className="d">Across 3 waves</div></div>
      <div className="tile ai"><div className="k">Substitutes proposed</div><div className="v">2</div><div className="d">Same-family · price parity</div></div>
      <div className="tile"><div className="k">Re-allocations</div><div className="v">1</div><div className="d">Cross-FC · +₹ 220</div></div>
    </div>
    <ExceptionTable rows={OUTBOUND_EXC} kind="Outbound" />
  </div>
);

/* ============================ returns-flows.jsx ============================ */
// returns-flows.jsx — RTO, RTV, CIR dedicated screens

const RTO_QUEUE = [
  { id: 'RTO-8821', so: 'SO-44021', awb: 'BD-7712-2204', customer: 'A. Khan · BLR', reason: 'Customer refused at door', age: '6h', value: 2480, items: 2, attempts: 3, ai: { disp: 'Restock A-grade', conf: 91 }, photos: 3, status: 'inspect' },
  { id: 'RTO-8822', so: 'SO-44188', awb: 'XP-3398-1102', customer: 'M. Patel · MUM', reason: 'Address not found', age: '14h', value: 890, items: 1, attempts: 2, ai: { disp: 'Restock A-grade', conf: 88 }, photos: 2, status: 'identify' },
  { id: 'RTO-8823', so: 'SO-44204', awb: 'BD-9921-3144', customer: 'R. Verma · DEL', reason: 'COD not paid', age: '22h', value: 4120, items: 4, attempts: 3, ai: { disp: 'Restock A-grade', conf: 84 }, photos: 4, status: 'inspect' },
  { id: 'RTO-8824', so: 'SO-44091', awb: 'XP-7102-9982', customer: 'S. Iyer · CHN', reason: 'Refused — damaged outer', age: '4h', value: 6200, items: 3, attempts: 1, ai: { disp: 'B-grade · discount', conf: 67 }, photos: 5, status: 'inspect' },
  { id: 'RTO-8825', so: 'SO-44316', awb: 'BD-1188-4422', customer: 'P. Rao · HYD', reason: 'No attempt by carrier', age: '38h', value: 1340, items: 1, attempts: 0, ai: { disp: 'Restock A-grade · carrier debit', conf: 93 }, photos: 1, status: 'finance' },
];

const RTV_QUEUE = [
  { id: 'RTV-3341', vendor: 'ACME Foods', grn: 'GRN-44128', sku: 'SKU-3318', units: 24, value: 12480, reason: 'Seal damage on 24 of 240 units', stage: 'Quarantine Q-01', evidence: 8, vendorScore: 72, age: '3d', cycleSLA: '4d remaining' },
  { id: 'RTV-3342', vendor: 'Northpole Dairy', grn: 'GRN-44131', sku: 'SKU-1102', units: 12, value: 4200, reason: 'Cold-chain breach in transit (>4°C 90m)', stage: 'Evidence pack', evidence: 14, vendorScore: 81, age: '1d', cycleSLA: '6d remaining' },
  { id: 'RTV-3343', vendor: 'Halo Apparel', grn: 'GRN-43887', sku: 'SKU-4471', units: 6, value: 3000, reason: 'Stitching defect (QC reject)', stage: 'Vendor approval', evidence: 6, vendorScore: 65, age: '5d', cycleSLA: '2d remaining' },
  { id: 'RTV-3344', vendor: 'Greenleaf Bev.', grn: 'GRN-43901', sku: 'SKU-2901', units: 48, value: 8640, reason: 'Expiry < 30d at receipt', stage: 'Awaiting pickup', evidence: 4, vendorScore: 88, age: '2d', cycleSLA: '5d remaining' },
];

const CIR_QUEUE = [
  { id: 'CIR-9901', so: 'SO-43102', customer: 'T. Mehta · BLR', reason: 'Wrong item delivered', age: '2d', stage: 'inspect', items: 1, refund: 1899, fraud: 'low', photos: 4, ai: { disp: 'Refund + restock', conf: 89 } },
  { id: 'CIR-9902', so: 'SO-43044', customer: 'V. Reddy · CHN', reason: 'Damaged in transit', age: '3d', stage: 'inspect', items: 2, refund: 3240, fraud: 'low', photos: 6, ai: { disp: 'Refund + RTV vendor', conf: 81 } },
  { id: 'CIR-9903', so: 'SO-42988', customer: 'K. Bose · KOL', reason: 'Not as described', age: '5d', stage: 'pickup', items: 1, refund: 2150, fraud: 'med', photos: 2, ai: { disp: 'Refund · review fraud', conf: 62 } },
  { id: 'CIR-9904', so: 'SO-43210', customer: 'D. Joshi · PUN', reason: 'Size mismatch', age: '1d', stage: 'pickup', items: 1, refund: 1499, fraud: 'low', photos: 3, ai: { disp: 'Restock A · refund', conf: 92 } },
  { id: 'CIR-9905', so: 'SO-42741', customer: 'A. Nair · KOC', reason: 'Defective on arrival', age: '6d', stage: 'refund', items: 3, refund: 5700, fraud: 'low', photos: 8, ai: { disp: 'Refund + RTV vendor', conf: 87 } },
];

const STAGE_PCT = { identify: 16, inspect: 50, finance: 84 };

const ReturnFlowHeader = ({ title, sub, sopLink, sopName, summary, kpis, agents }) => {
  const { go } = useApp();
  return (
    <>
      <div className="page-head">
        <div><h1>{title}</h1><div className="sub">{sub}</div></div>
        <div className="act">
          <button className="btn" onClick={() => go('sop_detail', { sopId: sopLink })}>SOP · {sopName}</button>
          <button className="btn">Export</button>
          <button className="btn primary">New {title.split('·')[0].trim().toLowerCase()}</button>
        </div>
      </div>
      <div className="row mb-16" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-head"><h3>Flow summary</h3><span className="meta">PROCESS</span></div>
          <div className="card-body" style={{ fontSize: 13 }}>{summary}</div>
        </div>
        <div className="tiles row c2" style={{ alignContent: 'start' }}>
          {kpis.map((k, i) => (
            <div className={'tile ' + (k.kind || '')} key={i}>
              <div className="k">{k.k}</div><div className="v">{k.v}</div><div className="d">{k.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card mb-16">
        <div className="card-head"><h3>Agents in this flow</h3><span className="meta">{agents.length} ASSISTING</span></div>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {agents.map((a, i) => (
            <span key={i} className="tag ai nodot" style={{ fontSize: 11.5 }}>▲ {a.name} · {a.level}</span>
          ))}
        </div>
      </div>
    </>
  );
};

// ─── RTO screen ──────────────────────────────────────────────────
const RTOFlow = () => {
  const { notify } = useApp();
  const [sel, setSel] = useState(RTO_QUEUE[0]);
  return (
    <div className="page">
      <ReturnFlowHeader
        title="RTO · Return to origin"
        sub={`UNDELIVERED RETURNS · ${RTO_QUEUE.length} OPEN · IDENTIFY-TO-DISPOSITION SLA 24h`}
        sopLink="SOP-RTO" sopName="RTO-01"
        summary="Carrier returns undelivered cartons (refused, no-attempt, address-bad). Re-identify against original SO, inspect for damage in transit, decide restock A / B / scrap, settle carrier debit if attempts < SLA."
        kpis={[
          { k: 'Open RTOs', v: RTO_QUEUE.length, d: '11 SKUs · 11 units' },
          { k: 'Restock A %', v: '78%', d: 'Last 30d', kind: 'ok' },
          { k: 'Avg age @ FC', v: '17h', d: 'Target ≤ 24h' },
          { k: 'Carrier debits', v: '₹ 2.1K', d: '4 cases · this week', kind: 'risk' },
        ]}
        agents={[
          { name: 'RTO identifier', level: 'L1' },
          { name: 'Damage classifier', level: 'L0 shadow' },
          { name: 'Disposition agent', level: 'L0 shadow' },
          { name: 'Putaway', level: 'L1' },
        ]}
      />

      <div className="row" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <div className="card-head"><h3>RTO queue</h3><span className="meta">FIFO BY AGE</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>RTO</th><th>Original SO · Customer</th><th>Reason</th><th>Stage</th><th>Items</th><th>Value</th><th>AI disp.</th><th>Conf.</th></tr></thead>
              <tbody>
                {RTO_QUEUE.map(r => (
                  <tr key={r.id} className="clickable" onClick={() => setSel(r)} style={{ background: sel.id===r.id ? 'var(--bg-2)' : undefined }}>
                    <td className="mono"><b>{r.id}</b><div className="small">{r.age}</div></td>
                    <td><b>{r.customer}</b><div className="small mono">{r.so} · {r.awb}</div></td>
                    <td className="small">{r.reason}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span className="tag" style={{ minWidth:64, justifyContent:'center', textTransform:'capitalize' }}>{r.status}</span>
                        <div style={{ width: 60, height: 4, background: 'var(--bg-2)', borderRadius: 2 }}>
                          <div style={{ width: STAGE_PCT[r.status] + '%', height: '100%', background: 'var(--ink)', borderRadius: 2 }}/>
                        </div>
                      </div>
                    </td>
                    <td className="num">{r.items}</td>
                    <td className="num">₹ {r.value.toLocaleString('en-IN')}</td>
                    <td><span className="tag ai nodot" style={{ fontSize: 11 }}>{r.ai.disp.split('·')[0].trim()}</span></td>
                    <td className="mono num" style={{ color: 'var(--ai)', fontSize: 11.5 }}>{r.ai.conf}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-head"><h3>{sel.id}</h3><span className="meta">{sel.so} · {sel.awb}</span></div>
            <div className="card-body">
              <dl className="kv">
                <dt>Customer</dt><dd>{sel.customer}</dd>
                <dt>Reason</dt><dd>{sel.reason}</dd>
                <dt>Carrier attempts</dt><dd className="mono">{sel.attempts} / 3 {sel.attempts < 2 && <span className="tag risk" style={{ marginLeft: 6, fontSize: 10 }}>BELOW SLA</span>}</dd>
                <dt>Items / value</dt><dd className="mono">{sel.items} · ₹ {sel.value.toLocaleString('en-IN')}</dd>
                <dt>Photos</dt><dd>{sel.photos} attached · damage match: <span style={{ color: 'var(--ok)' }}>none</span></dd>
              </dl>
            </div>
          </div>

          <div className="rec">
            <div className="head"><span className="l">▲ Disposition agent</span><span className="tag ai nodot">L0 SHADOW</span></div>
            <div className="main">{sel.ai.disp}</div>
            <div className="rationale">Reason text + dispatch images vs current photos + customer history. {sel.attempts < 2 && 'Carrier debit recommended (attempts below SLA).'}</div>
            <div className="conf"><span>Confidence {sel.ai.conf}%</span><span className="bar"><span style={{ width: sel.ai.conf+'%' }}/></span></div>
            <div className="actions">
              <button className="btn primary" onClick={() => notify('Confirmed · '+sel.ai.disp)}>Confirm</button>
              <button className="btn">Override</button>
              <button className="btn ghost">Why</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── RTV screen ──────────────────────────────────────────────────
const RTVFlow = () => {
  const { notify } = useApp();
  const [sel, setSel] = useState(RTV_QUEUE[0]);
  const totalRecover = RTV_QUEUE.reduce((s,r)=>s+r.value,0);
  return (
    <div className="page">
      <ReturnFlowHeader
        title="RTV · Return to vendor"
        sub={`VENDOR RECOVERY · ${RTV_QUEUE.length} OPEN · CYCLE SLA 7d · CHARGEBACK ≤ 3d`}
        sopLink="SOP-RTV" sopName="RTV-01"
        summary="Defective, expired, or short-supplied stock from vendor. Quarantine, build evidence pack (≥ 3 photos + GRN refs), get vendor approval, dispatch back, raise chargeback. Vendor scorecard updated automatically."
        kpis={[
          { k: 'Open RTVs', v: RTV_QUEUE.length, d: 'Across 4 vendors' },
          { k: 'Recoverable', v: '₹ ' + (totalRecover/1000).toFixed(1) + 'K', d: 'Pending chargeback', kind: 'ai' },
          { k: 'Approval rate', v: '76%', d: 'Last quarter' },
          { k: 'Avg cycle', v: '6.2d', d: 'Target ≤ 7d', kind: 'ok' },
        ]}
        agents={[
          { name: 'Vendor recovery agent', level: 'L2' },
          { name: 'Damage classifier', level: 'L0 shadow' },
          { name: 'Billing leakage', level: 'L2' },
          { name: 'Putaway', level: 'L1' },
        ]}
      />

      <div className="row" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <div className="card-head"><h3>RTV queue</h3><span className="meta">BY VENDOR · CYCLE AGE</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>RTV</th><th>Vendor · GRN ref</th><th>Reason</th><th>Stage</th><th>Units</th><th>Value</th><th>SLA</th></tr></thead>
              <tbody>
                {RTV_QUEUE.map(r => (
                  <tr key={r.id} className="clickable" onClick={() => setSel(r)} style={{ background: sel.id===r.id ? 'var(--bg-2)' : undefined }}>
                    <td className="mono"><b>{r.id}</b><div className="small">{r.age} ago</div></td>
                    <td><b>{r.vendor}</b><div className="small mono">{r.grn} · {r.sku}</div></td>
                    <td className="small">{r.reason}</td>
                    <td><span className="tag">{r.stage}</span></td>
                    <td className="num">{r.units}</td>
                    <td className="num">₹ {r.value.toLocaleString('en-IN')}</td>
                    <td className="small mono">{r.cycleSLA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-head" style={{ borderTop: '1px solid var(--rule)', borderBottom: 'none' }}><h3>Vendor scorecards</h3><span className="meta">UPDATED LIVE FROM RTV CASES</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>Vendor</th><th>Score</th><th>Defect rate</th><th>RTV cycle</th><th>Recovery %</th><th>Tier</th></tr></thead>
              <tbody>
                {[
                  { v: 'ACME Foods', sc: 72, def: '4.2%', cyc: '6d', rec: '81%', tier: 'B' },
                  { v: 'Northpole Dairy', sc: 81, def: '2.1%', cyc: '5d', rec: '92%', tier: 'A' },
                  { v: 'Halo Apparel', sc: 65, def: '6.8%', cyc: '8d', rec: '64%', tier: 'C' },
                  { v: 'Greenleaf Bev.', sc: 88, def: '1.3%', cyc: '4d', rec: '95%', tier: 'A' },
                ].map((v,i) => (
                  <tr key={i}>
                    <td><b>{v.v}</b></td>
                    <td className="mono num"><b>{v.sc}</b></td>
                    <td className="mono num">{v.def}</td>
                    <td className="mono num">{v.cyc}</td>
                    <td className="mono num">{v.rec}</td>
                    <td><span className={'tag ' + (v.tier === 'A' ? 'ok' : v.tier === 'C' ? 'risk' : 'warn')}>{v.tier}-tier</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-head"><h3>{sel.id}</h3><span className="meta">{sel.vendor}</span></div>
            <div className="card-body">
              <dl className="kv">
                <dt>GRN ref</dt><dd className="mono">{sel.grn}</dd>
                <dt>SKU · units</dt><dd className="mono">{sel.sku} × {sel.units}</dd>
                <dt>Reason</dt><dd>{sel.reason}</dd>
                <dt>Recoverable</dt><dd className="mono"><b>₹ {sel.value.toLocaleString('en-IN')}</b></dd>
                <dt>Vendor score</dt><dd><span className="mono">{sel.vendorScore}</span> {sel.vendorScore < 70 && <span className="tag risk" style={{ marginLeft: 6, fontSize: 10 }}>AT RISK</span>}</dd>
                <dt>Stage</dt><dd>{sel.stage}</dd>
                <dt>Evidence</dt><dd>{sel.evidence} items · photos · GRN refs · QC notes</dd>
              </dl>
            </div>
          </div>

          <div className="rec">
            <div className="head"><span className="l">▲ Vendor recovery agent</span><span className="tag ai nodot">L2</span></div>
            <div className="main">Submit chargeback · ₹ {sel.value.toLocaleString('en-IN')}</div>
            <div className="rationale">Evidence pack complete ({sel.evidence} items). Vendor approval rate for {sel.vendor}: 76% on last 12 RTVs. Auto-submit eligible — chargeback drafts ready for portal upload.</div>
            <div className="actions">
              <button className="btn primary" onClick={() => notify('Submitted to '+sel.vendor+' portal')}>Submit chargeback</button>
              <button className="btn">Edit pack</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Evidence pack</h3><span className="meta">{sel.evidence} ITEMS</span></div>
            <div className="card-body">
              <div className="row c4" style={{ gap: 6 }}>
                {Array.from({length:8}).map((_,i) => (
                  <div key={i} style={{ aspectRatio:'1', background: 'repeating-linear-gradient(45deg, var(--bg-1), var(--bg-1) 6px, var(--bg-2) 6px, var(--bg-2) 12px)', border:'1px solid var(--rule)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 10, color:'var(--ink-3)' }}>EVD {i+1}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CIR screen ──────────────────────────────────────────────────
const CIRFlow = () => {
  const { notify } = useApp();
  const [sel, setSel] = useState(CIR_QUEUE[0]);
  return (
    <div className="page">
      <ReturnFlowHeader
        title="CIR · Customer initiated return"
        sub={`POST-DELIVERY RETURNS · ${CIR_QUEUE.length} OPEN · PICKUP-TO-REFUND SLA 5d`}
        sopLink="SOP-CIR" sopName="CIR-01"
        summary="Customer requests return via app/portal. Carrier reverse pickup, FC inspect with damage classifier + fraud screen, decide refund / replace / restock. Refund ≤ 24h post-receipt."
        kpis={[
          { k: 'Open CIRs', v: CIR_QUEUE.length, d: 'Across 5 customers' },
          { k: 'Avg cycle', v: '4.2d', d: 'Target ≤ 5d', kind: 'ok' },
          { k: 'Restock A %', v: '64%', d: 'Last 30d' },
          { k: 'Fraud catch', v: '3', d: 'This week · ₹ 8.4K saved', kind: 'ai' },
        ]}
        agents={[
          { name: 'Reverse pickup agent', level: 'L1' },
          { name: 'Fraud screen', level: 'L1' },
          { name: 'Damage classifier', level: 'L0 shadow' },
          { name: 'Disposition agent', level: 'L0 shadow' },
        ]}
      />

      <div className="card mb-16">
        <div className="card-head"><h3>Pipeline</h3><span className="meta">CIR STAGES · LIVE</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[
              { s: 'Requested', c: CIR_QUEUE.length, d: 'Auto-approved' },
              { s: 'Pickup', c: CIR_QUEUE.filter(c=>c.stage==='pickup').length, d: 'Carrier en route' },
              { s: 'Inspect', c: CIR_QUEUE.filter(c=>c.stage==='inspect').length, d: 'AI + manual' },
              { s: 'Refund', c: CIR_QUEUE.filter(c=>c.stage==='refund').length, d: 'Finance queue' },
              { s: 'Putaway', c: 0, d: 'Restock to bin' },
            ].map((p,i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--rule)', padding: 12, position: 'relative' }}>
                <div className="inline-k" style={{ marginBottom: 4 }}>Stage {i+1}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{p.s}</div>
                <div className="small mt-4">{p.d}</div>
                <div className="mono num" style={{ position: 'absolute', top: 12, right: 12, fontSize: 18, fontWeight: 600 }}>{p.c}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <div className="card-head"><h3>CIR queue</h3><span className="meta">FIFO BY AGE</span></div>
          <div className="card-body p0">
            <table className="tbl">
              <thead><tr><th>CIR</th><th>SO · Customer</th><th>Reason</th><th>Stage</th><th>Refund</th><th>Fraud</th><th>AI disp.</th><th>Conf.</th></tr></thead>
              <tbody>
                {CIR_QUEUE.map(c => (
                  <tr key={c.id} className="clickable" onClick={() => setSel(c)} style={{ background: sel.id===c.id ? 'var(--bg-2)' : undefined }}>
                    <td className="mono"><b>{c.id}</b><div className="small">{c.age}</div></td>
                    <td><b>{c.customer}</b><div className="small mono">{c.so}</div></td>
                    <td className="small">{c.reason}</td>
                    <td><span className="tag" style={{ textTransform: 'capitalize' }}>{c.stage}</span></td>
                    <td className="num">₹ {c.refund.toLocaleString('en-IN')}</td>
                    <td><span className={'tag ' + (c.fraud === 'low' ? 'ok' : c.fraud === 'med' ? 'warn' : 'risk')}>{c.fraud}</span></td>
                    <td><span className="tag ai nodot" style={{ fontSize: 11 }}>{c.ai.disp.split('·')[0].trim()}</span></td>
                    <td className="mono num" style={{ color: 'var(--ai)', fontSize: 11.5 }}>{c.ai.conf}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-head"><h3>{sel.id}</h3><span className="meta">{sel.so}</span></div>
            <div className="card-body">
              <dl className="kv">
                <dt>Customer</dt><dd>{sel.customer}</dd>
                <dt>Reason</dt><dd>{sel.reason}</dd>
                <dt>Items / refund</dt><dd className="mono">{sel.items} · ₹ {sel.refund.toLocaleString('en-IN')}</dd>
                <dt>Stage</dt><dd style={{ textTransform: 'capitalize' }}>{sel.stage}</dd>
                <dt>Photos</dt><dd>{sel.photos} attached</dd>
                <dt>Fraud signal</dt><dd><span className={'tag ' + (sel.fraud === 'low' ? 'ok' : sel.fraud === 'med' ? 'warn' : 'risk')}>{sel.fraud}</span></dd>
              </dl>
            </div>
          </div>

          <div className="rec">
            <div className="head"><span className="l">▲ Disposition agent</span><span className="tag ai nodot">L0 SHADOW</span></div>
            <div className="main">{sel.ai.disp}</div>
            <div className="rationale">Reason text matches damage classifier output. Customer return history: 4 of 12 orders returned (above 25% threshold — flagged). {sel.fraud === 'med' && 'Manual review required before refund.'}</div>
            <div className="conf"><span>Confidence {sel.ai.conf}%</span><span className="bar"><span style={{ width: sel.ai.conf+'%' }}/></span></div>
            <div className="actions">
              <button className="btn primary" onClick={() => notify('Confirmed · '+sel.ai.disp)}>Confirm</button>
              <button className="btn">Hold for fraud</button>
              <button className="btn ghost">Override</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Fraud screen</h3><span className="tag ai nodot">L1</span></div>
            <div className="card-body">
              <table className="tbl"><tbody>
                <tr><td>Return rate (90d)</td><td className="num mono">33% <span className="tag risk" style={{ fontSize: 10, marginLeft: 4 }}>HIGH</span></td></tr>
                <tr><td>Refund total (90d)</td><td className="num mono">₹ 18.4K</td></tr>
                <tr><td>Reason diversity</td><td className="num mono">5 distinct</td></tr>
                <tr><td>Avg refund age</td><td className="num mono">3.8d</td></tr>
              </tbody></table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ============================ core-ops-screens.jsx (cycle count) ============================ */
const CycleCountScreen = () => {
  const { notify } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Cycle count &amp; audit</h1><div className="sub">{CYCLE_COUNTS.length} TASKS · ABC + AD-HOC + SNAP</div></div>
        <div className="act"><button className="btn">Schedule</button><button className="btn primary" onClick={() => notify('Snap audit started · zone A')}>Start snap audit</button></div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile"><div className="k">Active counts</div><div className="v">{CYCLE_COUNTS.filter(c=>c.status==='active').length}</div><div className="d">In progress</div></div>
        <div className="tile risk"><div className="k">Discrepancies open</div><div className="v">{CYCLE_DISCREPANCY.length}</div><div className="d">Net ₹ {CYCLE_DISCREPANCY.reduce((s,d)=>s+Math.abs(d.value),0).toLocaleString('en-IN')}</div></div>
        <div className="tile ai"><div className="k">Accuracy 7d</div><div className="v">99.21%</div><div className="d">-0.18pp vs prev</div></div>
        <div className="tile"><div className="k">Coverage MTD</div><div className="v">68%</div><div className="d">A-class · target 90%</div></div>
      </div>

      <div className="card mb-16">
        <div className="card-head"><h3>Count tasks</h3><span className="meta">SCHEDULED + AD-HOC</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Task</th><th>Kind</th><th>Bins</th><th>Counted</th><th>Variance</th><th>Accuracy</th><th>Assigned</th><th>SLA</th><th>Status</th></tr></thead>
            <tbody>
              {CYCLE_COUNTS.map(c => (
                <tr key={c.id}>
                  <td className="mono"><b>{c.id}</b></td>
                  <td><b>{c.kind}</b></td>
                  <td className="num">{c.bins}</td>
                  <td className="num">{c.counted}</td>
                  <td className="num mono">{c.variance}</td>
                  <td className="num mono">{c.accuracy==null ? '—' : c.accuracy+'%'}</td>
                  <td>{c.assignedTo}</td>
                  <td className="mono num">{c.sla}</td>
                  <td>
                    {c.status==='active'       && <span className="tag ok">active</span>}
                    {c.status==='discrepancy'  && <span className="tag risk">discrepancy</span>}
                    {c.status==='queued'       && <span className="tag">queued</span>}
                    {c.status==='review'       && <span className="tag warn">review</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Open discrepancies</h3><span className="meta">PENDING ADJUSTMENT</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Bin</th><th>SKU</th><th>System</th><th>Counted</th><th>Delta</th><th>₹ impact</th><th>Suspect cause</th><th>Age</th><th></th></tr></thead>
            <tbody>
              {CYCLE_DISCREPANCY.map((d,i) => (
                <tr key={i}>
                  <td className="mono"><b>{d.bin}</b></td>
                  <td className="mono">{d.sku}</td>
                  <td className="num">{d.system}</td>
                  <td className="num">{d.counted}</td>
                  <td className="num mono"><span style={{ color: d.delta<0?'var(--risk)':'var(--ok)' }}>{d.delta>0?'+':''}{d.delta}</span></td>
                  <td className="num mono">₹ {d.value.toLocaleString('en-IN')}</td>
                  <td className="small">{d.suspect}</td>
                  <td className="mono num">{d.age}</td>
                  <td style={{ width: 200 }}>
                    <button className="btn primary" onClick={() => notify('Adjustment posted · '+d.bin)}>Adjust + audit</button>
                    <button className="btn">Re-count</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


/* ============================= GATEPASS (core-ops-screens.jsx) ============================= */
const GatepassScreen = () => {
  const { notify } = useApp();
  const active = GATEPASS_LOG.filter(g=>g.status==='active');
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Gatepass log</h1><div className="sub">SECURITY · ISSUED + CLEARED · SEAL TRACKING</div></div>
        <div className="act"><button className="btn">Print today</button><button className="btn primary" onClick={() => notify('New gatepass issued')}>Issue gatepass</button></div>
      </div>

      <div className="tiles row c4 mb-16">
        <div className="tile"><div className="k">Issued today</div><div className="v">{GATEPASS_LOG.length}</div><div className="d">All POs + STNs</div></div>
        <div className="tile ai"><div className="k">Active</div><div className="v">{active.length}</div><div className="d">In facility · unloading</div></div>
        <div className="tile"><div className="k">Avg clearance</div><div className="v">22m</div><div className="d">Issue → unload start</div></div>
        <div className="tile risk"><div className="k">Seal breaches</div><div className="v">0</div><div className="d">This shift</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Gatepasses</h3><span className="meta">CHRONOLOGICAL</span></div>
        <div className="card-body p0">
          <table className="tbl">
            <thead><tr><th>Gatepass</th><th>Ref</th><th>Vehicle</th><th>Issued to</th><th>Seal #</th><th>Issued</th><th>Cleared</th><th>Supervisor</th><th>Status</th></tr></thead>
            <tbody>
              {GATEPASS_LOG.map(g => (
                <tr key={g.id}>
                  <td className="mono"><b>{g.id}</b></td>
                  <td className="mono">{g.ref}</td>
                  <td className="mono small">{g.vehicle}</td>
                  <td><b>{g.issuedTo}</b></td>
                  <td className="mono">{g.sealNo}</td>
                  <td className="mono num">{g.issuedAt}</td>
                  <td className="mono num">{g.clearedAt || '—'}</td>
                  <td>{g.supervisor}</td>
                  <td>{g.status==='cleared' ? <span className="tag ok">cleared</span> : <span className="tag warn">active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


/* ============================= FLOOR HANDHELDS (handheld-screens.jsx) ============================= */
const PhoneFrame = ({ children, label }) => (
  <div style={{ position: 'relative' }}>
    <div className="small mono mb-8" style={{ color: 'var(--ink-3)' }}>HANDHELD · {label}</div>
    <div style={{
      width: 380, minHeight: 760, background: '#1a1a1a', borderRadius: 36, padding: 12,
      boxShadow: '0 12px 40px rgba(0,0,0,0.18)', position: 'relative'
    }}>
      <div style={{
        background: '#faf8f3', borderRadius: 28, height: 736, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', position: 'relative'
      }}>
        <div style={{ height: 28, background: '#1a1a1a', color: '#fff', fontFamily: 'var(--mono)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' }}>
          <span>10:14</span><span>5G ▮▮▮ 84%</span>
        </div>
        {children}
      </div>
    </div>
  </div>
);

const HHHeader = ({ title, sub, back }) => (
  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)', background: '#fff' }}>
    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{back && '◀ '}{sub}</div>
    <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{title}</div>
  </div>
);

const ScanBox = ({ label, value, ok }) => (
  <div style={{ border: '2px dashed ' + (ok ? 'var(--ok)' : 'var(--rule-strong)'), borderRadius: 4, padding: '14px 12px', background: ok ? '#eef7ee' : '#fff' }}>
    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--mono)', marginTop: 2 }}>{value || '—'}</div>
    {ok && <div style={{ fontSize: 11, color: 'var(--ok)', marginTop: 2 }}>✓ matched</div>}
  </div>
);

const HHBtn = ({ children, kind, onClick, full }) => (
  <button onClick={onClick} style={{
    background: kind === 'primary' ? '#1a1a1a' : kind === 'risk' ? '#fff' : '#fff',
    color: kind === 'primary' ? '#fff' : kind === 'risk' ? 'var(--risk)' : 'var(--ink)',
    border: '1px solid ' + (kind === 'risk' ? 'var(--risk)' : '#1a1a1a'),
    padding: '12px 16px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
    width: full ? '100%' : 'auto', fontFamily: 'var(--sans)'
  }}>{children}</button>
);

const HHDockUnload = () => {
  const { notify } = useApp();
  const [step, setStep] = useState(1);
  return (
    <PhoneFrame label="Inbound agent · Dock D-02">
      <HHHeader sub="DOCK D-02 · ASN-77821" title="Unload · carton 14 of 48" />
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div className="rec" style={{ background: '#eaf1fa', borderColor: 'var(--ai)', padding: 10 }}>
          <div className="head"><span className="l">▲ Dock agent</span><span className="tag ai nodot">L2</span></div>
          <div className="main" style={{ fontSize: 13 }}>ASN-77821 · 48 cartons · A-tier vendor</div>
          <div className="small mt-4">Unload time SLA 90m · 32m elapsed</div>
        </div>

        <ScanBox label="Carton barcode" value={step >= 1 ? 'CTN-77821-014' : ''} ok={step >= 1}/>
        <ScanBox label="ASN line match" value={step >= 2 ? 'SKU-2204 × 24' : ''} ok={step >= 2}/>
        <ScanBox label="Photo capture" value={step >= 3 ? '✓ taken (1.2MB)' : 'tap to shoot'} ok={step >= 3}/>

        {step >= 3 && (
          <div className="rec" style={{ background: '#eef7ee', borderColor: 'var(--ok)', padding: 10 }}>
            <div className="main" style={{ fontSize: 13, color: 'var(--ok)' }}>✓ Match · variance 0%</div>
            <div className="small mt-4">Auto-receipt eligible · routing to QC sample plan</div>
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: 10, fontSize: 12 }}>
          <div className="inline-k" style={{ marginBottom: 4 }}>Cartons remaining</div>
          <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>34 <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· est 18 min</span></div>
        </div>
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--rule)', display: 'flex', gap: 8, background: '#fff' }}>
        {step < 3 ? (
          <HHBtn kind="primary" full onClick={() => setStep(step + 1)}>{step === 1 ? 'Match ASN' : 'Take photo'}</HHBtn>
        ) : (
          <>
            <HHBtn kind="risk" onClick={() => notify('Variance flagged · supervisor paged')}>Variance</HHBtn>
            <HHBtn kind="primary" onClick={() => { notify('Carton 14 received'); setStep(1); }}>Confirm next ▶</HHBtn>
          </>
        )}
      </div>
    </PhoneFrame>
  );
};

const HHPicker = () => {
  const { notify } = useApp();
  const [step, setStep] = useState(1);
  const lineNo = 7;
  const total = 18;
  return (
    <PhoneFrame label="Picker · Wave W-2204">
      <HHHeader sub={`WAVE W-2204 · LINE ${lineNo}/${total}`} title="Pick to tote T-04" />
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div style={{ background: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 4 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#bbb', textTransform: 'uppercase' }}>Walk to bin</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)' }}>A-12-04</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#bbb', marginTop: 2 }}>Zone A · aisle 12 · 18m from current</div>
        </div>

        <ScanBox label="1. Scan bin" value={step >= 1 ? 'A-12-04' : ''} ok={step >= 1}/>
        <ScanBox label="2. Scan SKU" value={step >= 2 ? 'SKU-2204' : ''} ok={step >= 2}/>

        <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: 10 }}>
          <div className="inline-k" style={{ marginBottom: 4 }}>Quantity to pick</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--mono)' }}>3</div>
            <div className="small">Bin shows 27 · pick face min 8</div>
          </div>
        </div>

        {step >= 2 && (
          <div className="rec" style={{ background: '#eaf1fa', borderColor: 'var(--ai)', padding: 10 }}>
            <div className="head"><span className="l">▲ Pick assist</span><span className="tag ai nodot">L1</span></div>
            <div className="main" style={{ fontSize: 13 }}>Pick face below threshold</div>
            <div className="small mt-4">Replenishment task R-882 created · runner assigned</div>
          </div>
        )}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--rule)', display: 'flex', gap: 8, background: '#fff' }}>
        {step < 2 ? (
          <HHBtn kind="primary" full onClick={() => setStep(step + 1)}>Scan {step === 0 ? 'bin' : 'SKU'}</HHBtn>
        ) : (
          <>
            <HHBtn kind="risk" onClick={() => notify('Short flagged · AI proposing substitute')}>Short</HHBtn>
            <HHBtn kind="primary" onClick={() => notify('Line confirmed · next bin C-08-02')}>Confirm 3 ▶</HHBtn>
          </>
        )}
      </div>
    </PhoneFrame>
  );
};

const HHPacker = () => {
  const { notify } = useApp();
  return (
    <PhoneFrame label="Packer · Station P-03">
      <HHHeader sub="STATION P-03 · ORDER SO-90041" title="Pack · 4 items" />
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div className="rec" style={{ background: '#eaf1fa', borderColor: 'var(--ai)', padding: 10 }}>
          <div className="head"><span className="l">▲ Carton agent</span><span className="tag ai nodot">L1</span></div>
          <div className="main" style={{ fontSize: 14 }}>Carton C-2 · 32×24×18cm</div>
          <div className="rationale" style={{ fontSize: 11.5, marginTop: 4 }}>Volume fit 84% · void 16% · 1 fragile item → padding required</div>
          <div className="conf" style={{ marginTop: 6 }}><span>Confidence 92%</span><span className="bar"><span style={{ width: '92%' }}/></span></div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--rule)' }}>
          <div style={{ padding: 10, borderBottom: '1px solid var(--rule)', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Scan items into carton</div>
          {[
            { sku: 'SKU-2204', qty: 1, scanned: true,  fragile: false },
            { sku: 'SKU-3318', qty: 2, scanned: true,  fragile: true },
            { sku: 'SKU-4471', qty: 1, scanned: false, fragile: false },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ width: 16, height: 16, borderRadius: 2, border: '1px solid var(--ink)', background: it.scanned ? 'var(--ok)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}>{it.scanned && '✓'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>{it.sku}</div>
                <div className="small">qty {it.qty}{it.fragile && ' · fragile'}</div>
              </div>
              {!it.scanned && <div className="small mono" style={{ color: 'var(--risk)' }}>scan</div>}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: 10 }}>
          <div className="inline-k" style={{ marginBottom: 4 }}>Weight check</div>
          <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>1.84 kg <span style={{ fontSize: 12, color: 'var(--ok)' }}>· within ±5% of expected</span></div>
        </div>
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--rule)', display: 'flex', gap: 8, background: '#fff' }}>
        <HHBtn onClick={() => notify('Carton override → C-1')}>Override</HHBtn>
        <HHBtn kind="primary" full onClick={() => notify('Sealed · label printed · manifest queued')}>Seal &amp; print label ▶</HHBtn>
      </div>
    </PhoneFrame>
  );
};

const HHQCInspect = () => {
  const { notify } = useApp();
  return (
    <PhoneFrame label="QC operator · Inspect">
      <HHHeader sub="GRN-44128 · ASN-77821" title="QC sample · 4 of 12" />
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: 10 }}>
          <div className="inline-k" style={{ marginBottom: 4 }}>Inspecting</div>
          <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--mono)' }}>SKU-3318</div>
          <div className="small">Vendor: ACME Foods · A-tier · sample 5%</div>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: 4, padding: 14 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#bbb', textTransform: 'uppercase' }}>Photo capture</div>
          <div style={{ height: 160, background: 'repeating-linear-gradient(45deg, #2a2a2a, #2a2a2a 8px, #1f1f1f 8px, #1f1f1f 16px)', marginTop: 8, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12 }}>tap to shoot</div>
        </div>

        <div className="rec" style={{ background: '#eaf1fa', borderColor: 'var(--ai)', padding: 10 }}>
          <div className="head"><span className="l">▲ Defect classifier</span><span className="tag ai nodot">L1</span></div>
          <div className="main" style={{ fontSize: 14 }}>No defect detected</div>
          <div className="rationale" style={{ fontSize: 11.5, marginTop: 4 }}>Seal intact · no surface damage · packaging matches reference</div>
          <div className="conf" style={{ marginTop: 6 }}><span>Confidence 94%</span><span className="bar"><span style={{ width: '94%' }}/></span></div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--rule)' }}>
          <div style={{ padding: 10, borderBottom: '1px solid var(--rule)', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Manual checks</div>
          {[
            { k: 'Seal intact',     v: 'pass' },
            { k: 'Expiry ≥ 90d',    v: 'pass' },
            { k: 'Label legible',   v: 'pass' },
            { k: 'Weight tolerance',v: 'pass' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: i < 3 ? '1px solid var(--rule)' : 'none' }}>
              <div style={{ fontSize: 13 }}>{c.k}</div>
              <span className="tag ok nodot" style={{ fontSize: 11 }}>{c.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--rule)', display: 'flex', gap: 8, background: '#fff' }}>
        <HHBtn kind="risk" onClick={() => notify('Failed · routed to RTV')}>Fail</HHBtn>
        <HHBtn kind="primary" full onClick={() => notify('Pass confirmed · 8 to go')}>Pass ▶</HHBtn>
      </div>
    </PhoneFrame>
  );
};

const FloorScreens = () => (
  <div className="page">
    <div className="page-head">
      <div><h1>Floor handhelds</h1><div className="sub">FLOOR ROLES · DOCK · PICKER · PACKER · QC · LIVE FROM ANDROID HANDHELD</div></div>
      <div className="act">
        <button className="btn">Demo data</button>
        <button className="btn primary">Open in handheld</button>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
      <HHDockUnload />
      <HHPicker />
      <HHPacker />
      <HHQCInspect />
    </div>
  </div>
);


export {
  Dashboard, ControlTowerHome, ManagerHome, CtStuck, MgrTrends, Alerts,
  MgrAgents, Agents, AdmDrift, InboundExceptionsScreen, OutboundExceptionsScreen,
  CtIncidents, FinRecovery, FinDisputes,
  OpReturns, QcReturns, RTOFlow, RTVFlow, CIRFlow, QCHome, CycleCountScreen,
  AdmUsers, AdmPolicies, AdmMaster, AdmAudit, AdminHome, FinanceHome,
  CtCarriers, FinScorecards, GatepassScreen, FloorScreens,
};
