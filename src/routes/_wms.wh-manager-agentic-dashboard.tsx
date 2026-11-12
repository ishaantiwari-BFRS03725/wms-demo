import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, ChevronDown, Eye, Loader2, Share2, Sparkles, X } from "lucide-react";
import type { CategoryDef, CategoryStatus, IssueStatus, OrderRow, PickerRow, ProductivityPoint, SlottingRow, StockRow, SubAgentDef } from "@/lib/wh-agents-data";
import {
  ALL_ISSUES,
  ALL_SCANNED_AT,
  CATEGORIES,
  LIVE_STATUS_MAP,
  PREVIEW_DATA,
  RUN_TICK_MS,
  SUMMARY_HEADLINE,
  SUMMARY_START,
  SUMMARY_TEXT,
  TIMING,
  TOTAL_RUNTIME,
  TOTAL_SUBAGENTS,
  categoryStatus,
  overallStatus,
  phaseOf,
  revealChars,
} from "@/lib/wh-agents-data";

export const Route = createFileRoute("/_wms/wh-manager-agentic-dashboard")({
  head: () => ({ meta: [{ title: "WH Manager Agentic Dashboard" }] }),
  component: WhManagerAgenticDashboard,
});

function WhManagerAgenticDashboard() {
  const [runStartAt, setRunStartAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [issueStatus, setIssueStatus] = useState<Record<string, IssueStatus>>({});
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  // Only true when opened via the "N open issues" button — the sidebar list
  // inside the workbench stays hidden for the normal per-card Preview flow.
  const [sidebarMode, setSidebarMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFilter, setShareFilter] = useState<string>("all");

  const hasRun = runStartAt != null;
  const networkDone = hasRun && elapsed >= TOTAL_RUNTIME;
  const allScanned = hasRun && elapsed >= ALL_SCANNED_AT;
  const isGenerating = hasRun && !networkDone;
  const summaryReady = hasRun && elapsed >= SUMMARY_START;

  useEffect(() => {
    if (runStartAt == null) return;
    const id = setInterval(() => {
      const next = Date.now() - runStartAt;
      setElapsed(next);
      if (next >= TOTAL_RUNTIME) clearInterval(id);
    }, RUN_TICK_MS);
    return () => clearInterval(id);
  }, [runStartAt]);

  useEffect(() => {
    if (networkDone) {
      setLastRun(new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }));
    }
  }, [networkDone]);

  const handleGenerate = () => {
    const init: Record<string, IssueStatus> = {};
    ALL_ISSUES.forEach((i) => {
      init[i.id] = "open";
    });
    setIssueStatus(init);
    setElapsed(0);
    setSelectedIssueId(null);
    setSidebarMode(false);
    setSummaryExpanded(false);
    setShareOpen(false);
    setShareFilter("all");
    setRunStartAt(Date.now());
  };

  const handleResolve = (issueId: string) => {
    setIssueStatus((s) => ({ ...s, [issueId]: "resolving" }));
    setTimeout(() => {
      setIssueStatus((s) => ({ ...s, [issueId]: "resolved" }));
    }, 800);
  };

  const detectedOpenIssues = allScanned
    ? ALL_ISSUES.filter((i) => (issueStatus[i.id] ?? "open") !== "resolved").length
    : null;

  // Live list of issues that have finished typing and haven't had action taken yet
  // — feeds the sidebar list inside the workbench, worst severity first.
  const openIssuesList = ALL_ISSUES.filter(
    (i) => phaseOf(i.id, elapsed) === "done" && (issueStatus[i.id] ?? "open") !== "resolved",
  ).sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1));

  const selectedIssue = selectedIssueId ? ALL_ISSUES.find((i) => i.id === selectedIssueId) ?? null : null;
  const overall = overallStatus(hasRun, elapsed, issueStatus);
  const liveDotColor = overall === "idle" ? "#9a978d" : LIVE_STATUS_MAP[overall].color;

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="wa-screen">
        <div className="wa-topbar">
          <div>
            <div className="wa-live">
              <span className="wa-live-dot" style={{ background: liveDotColor }} aria-hidden="true" />
              Live · Agent Network
              {overall !== "idle" && (
                <span className="wa-live-status" style={{ color: LIVE_STATUS_MAP[overall].color }}>
                  · {LIVE_STATUS_MAP[overall].label}
                </span>
              )}
            </div>
            <div className="wa-topbar-title">WH Manager Agentic Dashboard</div>
            <div className="wa-topbar-sub">3 categories · {TOTAL_SUBAGENTS} sub-agents checking Inbound, Outbound, and Inventory</div>
          </div>
          <div className="wa-topbar-actions">
            {detectedOpenIssues != null && (
              <button
                type="button"
                className="wa-asof wa-issue-badge wa-issue-badge-btn"
                style={{ color: detectedOpenIssues > 0 ? "#dc2626" : "#16a34a", borderColor: detectedOpenIssues > 0 ? "#dc2626" : "#16a34a" }}
                disabled={openIssuesList.length === 0}
                onClick={() => {
                  if (openIssuesList.length === 0) return;
                  setSelectedIssueId(openIssuesList[0].id);
                  setSidebarMode(true);
                }}
              >
                {detectedOpenIssues > 0 ? `${detectedOpenIssues} open issue${detectedOpenIssues === 1 ? "" : "s"}` : "No open issues"}
              </button>
            )}
            <span className="wa-asof">{lastRun ? `Last run ${lastRun}` : "Not run yet"}</span>
            <button className="wa-btn-outline" disabled={!networkDone} onClick={() => setShareOpen(true)}>
              <Share2 className="wa-ico-sm" aria-hidden="true" />
              Share
            </button>
            <button className="wa-btn-generate" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="wa-ico-sm wa-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="wa-ico-sm" aria-hidden="true" />
              )}
              {isGenerating ? "Running agents…" : hasRun ? "Regenerate" : "Generate"}
            </button>
          </div>
        </div>

        <div className="wa-body">
          {!hasRun && (
            <div className="wa-idle">
              <span className="wa-idle-ico">
                <Bot className="wa-ico-lg" aria-hidden="true" />
              </span>
              <div className="wa-idle-title">No report generated yet</div>
              <div className="wa-idle-sub">
                Click Generate to dispatch sub-agents across Inbound, Outbound, and Inventory — only categories with real
                issues will show detail, everything else comes back green.
              </div>
            </div>
          )}

          {hasRun && (
            <>
              <div className="wa-summary-bar">
                <button className="wa-summary-toggle" onClick={() => setSummaryExpanded((e) => !e)}>
                  <Sparkles className="wa-ico-sm" aria-hidden="true" />
                  <span className="wa-summary-line">
                    {summaryReady ? (
                      <>Executive Summary — {SUMMARY_HEADLINE}</>
                    ) : (
                      <>
                        <Loader2 className="wa-ico-xs wa-spin" style={{ marginRight: 6 }} aria-hidden="true" />
                        Compiling executive summary…
                      </>
                    )}
                  </span>
                  <ChevronDown className={`wa-ico-sm wa-chevron ${summaryExpanded ? "wa-chevron-open" : ""}`} aria-hidden="true" />
                </button>
                {summaryExpanded && (
                  <div className="wa-summary-body">
                    <div className="wa-console wa-console-summary">
                      {SUMMARY_TEXT.slice(0, revealChars(elapsed, SUMMARY_START, SUMMARY_TEXT.length))}
                      {revealChars(elapsed, SUMMARY_START, SUMMARY_TEXT.length) < SUMMARY_TEXT.length && (
                        <span className="wa-cursor">▌</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="wa-category-grid">
                {CATEGORIES.map((cat) => (
                  <CategoryBlock
                    key={cat.id}
                    category={cat}
                    elapsed={elapsed}
                    issueStatus={issueStatus}
                    selectedIssueId={selectedIssueId}
                    onPreview={(id) => {
                      setSelectedIssueId(id);
                      setSidebarMode(false);
                    }}
                  />
                ))}
              </div>

              <PreviewPanel
                subAgent={selectedIssue}
                status={selectedIssueId ? issueStatus[selectedIssueId] ?? "open" : "open"}
                openIssues={sidebarMode ? openIssuesList : []}
                selectedIssueId={selectedIssueId}
                onSelect={setSelectedIssueId}
                onConfirm={() => selectedIssueId && handleResolve(selectedIssueId)}
                onClose={() => {
                  setSelectedIssueId(null);
                  setSidebarMode(false);
                }}
              />
            </>
          )}
        </div>

        {shareOpen && (
          <ShareModal
            filter={shareFilter}
            onFilterChange={setShareFilter}
            onClose={() => setShareOpen(false)}
            issueStatus={issueStatus}
          />
        )}
      </div>
    </div>
  );
}

function CategoryBlock({
  category,
  elapsed,
  issueStatus,
  selectedIssueId,
  onPreview,
}: {
  category: CategoryDef;
  elapsed: number;
  issueStatus: Record<string, IssueStatus>;
  selectedIssueId: string | null;
  onPreview: (id: string) => void;
}) {
  const status = categoryStatus(category, elapsed, issueStatus);
  const issuesInCat = category.subAgents.filter((sa) => sa.hasIssue);
  const everFoundIssue = issuesInCat.length > 0;
  const allDone = status !== "scanning";

  return (
    <div className="wa-category">
      <div className="wa-category-head">
        <span className="wa-category-ico">
          <category.icon className="wa-ico-sm" aria-hidden="true" />
        </span>
        <div className="wa-category-head-text">
          <div className="wa-category-title">{category.title}</div>
          <div className="wa-category-caption">{category.caption}</div>
        </div>
        <CategoryLight status={status} />
      </div>

      <div className="wa-pill-row">
        {category.subAgents.map((sa) => (
          <SubAgentPill key={sa.id} subAgent={sa} elapsed={elapsed} issueStatus={issueStatus[sa.id]} />
        ))}
        {category.extraAgentCount > 0 && <ExtraAgentsPill count={category.extraAgentCount} allDone={allDone} />}
      </div>

      {allDone && !everFoundIssue && (
        <div className="wa-clear-banner">
          <CheckCircle2 className="wa-ico-sm" aria-hidden="true" />
          All clear — {category.subAgents.length + category.extraAgentCount} sub-agents checked, no issues found.
        </div>
      )}

      {everFoundIssue && (
        <div className="wa-issue-list">
          {issuesInCat.map((sa) => {
            if (phaseOf(sa.id, elapsed) !== "done") return null;
            return (
              <IssueCardCompact
                key={sa.id}
                subAgent={sa}
                elapsed={elapsed}
                status={issueStatus[sa.id] ?? "open"}
                isSelected={selectedIssueId === sa.id}
                onPreview={() => onPreview(sa.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubAgentPill({ subAgent, elapsed, issueStatus }: { subAgent: SubAgentDef; elapsed: number; issueStatus?: IssueStatus }) {
  const phase = phaseOf(subAgent.id, elapsed);
  const Icon = subAgent.icon;

  if (phase === "queued") {
    return (
      <span className="wa-pill wa-pill-queued">
        <Icon className="wa-ico-xs" aria-hidden="true" />
        {subAgent.label}
      </span>
    );
  }
  if (phase === "scanning") {
    return (
      <span className="wa-pill wa-pill-scanning">
        <Loader2 className="wa-ico-xs wa-spin" aria-hidden="true" />
        {subAgent.label}
      </span>
    );
  }
  if (!subAgent.hasIssue) {
    return (
      <span className="wa-pill wa-pill-clear">
        <CheckCircle2 className="wa-ico-xs" aria-hidden="true" />
        {subAgent.label}
      </span>
    );
  }
  if (issueStatus === "resolved") {
    return (
      <span className="wa-pill wa-pill-resolved">
        <CheckCircle2 className="wa-ico-xs" aria-hidden="true" />
        {subAgent.label}
      </span>
    );
  }
  return (
    <span className={`wa-pill wa-pill-${subAgent.severity}`}>
      <AlertTriangle className="wa-ico-xs" aria-hidden="true" />
      {subAgent.label}
    </span>
  );
}

function ExtraAgentsPill({ count, allDone }: { count: number; allDone: boolean }) {
  if (!allDone) {
    return (
      <span className="wa-pill wa-pill-scanning">
        <Loader2 className="wa-ico-xs wa-spin" aria-hidden="true" />
        +{count} other agents
      </span>
    );
  }
  return (
    <span className="wa-pill wa-pill-clear">
      <CheckCircle2 className="wa-ico-xs" aria-hidden="true" />
      +{count} other agents · clear
    </span>
  );
}

function IssueCardCompact({
  subAgent,
  elapsed,
  status,
  isSelected,
  onPreview,
}: {
  subAgent: SubAgentDef;
  elapsed: number;
  status: IssueStatus;
  isSelected: boolean;
  onPreview: () => void;
}) {
  const text = subAgent.shortFinding ?? "";
  const shown = revealChars(elapsed, TIMING[subAgent.id].end, text.length);
  const typing = shown < text.length;
  const actioned = status === "resolved";

  // Once an action has been taken, collapse the card down to a single
  // de-emphasized row instead of keeping the full finding on screen.
  if (actioned) {
    return (
      <div className={`wa-issue-card wa-issue-collapsed ${isSelected ? "wa-issue-selected" : ""}`}>
        <CheckCircle2 className="wa-ico-xs wa-issue-collapsed-check" aria-hidden="true" />
        <span className="wa-issue-collapsed-title">{subAgent.issueTitle}</span>
        <span className="wa-chip wa-chip-resolved">Action Taken</span>
        <button className="wa-preview-btn wa-preview-btn-ghost" onClick={onPreview}>
          View details
        </button>
      </div>
    );
  }

  return (
    <div className={`wa-issue-card wa-issue-${subAgent.severity} ${isSelected ? "wa-issue-selected" : ""}`}>
      <div className="wa-issue-head">
        <span className="wa-issue-sev-dot" style={{ background: subAgent.severity === "red" ? "#dc2626" : "#d97706" }} />
        <div className="wa-issue-head-text">
          <div className="wa-issue-title">{subAgent.issueTitle}</div>
          <div className="wa-issue-agent">{subAgent.label}</div>
        </div>
      </div>
      <div className="wa-console wa-console-compact">
        {text.slice(0, shown)}
        {typing && <span className="wa-cursor">▌</span>}
      </div>
      {!typing && (
        <button className="wa-preview-btn" onClick={onPreview}>
          <Eye className="wa-ico-xs" aria-hidden="true" />
          Preview
        </button>
      )}
    </div>
  );
}

function IssueSidebar({
  openIssues,
  selectedIssueId,
  onSelect,
}: {
  openIssues: (SubAgentDef & { categoryTitle: string })[];
  selectedIssueId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="wa-workbench-sidebar">
      <div className="wa-workbench-sidebar-head">Open Issues · {openIssues.length}</div>
      <div className="wa-workbench-sidebar-list">
        {openIssues.map((i) => (
          <button
            key={i.id}
            type="button"
            className={`wa-sidebar-item ${selectedIssueId === i.id ? "wa-sidebar-item-active" : ""}`}
            onClick={() => onSelect(i.id)}
          >
            <span className="wa-sidebar-item-dot" style={{ background: i.severity === "red" ? "#dc2626" : "#d97706" }} />
            <span className="wa-sidebar-item-text">
              <span className="wa-sidebar-item-title">{i.issueTitle}</span>
              <span className="wa-sidebar-item-cat">
                {i.categoryTitle} · {i.label}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({
  subAgent,
  status,
  openIssues,
  selectedIssueId,
  onSelect,
  onConfirm,
  onClose,
}: {
  subAgent: (SubAgentDef & { categoryTitle: string }) | null;
  status: IssueStatus;
  openIssues: (SubAgentDef & { categoryTitle: string })[];
  selectedIssueId: string | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const showSidebar = openIssues.length > 0;
  const data = subAgent ? PREVIEW_DATA[subAgent.id] : null;
  const resolved = status === "resolved";
  const resolving = status === "resolving";
  const Icon = subAgent?.icon;

  return (
    <div className="wa-workbench">
      {showSidebar && <IssueSidebar openIssues={openIssues} selectedIssueId={selectedIssueId} onSelect={onSelect} />}

      <div className="wa-workbench-main">
        {!subAgent || !data || !Icon ? (
          <div className="wa-workbench-idle">
            <span className="wa-idle-ico">
              <Eye className="wa-ico-lg" aria-hidden="true" />
            </span>
            <div className="wa-idle-title">{showSidebar ? "Select an issue to preview" : "Nothing selected"}</div>
            <div className="wa-idle-sub">
              {showSidebar
                ? "Pick an issue from the list on the left — its detail, data, and action will open here."
                : `Click "Preview" on a flagged issue above — an order list, stock variance, slotting move, or productivity trend will open here before anything gets assigned.`}
            </div>
          </div>
        ) : (
          <>
            <div className="wa-workbench-head">
              <span className="wa-workbench-ico" style={{ color: subAgent.severity === "red" ? "#dc2626" : "#d97706" }}>
                <Icon className="wa-ico-sm" aria-hidden="true" />
              </span>
              <div className="wa-workbench-head-text">
                <div className="wa-workbench-title">{subAgent.issueTitle}</div>
                <div className="wa-workbench-sub">
                  {subAgent.label} · {data.categoryTitle}
                </div>
              </div>
              {resolved && (
                <span className="wa-chip wa-chip-resolved">
                  <CheckCircle2 className="wa-ico-xs" aria-hidden="true" />
                  Action Taken
                </span>
              )}
              <button className="wa-workbench-close" onClick={onClose} aria-label="Close preview">
                <X className="wa-ico-sm" aria-hidden="true" />
              </button>
            </div>

            <div className="wa-workbench-note">{data.note}</div>

            <div className="wa-workbench-body">
              {data.kind === "orders" && <OrdersPreview rows={data.rows} footer={data.footer} resolved={resolved} />}
              {data.kind === "stock" && <StockPreview rows={data.rows} resolved={resolved} />}
              {data.kind === "slotting" && <SlottingPreview rows={data.rows} resolved={resolved} />}
              {data.kind === "productivity" && (
                <ProductivityPreview points={data.points} baseline={data.baseline} pickers={data.pickers} resolved={resolved} />
              )}
            </div>

            <div className="wa-workbench-footer">
              <button className="wa-issue-action" disabled={resolved || resolving} onClick={onConfirm}>
                {resolved ? (
                  <>
                    <CheckCircle2 className="wa-ico-xs" aria-hidden="true" />
                    {subAgent.actionDoneLabel}
                  </>
                ) : resolving ? (
                  <>
                    <Loader2 className="wa-ico-xs wa-spin" aria-hidden="true" />
                    Working…
                  </>
                ) : (
                  subAgent.actionLabel
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrdersPreview({ rows, footer, resolved }: { rows: OrderRow[]; footer: string; resolved: boolean }) {
  return (
    <div className="wa-table-wrap">
      <table className="wa-table">
        <thead>
          <tr>
            <th>Order No</th>
            <th>Seller</th>
            <th>Promised By</th>
            <th>Status</th>
            <th>Courier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.order}>
              <td className="wa-mono">{r.order}</td>
              <td>{r.seller}</td>
              <td className="wa-mono">{r.promisedBy}</td>
              <td>
                {resolved ? (
                  <span className="wa-badge wa-badge-green">Picklist Assigned</span>
                ) : (
                  <span className={`wa-badge ${r.status === "Past dispatch" ? "wa-badge-red" : "wa-badge-amber"}`}>{r.status}</span>
                )}
              </td>
              <td>{r.courier}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="wa-table-footer">{footer}</div>
    </div>
  );
}

function StockPreview({ rows, resolved }: { rows: StockRow[]; resolved: boolean }) {
  return (
    <div className="wa-table-wrap">
      <table className="wa-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Bin</th>
            <th>Expected</th>
            <th>Found</th>
            <th>Variance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sku}>
              <td>{r.sku}</td>
              <td className="wa-mono">{r.bin}</td>
              <td className="wa-mono">{r.expected}</td>
              <td className="wa-mono">{r.found}</td>
              <td className="wa-mono">-{r.expected - r.found}</td>
              <td>
                {resolved ? (
                  <span className="wa-badge wa-badge-green">Cycle Count Queued</span>
                ) : (
                  <span className="wa-badge wa-badge-amber">{r.lastCounted}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlottingPreview({ rows, resolved }: { rows: SlottingRow[]; resolved: boolean }) {
  return (
    <div className="wa-table-wrap">
      <table className="wa-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Current Bin</th>
            <th>Zone</th>
            <th>Proposed Bin</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sku}>
              <td>{r.sku}</td>
              <td className="wa-mono">{r.current}</td>
              <td>{r.zone}</td>
              <td className="wa-mono">{r.proposed}</td>
              <td>
                {resolved ? (
                  <span className="wa-badge wa-badge-green">Movement Task Created</span>
                ) : (
                  <span className="wa-badge wa-badge-amber">Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductivityPreview({
  points,
  baseline,
  pickers,
  resolved,
}: {
  points: ProductivityPoint[];
  baseline: number;
  pickers: PickerRow[];
  resolved: boolean;
}) {
  const max = Math.max(baseline, ...points.map((p) => p.rate)) * 1.15;
  return (
    <div className="wa-chart-wrap">
      <div className="wa-chart">
        <div className="wa-chart-baseline" style={{ bottom: `${(baseline / max) * 100}%` }} />
        {points.map((p) => (
          <div className="wa-chart-col" key={p.hour}>
            <div className="wa-chart-val">{p.rate}</div>
            <div
              className="wa-chart-bar"
              style={{
                height: `${(p.rate / max) * 100}%`,
                background: p.rate < baseline * 0.9 ? "#dc2626" : p.rate < baseline ? "#d97706" : "#2563eb",
              }}
            />
            <div className="wa-chart-label">{p.hour}</div>
          </div>
        ))}
      </div>
      <div className="wa-chart-legend">Baseline {baseline}/hr</div>

      <div className="wa-table-wrap">
        <table className="wa-table">
          <thead>
            <tr>
              <th>Picker</th>
              <th>Zone</th>
              <th>Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pickers.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.zone}</td>
                <td className="wa-mono">{p.rate}/hr</td>
                <td>
                  {resolved ? (
                    <span className="wa-badge wa-badge-green">Noted</span>
                  ) : (
                    <span className="wa-badge wa-badge-red">{Math.round(((baseline - p.rate) / baseline) * 100)}% below target</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryLight({ status }: { status: CategoryStatus }) {
  if (status === "scanning") {
    return (
      <span className="wa-light wa-light-scanning">
        <Loader2 className="wa-ico-xs wa-spin" aria-hidden="true" />
        Scanning
      </span>
    );
  }
  const map: Record<"green" | "yellow" | "red", { label: string; color: string }> = {
    green: { label: "All Clear", color: "#16a34a" },
    yellow: { label: "Needs Attention", color: "#d97706" },
    red: { label: "Critical", color: "#dc2626" },
  };
  const m = map[status];
  return (
    <span className="wa-light" style={{ color: m.color, borderColor: m.color }}>
      <span className="wa-light-dot" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

const SHARE_FILTERS = [{ id: "all", title: "All" }, ...CATEGORIES.map((c) => ({ id: c.id, title: c.title }))];

function ShareModal({
  filter,
  onFilterChange,
  onClose,
  issueStatus,
}: {
  filter: string;
  onFilterChange: (f: string) => void;
  onClose: () => void;
  issueStatus: Record<string, IssueStatus>;
}) {
  const categoriesToShow = filter === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.id === filter);
  const generatedAt = new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });

  return (
    <div className="wa-modal-overlay" onClick={onClose}>
      <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wa-modal-head">
          <div>
            <div className="wa-modal-title">Warehouse Agent Summary</div>
            <div className="wa-modal-sub">Site BLR-01 · Outbound · Generated {generatedAt}</div>
          </div>
          <button className="wa-workbench-close" onClick={onClose} aria-label="Close">
            <X className="wa-ico-sm" aria-hidden="true" />
          </button>
        </div>

        <div className="wa-modal-filters">
          {SHARE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`wa-filter-pill ${filter === f.id ? "wa-filter-pill-active" : ""}`}
              onClick={() => onFilterChange(f.id)}
            >
              {f.title}
            </button>
          ))}
        </div>

        <div className="wa-modal-body">
          {categoriesToShow.map((cat) => {
            const status = categoryStatus(cat, TOTAL_RUNTIME, issueStatus);
            const openIssues = cat.subAgents.filter((sa) => sa.hasIssue && (issueStatus[sa.id] ?? "open") !== "resolved");
            const actionedIssues = cat.subAgents.filter((sa) => sa.hasIssue && (issueStatus[sa.id] ?? "open") === "resolved");
            return (
              <div className="wa-modal-section" key={cat.id}>
                <div className="wa-modal-section-head">
                  <cat.icon className="wa-ico-sm" aria-hidden="true" />
                  <span className="wa-modal-section-title">{cat.title}</span>
                  <CategoryLight status={status} />
                </div>

                {openIssues.length === 0 && actionedIssues.length === 0 && (
                  <div className="wa-modal-clear">
                    <CheckCircle2 className="wa-ico-xs" aria-hidden="true" />
                    All clear — no issues found.
                  </div>
                )}

                {openIssues.map((sa) => (
                  <div className="wa-modal-item" key={sa.id}>
                    <span
                      className="wa-issue-sev-dot"
                      style={{ background: sa.severity === "red" ? "#dc2626" : "#d97706" }}
                    />
                    <div className="wa-modal-item-text">
                      <div className="wa-modal-item-title">{sa.issueTitle}</div>
                      <div className="wa-modal-item-finding">{sa.shortFinding}</div>
                      <div className="wa-modal-item-action">Recommended: {sa.actionLabel}</div>
                    </div>
                    <span className="wa-badge wa-badge-amber">Open</span>
                  </div>
                ))}

                {actionedIssues.map((sa) => (
                  <div className="wa-modal-item wa-modal-item-done" key={sa.id}>
                    <CheckCircle2 className="wa-ico-xs" style={{ color: "#16a34a", flex: "none", marginTop: 3 }} aria-hidden="true" />
                    <div className="wa-modal-item-text">
                      <div className="wa-modal-item-title">{sa.issueTitle}</div>
                      <div className="wa-modal-item-finding">{sa.shortFinding}</div>
                    </div>
                    <span className="wa-badge wa-badge-green">Action Taken</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="wa-modal-footer">
          Take a screenshot of this panel to share with a supervisor — switch the filter above to send just one
          category (e.g. Outbound for the outbound supervisor).
        </div>
      </div>
    </div>
  );
}

const css = `
.wa-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d8d4c8;--c-t1:#1f1d17;--c-t2:#6b6862;--c-t3:#8a8a85;--c-accent:#2563eb;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;width:100%;max-width:100%;box-sizing:border-box}
.wa-screen .wa-ico-sm{width:14px;height:14px;flex:none}
.wa-screen .wa-ico-xs{width:12px;height:12px;flex:none}
.wa-screen .wa-ico-lg{width:28px;height:28px;flex:none}
.wa-spin{animation:wa-spin 0.9s linear infinite}
@keyframes wa-spin{to{transform:rotate(360deg)}}

.wa-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:0.5px solid var(--c-border)}
.wa-live{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--c-t2);text-transform:uppercase;letter-spacing:0.06em}
.wa-live-dot{width:7px;height:7px;border-radius:999px;background:#16a34a;flex:none;transition:background 0.3s ease}
.wa-live-status{font-weight:700;transition:color 0.3s ease}
.wa-topbar-title{font-size:24px;font-weight:700;color:var(--c-t1);margin-top:4px;letter-spacing:-0.01em}
.wa-topbar-sub{font-size:11.5px;color:var(--c-t3);margin-top:3px}
.wa-topbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.wa-asof{font-size:11.5px;font-weight:600;color:var(--c-t2);background:var(--c-bg2);border:0.5px solid var(--c-border);border-radius:8px;padding:9px 13px;white-space:nowrap;font-variant-numeric:tabular-nums}
.wa-issue-badge{background:var(--c-bg);border-width:0.5px}
.wa-issue-badge-btn{font-family:inherit;cursor:pointer}
.wa-issue-badge-btn:disabled{cursor:default;opacity:0.6}
.wa-screen .wa-btn-outline{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:9px 14px;border-radius:8px;border:0.5px solid var(--c-border2);background:var(--c-bg);color:var(--c-t1);cursor:pointer;line-height:1}
.wa-screen .wa-btn-outline:disabled{opacity:0.45;cursor:not-allowed}
.wa-screen .wa-btn-generate{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;padding:9px 16px;border-radius:8px;border:none;background:#14130f;color:#fff;cursor:pointer;line-height:1}
.wa-screen .wa-btn-generate:disabled{opacity:0.7;cursor:not-allowed}

.wa-body{padding:18px;display:flex;flex-direction:column;gap:14px}

.wa-idle{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:56px 20px;text-align:center}
.wa-idle-ico{width:52px;height:52px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;background:var(--c-bg2);color:var(--c-t2)}
.wa-idle-title{font-size:15px;font-weight:700;color:var(--c-t1)}
.wa-idle-sub{font-size:12.5px;color:var(--c-t3);max-width:420px;line-height:1.5}

.wa-summary-bar{border:0.5px solid var(--c-border);border-radius:10px;background:var(--c-bg2);overflow:hidden}
.wa-summary-toggle{display:flex;align-items:center;gap:9px;width:100%;padding:11px 14px;background:none;border:none;cursor:pointer;text-align:left;color:var(--c-t1)}
.wa-summary-line{flex:1;font-size:12.5px;font-weight:600;display:flex;align-items:center}
.wa-chevron{transition:transform 0.2s ease;color:var(--c-t3)}
.wa-chevron-open{transform:rotate(180deg)}
.wa-summary-body{padding:0 14px 14px 41px}

.wa-category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start}
.wa-category{border:0.5px solid var(--c-border);border-radius:10px;padding:14px;background:var(--c-bg);display:flex;flex-direction:column;gap:12px}

.wa-category-head{display:flex;align-items:flex-start;gap:10px}
.wa-category-ico{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:var(--c-bg2);color:var(--c-t2);flex:none}
.wa-category-head-text{flex:1;min-width:0}
.wa-category-title{font-size:14px;font-weight:700;color:var(--c-t1)}
.wa-category-caption{font-size:10.5px;color:var(--c-t3);margin-top:2px;line-height:1.35}

.wa-light{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;padding:4px 9px;border-radius:999px;border:0.5px solid currentColor;white-space:nowrap;flex:none}
.wa-light-dot{width:6px;height:6px;border-radius:999px;flex:none}
.wa-light-scanning{color:var(--c-t3);border-color:var(--c-border2)}

.wa-pill-row{display:flex;flex-wrap:wrap;gap:6px}
.wa-pill{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;padding:5px 9px;border-radius:999px;border:0.5px solid var(--c-border2);background:var(--c-bg2);color:var(--c-t2);white-space:nowrap}
.wa-pill-queued{color:var(--c-t3);opacity:0.7}
.wa-pill-scanning{color:var(--c-accent);border-color:var(--c-accent)}
.wa-pill-clear{color:#16a34a;border-color:#16a34a;background:#f0faf2}
.wa-pill-resolved{color:#16a34a;border-color:#16a34a;background:#f0faf2}
.wa-pill-yellow{color:#d97706;border-color:#d97706;background:#fbf0dc}
.wa-pill-red{color:#dc2626;border-color:#dc2626;background:#fdecec}

.wa-clear-banner{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#16a34a;background:#f0faf2;border:0.5px solid #bfe6c6;border-radius:9px;padding:12px 13px}

.wa-issue-list{display:flex;flex-direction:column;gap:9px}
.wa-issue-card{border-radius:9px;padding:10px 12px;border:0.5px solid var(--c-border2);background:var(--c-bg)}
.wa-issue-red{border-color:#f0b8b8;background:#fdf4f4}
.wa-issue-yellow{border-color:#e8c389;background:#fbf7ee}
.wa-issue-resolved{opacity:0.75;border-color:var(--c-border);background:var(--c-bg2)}
.wa-issue-selected{outline:2px solid var(--c-accent);outline-offset:1px}
.wa-issue-collapsed{display:flex;align-items:center;gap:8px;padding:7px 10px;opacity:0.7;border-color:var(--c-border);background:var(--c-bg2)}
.wa-issue-collapsed-check{color:#16a34a;flex:none}
.wa-issue-collapsed-title{flex:1;min-width:0;font-size:11px;font-weight:600;color:var(--c-t2);text-decoration:line-through;text-decoration-color:var(--c-border2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.wa-issue-head{display:flex;align-items:flex-start;gap:9px}
.wa-issue-sev-dot{width:8px;height:8px;border-radius:999px;margin-top:5px;flex:none}
.wa-issue-head-text{flex:1;min-width:0}
.wa-issue-title{font-size:12px;font-weight:700;color:var(--c-t1);line-height:1.3}
.wa-issue-agent{font-size:10px;color:var(--c-t3);margin-top:2px}

.wa-chip{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;padding:4px 9px;border-radius:999px;border:0.5px solid var(--c-border2);color:var(--c-t2);white-space:nowrap;flex:none}
.wa-chip-resolved{color:#16a34a;border-color:#16a34a}

.wa-console{margin-top:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;line-height:1.55;color:var(--c-t2);white-space:pre-wrap;word-break:break-word}
.wa-console-compact{font-size:10.5px}
.wa-console-summary{font-size:11.5px;color:var(--c-t1)}
.wa-cursor{color:var(--c-accent);animation:wa-blink 1s step-start infinite}
@keyframes wa-blink{50%{opacity:0}}

.wa-preview-btn{margin-top:9px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:6px 11px;border-radius:7px;border:0.5px solid var(--c-border2);background:var(--c-bg);color:var(--c-t1);cursor:pointer;line-height:1;flex:none}
.wa-preview-btn-ghost{margin-top:0;padding:4px 9px;font-size:10.5px;background:none}

.wa-issue-action{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:9px 15px;border-radius:8px;border:none;background:#14130f;color:#fff;cursor:pointer;line-height:1}
.wa-issue-action:disabled{opacity:0.6;cursor:not-allowed}

.wa-workbench{border:0.5px solid var(--c-border2);border-radius:12px;background:var(--c-bg2);min-height:340px;display:flex;align-items:stretch;overflow:hidden}
.wa-workbench-sidebar{width:240px;flex:none;display:flex;flex-direction:column;background:var(--c-bg);border-right:0.5px solid var(--c-border2);max-height:560px;overflow-y:auto}
.wa-workbench-sidebar-head{padding:12px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--c-t3);border-bottom:0.5px solid var(--c-border);flex:none}
.wa-workbench-sidebar-list{display:flex;flex-direction:column}
.wa-sidebar-item{display:flex;align-items:flex-start;gap:8px;width:100%;padding:10px 14px;border:none;border-bottom:0.5px solid var(--c-border);border-left:3px solid transparent;background:none;cursor:pointer;text-align:left;font:inherit}
.wa-sidebar-item:hover{background:var(--c-bg2)}
.wa-sidebar-item-active{background:var(--c-bg2);border-left-color:var(--c-accent)}
.wa-sidebar-item-dot{width:7px;height:7px;border-radius:999px;margin-top:4px;flex:none}
.wa-sidebar-item-text{flex:1;min-width:0}
.wa-sidebar-item-title{display:block;font-size:11.5px;font-weight:600;color:var(--c-t1);line-height:1.3}
.wa-sidebar-item-cat{display:block;font-size:10px;color:var(--c-t3);margin-top:2px}
.wa-workbench-main{flex:1;min-width:0;padding:18px;display:flex;flex-direction:column;gap:14px}
.wa-workbench-idle{flex:1;align-items:center;justify-content:center;text-align:center;display:flex;flex-direction:column;gap:10px}
.wa-workbench-head{display:flex;align-items:flex-start;gap:10px}
.wa-workbench-ico{width:30px;height:30px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:var(--c-bg);flex:none}
.wa-workbench-head-text{flex:1;min-width:0}
.wa-workbench-title{font-size:15px;font-weight:700;color:var(--c-t1)}
.wa-workbench-sub{font-size:11.5px;color:var(--c-t3);margin-top:2px}
.wa-workbench-close{width:28px;height:28px;border-radius:8px;border:0.5px solid var(--c-border2);background:var(--c-bg);color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none}
.wa-workbench-note{font-size:12px;color:var(--c-t2);line-height:1.55;background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:9px;padding:11px 13px}
.wa-workbench-body{flex:1}
.wa-workbench-footer{display:flex;justify-content:flex-end}

.wa-table-wrap{border:0.5px solid var(--c-border);border-radius:9px;overflow:hidden;background:var(--c-bg)}
.wa-table{width:100%;border-collapse:collapse;font-size:12px}
.wa-table thead tr{background:var(--c-bg2)}
.wa-table th{text-align:left;font-size:10.5px;font-weight:700;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.04em;padding:9px 12px;border-bottom:0.5px solid var(--c-border)}
.wa-table td{padding:9px 12px;border-bottom:0.5px solid var(--c-border);color:var(--c-t1)}
.wa-table tbody tr:last-child td{border-bottom:none}
.wa-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px}
.wa-table-footer{padding:9px 12px;font-size:11px;color:var(--c-t3);background:var(--c-bg2)}

.wa-badge{display:inline-flex;align-items:center;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap}
.wa-badge-red{color:#dc2626;background:#fdecec}
.wa-badge-amber{color:#d97706;background:#fbf0dc}
.wa-badge-green{color:#16a34a;background:#eafbee}

.wa-chart-wrap{display:flex;flex-direction:column;gap:10px;height:100%}
.wa-chart{position:relative;display:flex;align-items:flex-end;gap:14px;height:180px;padding:10px 10px 0;background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:9px}
.wa-chart-baseline{position:absolute;left:10px;right:10px;height:0;border-top:1.5px dashed var(--c-t3)}
.wa-chart-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px}
.wa-chart-val{font-size:10.5px;font-weight:700;color:var(--c-t1);font-variant-numeric:tabular-nums}
.wa-chart-bar{width:60%;border-radius:4px 4px 0 0;min-height:4px}
.wa-chart-label{font-size:10px;color:var(--c-t3);padding-bottom:8px}
.wa-chart-legend{font-size:11px;color:var(--c-t3);display:flex;align-items:center}

.wa-modal-overlay{position:fixed;inset:0;background:rgba(20,19,15,0.45);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px}
.wa-modal{background:#ffffff;border-radius:14px;max-width:580px;width:100%;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.25);font-family:inherit}
.wa-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:18px 20px;border-bottom:0.5px solid #e2dfd5;flex:none}
.wa-modal-title{font-size:16px;font-weight:700;color:#1f1d17}
.wa-modal-sub{font-size:11px;color:#8a8a85;margin-top:3px}
.wa-modal-filters{display:flex;gap:6px;padding:12px 20px;border-bottom:0.5px solid #e2dfd5;flex-wrap:wrap;flex:none}
.wa-filter-pill{font-size:11px;font-weight:600;padding:6px 13px;border-radius:999px;border:0.5px solid #d8d4c8;background:#f5f3ee;color:#6b6862;cursor:pointer;font-family:inherit;line-height:1}
.wa-filter-pill-active{background:#14130f;color:#fff;border-color:#14130f}
.wa-modal-body{padding:16px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:18px;flex:1}
.wa-modal-section{display:flex;flex-direction:column;gap:8px}
.wa-modal-section-head{display:flex;align-items:center;gap:8px;color:#6b6862}
.wa-modal-section-title{font-size:13px;font-weight:700;color:#1f1d17;flex:1}
.wa-modal-clear{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;color:#16a34a;background:#f0faf2;border:0.5px solid #bfe6c6;border-radius:8px;padding:9px 12px}
.wa-modal-item{display:flex;align-items:flex-start;gap:9px;border:0.5px solid #e2dfd5;border-radius:9px;padding:10px 12px;background:#f5f3ee}
.wa-modal-item-done{opacity:0.75}
.wa-modal-item .wa-issue-sev-dot{margin-top:4px}
.wa-modal-item-text{flex:1;min-width:0}
.wa-modal-item-title{font-size:12px;font-weight:700;color:#1f1d17;line-height:1.3}
.wa-modal-item-finding{font-size:11px;color:#6b6862;margin-top:3px;line-height:1.45}
.wa-modal-item-action{font-size:10.5px;color:#2563eb;margin-top:4px;font-weight:600}
.wa-modal-footer{padding:12px 20px;border-top:0.5px solid #e2dfd5;background:#f5f3ee;font-size:10.5px;color:#8a8a85;line-height:1.5;flex:none}
`;
