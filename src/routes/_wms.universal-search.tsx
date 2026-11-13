import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Box,
  ClipboardList,
  Container,
  Fingerprint,
  MapPin,
  Package,
  ScanLine,
  Search,
  Tag,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CURRENT_WAREHOUSE,
  EXAMPLE_QUERIES,
  MAX_QUERY_LENGTH,
  PAGE_SIZE,
  SCAN_PAYLOADS,
  TYPE_LABEL,
  TYPE_ORDER,
  normaliseQuery,
  runSearch,
  type RecordType,
  type SearchGroup,
  type SearchOutcome,
  type SearchResult,
} from "@/lib/wms/universal-search-data";

export const Route = createFileRoute("/_wms/universal-search")({
  head: () => ({
    meta: [{ title: "Universal Search — WMS" }],
  }),
  component: UniversalSearchPage,
});

const TYPE_ICON: Record<RecordType, LucideIcon> = {
  box: Box,
  bin: Container,
  location: MapPin,
  sku: Package,
  batch: Tag,
  usn: Fingerprint,
  inbound: ArrowDownToLine,
  order: Truck,
  task: ClipboardList,
};

const TONE_VARIANT = {
  ok: "ok",
  warn: "warn",
  risk: "destructive",
  sys: "sys",
  neutral: "secondary",
} as const;

type Status =
  | "initial"
  | "loading"
  | "complete"
  | "no-results"
  | "partial-failure"
  | "full-failure";

// Simulated adapter latency — long enough to see the loading state and to
// demonstrate that a later request's response wins over an earlier one.
const SIMULATED_LATENCY_MS = 500;

function UniversalSearchPage() {
  const [input, setInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecordType | null>(null);

  const [status, setStatus] = useState<Status>("initial");
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const scanCycleRef = useRef(0);

  const execute = (rawValue: string) => {
    const requestId = ++requestIdRef.current;
    const value = normaliseQuery(rawValue);

    if (value.length === 0) {
      setError("Enter or scan a value to search.");
      return;
    }
    if (rawValue.replace(/[\r\n]+$/g, "").length > MAX_QUERY_LENGTH) {
      setError(`Value is too long (max ${MAX_QUERY_LENGTH} characters).`);
      return;
    }

    setError("");
    setStatus("loading");
    setSubmittedQuery(value);

    window.setTimeout(() => {
      // A newer request has since been issued — this response is stale.
      if (requestId !== requestIdRef.current) return;

      const result = runSearch({
        query: value,
        warehouse: CURRENT_WAREHOUSE.code,
        type: typeFilter,
        health: "healthy",
      });
      setOutcome(result);
      setVisibleCounts(Object.fromEntries(result.groups.map((g) => [g.type, PAGE_SIZE])));

      if (result.allFailed) setStatus("full-failure");
      else if (result.failedTypes.length > 0 && result.groups.length === 0)
        setStatus("partial-failure");
      else if (result.groups.length === 0) setStatus("no-results");
      else if (result.failedTypes.length > 0) setStatus("partial-failure");
      else setStatus("complete");
    }, SIMULATED_LATENCY_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return; // prevent duplicate submission in flight
    execute(input);
  };

  const handleClear = () => {
    requestIdRef.current += 1;
    setInput("");
    setTypeFilter(null);
    setStatus("initial");
    setOutcome(null);
    setSubmittedQuery("");
    setVisibleCounts({});
    setError("");
    inputRef.current?.focus();
  };

  const handleTypeFilterChange = (next: string) => {
    const nextType = next === "all" ? null : (next as RecordType);
    setTypeFilter(nextType);
    // Filtering is a new scoped request — only re-run if a search already ran.
    if (submittedQuery) {
      const requestId = ++requestIdRef.current;
      setStatus("loading");
      window.setTimeout(() => {
        if (requestId !== requestIdRef.current) return;
        const result = runSearch({
          query: submittedQuery,
          warehouse: CURRENT_WAREHOUSE.code,
          type: nextType,
          health: "healthy",
        });
        setOutcome(result);
        setVisibleCounts(Object.fromEntries(result.groups.map((g) => [g.type, PAGE_SIZE])));
        if (result.allFailed) setStatus("full-failure");
        else if (result.failedTypes.length > 0 && result.groups.length === 0)
          setStatus("partial-failure");
        else if (result.groups.length === 0) setStatus("no-results");
        else if (result.failedTypes.length > 0) setStatus("partial-failure");
        else setStatus("complete");
      }, SIMULATED_LATENCY_MS);
    }
  };

  const handleRetry = () => {
    if (submittedQuery) execute(submittedQuery);
  };

  const simulateScan = () => {
    const payload = SCAN_PAYLOADS[scanCycleRef.current % SCAN_PAYLOADS.length];
    scanCycleRef.current += 1;
    setInput(payload.replace(/[\r\n]+$/g, ""));
    // A keyboard-wedge scanner's trailing Enter submits once — not per character.
    execute(payload);
  };

  const loadMore = (type: RecordType) => {
    setVisibleCounts((prev) => ({ ...prev, [type]: (prev[type] ?? PAGE_SIZE) + PAGE_SIZE }));
  };

  return (
    <div>
      <PageHeader
        title="Universal Search"
        subtitle="Lookup across boxes, bins, locations, inventory, inbound, orders and tasks"
        actions={
          <Badge variant="sys" className="h-7 px-2.5 text-[10.5px]">
            <Warehouse className="h-3 w-3" />
            {CURRENT_WAREHOUSE.code} · {CURRENT_WAREHOUSE.name}
          </Badge>
        }
      />

      <div className="space-y-5 p-6">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-end gap-3">
              <form onSubmit={handleSubmit} className="flex flex-1 items-end gap-2">
                <label className="flex min-w-[260px] flex-1 flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                    Search WMS
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Scan or enter box, bin, location, SKU, order or reference"
                      className="h-9 pl-8"
                      aria-label="Search WMS"
                    />
                  </div>
                </label>
                <Button type="submit" disabled={status === "loading"} className="h-9">
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  Search
                </Button>
                <Button type="button" variant="outline" onClick={handleClear} className="h-9">
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={simulateScan}
                  className="h-9"
                  title="Stands in for a hardware barcode scanner — sends a value followed by one Enter."
                >
                  <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                  Simulate scan
                </Button>
              </form>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                  Type
                </span>
                <Select value={typeFilter ?? "all"} onValueChange={handleTypeFilterChange}>
                  <SelectTrigger className="h-9 w-[190px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {TYPE_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            {error && (
              <p
                className="font-mono text-[11px] uppercase tracking-[0.04em] text-risk"
                role="alert"
              >
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {status === "initial" && <ExamplesPanel onPick={(v) => setInput(v)} />}

        {status === "loading" && <LoadingPanel query={submittedQuery} />}

        {status === "no-results" && (
          <EmptyPanel text="No results found in this warehouse. Check the value and try again." />
        )}

        {status === "full-failure" && <FullFailurePanel onRetry={handleRetry} />}

        {(status === "complete" || status === "partial-failure") && outcome && (
          <div className="space-y-5">
            {status === "partial-failure" && (
              <PartialFailureBanner failedTypes={outcome.failedTypes} onRetry={handleRetry} />
            )}
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {outcome.matchCount} authorised result{outcome.matchCount === 1 ? "" : "s"} across{" "}
              {outcome.groups.length} type{outcome.groups.length === 1 ? "" : "s"}
            </div>
            {outcome.groups.map((group) => (
              <ResultGroupSection
                key={group.type}
                group={group}
                visibleCount={visibleCounts[group.type] ?? PAGE_SIZE}
                onLoadMore={() => loadMore(group.type)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Initial / loading / empty / failure panels ─────────────────────────────

function ExamplesPanel({ onPick }: { onPick: (value: string) => void }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
          Try an example
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex.value}
              type="button"
              onClick={() => onPick(ex.value)}
              title={ex.hint}
              className="rounded-[4px] border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-foreground transition-colors hover:bg-muted"
            >
              {ex.value}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-muted-foreground">
          Picking an example fills the search field — press Search or Enter to run it. No records
          are shown until you submit a search.
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingPanel({ query }: { query: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <span className="text-[13px] text-muted-foreground">
          Searching for <span className="font-mono text-foreground">{query}</span>…
        </span>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
        <Search className="h-6 w-6 text-muted-foreground" />
        <p className="max-w-md text-[13px] text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function FullFailurePanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-risk/30">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <AlertTriangle className="h-6 w-6 text-risk" />
        <p className="max-w-md text-[13px] text-foreground">
          Search is temporarily unavailable. Try again.
        </p>
        <Button type="button" variant="outline" onClick={onRetry} className="h-8">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function PartialFailureBanner({
  failedTypes,
  onRetry,
}: {
  failedTypes: RecordType[];
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-warn/30 bg-warn-bg px-4 py-2.5">
      <div className="text-[12.5px] text-foreground">
        Some result types are temporarily unavailable. Retry search.{" "}
        <span className="text-muted-foreground">
          Unavailable: {failedTypes.map((t) => TYPE_LABEL[t]).join(", ")}
        </span>
      </div>
      <Button type="button" variant="outline" onClick={onRetry} className="h-7 px-2.5 text-[12px]">
        Retry
      </Button>
    </div>
  );
}

// ─── Result groups ───────────────────────────────────────────────────────

function ResultGroupSection({
  group,
  visibleCount,
  onLoadMore,
}: {
  group: SearchGroup;
  visibleCount: number;
  onLoadMore: () => void;
}) {
  const Icon = TYPE_ICON[group.type];
  const shown = group.results.slice(0, visibleCount);
  const hasMore = group.results.length > shown.length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[13.5px] font-medium text-foreground">{TYPE_LABEL[group.type]}</h2>
        <span className="font-mono text-[10.5px] text-muted-foreground">
          {shown.length} of {group.results.length} shown
        </span>
      </div>
      <div className="grid gap-2.5">
        {shown.map((r) => (
          <ResultCard key={r.record.id} result={r} />
        ))}
      </div>
      {hasMore && (
        <Button type="button" variant="outline" onClick={onLoadMore} className="h-8 text-[12px]">
          Load more
        </Button>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const { record, matched, summary, related } = result;
  const variant = record.statusTone ? TONE_VARIANT[record.statusTone] : "secondary";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[14px] font-semibold text-foreground">
                {record.primary}
              </span>
              {record.status && <Badge variant={variant}>{record.status}</Badge>}
            </div>
            {record.context && (
              <div className="text-[12px] text-muted-foreground">{record.context}</div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted-foreground">
              <span>WH {record.warehouse}</span>
              {record.seller && <span>Seller {record.seller}</span>}
              {record.lastUpdated && <span>Updated {record.lastUpdated}</span>}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {record.destination ? (
              <Button asChild size="sm" variant="outline" className="h-8 text-[12px]">
                <Link to={record.destination.to}>{record.destination.label}</Link>
              </Button>
            ) : (
              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted-foreground">
                Detail view unavailable
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {matched.map((m) => (
            <span
              key={m.label}
              className="rounded-[3px] border border-ai-ring bg-ai-bg px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.04em] text-ai"
            >
              Matched {m.label}: {m.value}
            </span>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-border pt-3 sm:grid-cols-3">
          {summary.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
                {row.label}
              </dt>
              <dd
                className={cn(
                  "truncate text-[12.5px]",
                  row.value == null
                    ? "text-muted-foreground italic"
                    : row.historical
                      ? "text-warn"
                      : "text-foreground",
                )}
                title={row.value ?? "Not recorded"}
              >
                {row.value ?? "Not recorded"}
              </dd>
            </div>
          ))}
        </dl>

        {related && (
          <div className="border-t border-border pt-3">
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {related.label}
            </div>
            <ul className="space-y-0.5 text-[12px] text-foreground">
              {related.entries.map((e, i) => (
                <li key={i} className="truncate">
                  {e}
                </li>
              ))}
            </ul>
            {related.viewAll && (
              <Link
                to={related.viewAll.to}
                className="mt-1 inline-block text-[11.5px] font-medium text-ai hover:underline"
              >
                {related.viewAll.label} →
              </Link>
            )}
          </div>
        )}

        {record.note && (
          <p className="border-t border-border pt-2 text-[11.5px] italic text-muted-foreground">
            {record.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
