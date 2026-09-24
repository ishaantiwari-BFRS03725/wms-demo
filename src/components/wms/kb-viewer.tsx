import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  BookOpen,
  Boxes,
  ChevronRight,
  FileBarChart,
  Library,
  Search,
  Settings2,
  Undo2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { knowledgeBaseSections, type KbBlock, type KbSection } from "@/lib/wms/knowledge-base-data";

// ---------------------------------------------------------------------------
// Page model — the manual's h1s are chapters (nav groups); its h2s (or, when
// an h1 has no h2 children, the h1 itself) are the browsable pages. Deeper
// headings (h3/h4) stay inline within a page so a whole topic like "Gate
// Entry" reads as one continuous doc instead of forcing a click per step.
// ---------------------------------------------------------------------------

interface KbPage {
  id: string;
  title: string;
  groupTitle: string;
  node: KbSection;
}

interface KbGroup {
  groupId: string;
  groupTitle: string;
  pages: KbPage[];
}

function buildGroups(sections: KbSection[]): KbGroup[] {
  return sections.map((h1) => {
    const pages: KbPage[] = [];
    if (h1.children.length === 0) {
      pages.push({ id: h1.id, title: h1.title, groupTitle: h1.title, node: h1 });
    } else {
      if (h1.blocks.length > 0) {
        pages.push({
          id: `${h1.id}--overview`,
          title: h1.title,
          groupTitle: h1.title,
          node: { ...h1, children: [] },
        });
      }
      for (const h2 of h1.children) {
        pages.push({ id: h2.id, title: h2.title, groupTitle: h1.title, node: h2 });
      }
    }
    return { groupId: h1.id, groupTitle: h1.title, pages };
  });
}

function blockText(block: KbBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.text;
    case "ordered":
    case "unordered":
    case "checklist":
      return block.items.join(" ");
    case "table":
      return [block.header.join(" "), ...block.rows.map((r) => r.join(" "))].join(" ");
    case "callout":
      return block.items
        .filter((i): i is { type: "text"; text: string } => i.type === "text")
        .map((i) => i.text)
        .join(" ");
  }
}

function nodeText(node: KbSection): string {
  return [node.title, ...node.blocks.map(blockText), ...node.children.map(nodeText)].join(" ");
}

// Maps every heading id reachable from a page (the page itself plus every
// nested subsection) back to that page's id, so a deep link to a subsection
// (e.g. "short-receipt") can resolve which page to open.
function buildAnchorToPage(pages: KbPage[]): Record<string, string> {
  const map: Record<string, string> = {};
  const walk = (node: KbSection, pageId: string) => {
    map[node.id] = pageId;
    node.children.forEach((child) => walk(child, pageId));
  };
  for (const page of pages) {
    map[page.id] = page.id;
    walk(page.node, page.id);
  }
  return map;
}

const GROUP_ICONS: Record<string, LucideIcon> = {
  "Getting Started": Settings2,
  "Inbound Operations": ArrowDownToLine,
  "Outbound Operations": ArrowUpFromLine,
  "Inventory Management": Boxes,
  Returns: Undo2,
  Reports: FileBarChart,
  Troubleshooting: AlertTriangle,
  Glossary: Library,
};

// ---------------------------------------------------------------------------
// Inline markdown-lite — the manual's data only ever uses **bold** and
// `code` spans, so a full markdown parser would be overkill.
// ---------------------------------------------------------------------------

function parseInline(text: string): Array<{ type: "text" | "bold" | "code"; value: string }> {
  const tokens: Array<{ type: "text" | "bold" | "code"; value: string }> = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex)
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    const m = match[0];
    if (m.startsWith("**")) tokens.push({ type: "bold", value: m.slice(2, -2) });
    else tokens.push({ type: "code", value: m.slice(1, -1) });
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) tokens.push({ type: "text", value: text.slice(lastIndex) });
  return tokens;
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((t, i) =>
        t.type === "bold" ? (
          <strong key={i} className="font-semibold text-foreground">
            {t.value}
          </strong>
        ) : t.type === "code" ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {t.value}
          </code>
        ) : (
          <span key={i}>{t.value}</span>
        ),
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Block renderers
// ---------------------------------------------------------------------------

function BlockRenderer({ block }: { block: KbBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="mb-3 text-[13.5px] leading-relaxed text-foreground/90">
          <Inline text={block.text} />
        </p>
      );
    case "ordered":
      return (
        <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-foreground/90">
          {block.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </ol>
      );
    case "unordered":
      return (
        <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-foreground/90">
          {block.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </ul>
      );
    case "checklist":
      return (
        <ul className="mb-3 space-y-1.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-[13.5px] text-foreground/90">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border border-border" />
              <span>
                <Inline text={it} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mb-4 overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {block.header.map((h, i) => (
                  <TableHead key={i} className="text-[11px] font-semibold">
                    <Inline text={h} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row, ri) => (
                <TableRow key={ri}>
                  {row.map((cell, ci) => (
                    <TableCell key={ci} className="text-[12.5px] text-foreground/90">
                      <Inline text={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    case "callout": {
      const toneClass: Record<typeof block.tone, string> = {
        info: "border-sys/30 bg-sys-bg",
        warning: "border-warn/30 bg-warn-bg",
        danger: "border-risk/30 bg-risk-bg",
        success: "border-ok/30 bg-ok-bg",
        neutral: "border-border bg-muted/30",
      };
      return (
        <div
          className={cn(
            "mb-4 flex gap-3 rounded-lg border border-l-4 p-3.5",
            toneClass[block.tone],
          )}
        >
          <span className="text-base leading-none">{block.icon}</span>
          <div className="min-w-0 flex-1 space-y-2.5">
            {block.items.map((it, i) =>
              it.type === "text" ? (
                <p key={i} className="text-[13px] leading-relaxed text-foreground/90">
                  <Inline text={it.text} />
                </p>
              ) : (
                <img
                  key={i}
                  src={it.src}
                  alt="WMS screenshot"
                  loading="lazy"
                  className="w-full rounded-md border border-border shadow-sm"
                />
              ),
            )}
          </div>
        </div>
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Recursive section content — page-level headings (the manual's h3s, direct
// children of a page node) render as "sub"; anything deeper stays "subsub".
// ---------------------------------------------------------------------------

function SectionHeading({
  tier,
  id,
  title,
}: {
  tier: "sub" | "subsub";
  id: string;
  title: string;
}) {
  if (tier === "sub") {
    return (
      <h2
        id={id}
        className="mb-2.5 mt-8 scroll-mt-16 border-b border-border/70 pb-1.5 text-[17px] font-semibold text-foreground first:mt-0"
      >
        {title}
      </h2>
    );
  }
  return (
    <h3 id={id} className="mb-2 mt-5 scroll-mt-16 text-[14px] font-semibold text-foreground">
      {title}
    </h3>
  );
}

function SectionContent({ node, tier }: { node: KbSection; tier: "sub" | "subsub" }) {
  return (
    <>
      {node.blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} />
      ))}
      {node.children.map((child) => (
        <div key={child.id}>
          <SectionHeading tier={tier} id={child.id} title={child.title} />
          <SectionContent node={child} tier="subsub" />
        </div>
      ))}
    </>
  );
}

function PageView({ page }: { page: KbPage }) {
  const { node } = page;
  const jumpLinks = node.children.length > 1 ? node.children : [];

  return (
    <article className="mx-auto max-w-3xl px-8 py-8">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {page.groupTitle}
      </div>
      <h1 className="text-2xl font-bold text-foreground">{page.title}</h1>

      {jumpLinks.length > 0 && (
        <nav className="my-4 rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            On this page
          </div>
          <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {jumpLinks.map((c) => (
              <li key={c.id} className="truncate">
                <a
                  href={`#${c.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(c.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="text-[12.5px] text-sys hover:underline"
                >
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-4">
        {node.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} />
        ))}
        {node.children.map((child) => (
          <div key={child.id}>
            <SectionHeading tier="sub" id={child.id} title={child.title} />
            <SectionContent node={child} tier="subsub" />
          </div>
        ))}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Viewer shell — left nav (chapters + search) and a scrollable content pane.
// ---------------------------------------------------------------------------

export function KnowledgeBaseViewer({
  initialPageId,
  initialSectionId,
}: {
  initialPageId?: string;
  initialSectionId?: string;
} = {}) {
  const groups = useMemo(() => buildGroups(knowledgeBaseSections), []);
  const allPages = useMemo(() => groups.flatMap((g) => g.pages), [groups]);
  const anchorToPage = useMemo(() => buildAnchorToPage(allPages), [allPages]);
  const searchIndex = useMemo(
    () => allPages.map((p) => ({ page: p, text: `${p.title} ${nodeText(p.node)}`.toLowerCase() })),
    [allPages],
  );

  const deepLinkPageId =
    (initialSectionId && anchorToPage[initialSectionId]) ||
    (initialPageId && anchorToPage[initialPageId]) ||
    undefined;

  const [activePageId, setActivePageId] = useState(deepLinkPageId ?? allPages[0]?.id);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      groups.map((g) => [
        g.groupId,
        deepLinkPageId ? g.pages.some((p) => p.id === deepLinkPageId) : true,
      ]),
    ),
  );
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialSectionId) return;
    requestAnimationFrame(() => {
      document.getElementById(initialSectionId)?.scrollIntoView({ block: "start" });
    });
    // Only run for the deep link this viewer instance was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePage = allPages.find((p) => p.id === activePageId) ?? allPages[0];
  const activeIndex = allPages.findIndex((p) => p.id === activePage.id);
  const prevPage = activeIndex > 0 ? allPages[activeIndex - 1] : null;
  const nextPage = activeIndex < allPages.length - 1 ? allPages[activeIndex + 1] : null;

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? searchIndex.filter((e) => e.text.includes(trimmedQuery)).map((e) => e.page)
    : null;

  const selectPage = (id: string) => {
    setActivePageId(id);
    setQuery("");
    requestAnimationFrame(() => contentRef.current?.scrollTo({ top: 0 }));
  };

  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const navButtonClass = (active: boolean) =>
    cn(
      "block w-full truncate rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors",
      active ? "bg-sys-bg font-medium text-sys" : "text-foreground/80 hover:bg-muted/60",
    );

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full overflow-hidden bg-background">
      {/* Left nav */}
      <div className="flex w-72 shrink-0 flex-col border-r border-border bg-muted/20">
        <div className="border-b border-border p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            WMS 2.0 User Manual
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the manual…"
              className="h-8 pl-8 pr-7 text-[12.5px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {searchResults ? (
            searchResults.length === 0 ? (
              <div className="p-3 text-center text-[12px] text-muted-foreground">
                No matches for &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="space-y-0.5">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPage(p.id)}
                    className={cn(navButtonClass(p.id === activePage.id), "h-auto py-1.5")}
                  >
                    <div className="truncate">{p.title}</div>
                    <div className="truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">
                      {p.groupTitle}
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            groups.map((g) => {
              const GroupIcon = GROUP_ICONS[g.groupTitle] ?? BookOpen;
              const isOpen = openGroups[g.groupId];
              return (
                <div key={g.groupId} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.groupId)}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:bg-muted/60"
                  >
                    <ChevronRight
                      className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-90")}
                    />
                    <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{g.groupTitle}</span>
                  </button>
                  {isOpen && (
                    <div className="ml-2 space-y-0.5 border-l border-border pl-2">
                      {g.pages.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPage(p.id)}
                          className={navButtonClass(p.id === activePage.id)}
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Content pane */}
      <div ref={contentRef} className="min-w-0 flex-1 overflow-y-auto">
        <PageView page={activePage} />
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 border-t border-border px-8 py-6">
          {prevPage ? (
            <button
              type="button"
              onClick={() => selectPage(prevPage.id)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-left text-[12.5px] text-foreground transition-colors hover:bg-muted/60"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{prevPage.title}</span>
            </button>
          ) : (
            <span />
          )}
          {nextPage && (
            <button
              type="button"
              onClick={() => selectPage(nextPage.id)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-right text-[12.5px] text-foreground transition-colors hover:bg-muted/60"
            >
              <span className="truncate">{nextPage.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
