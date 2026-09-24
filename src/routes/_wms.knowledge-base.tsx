import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeBaseViewer } from "@/components/wms/kb-viewer";

interface KnowledgeBaseSearch {
  page?: string;
  section?: string;
}

export const Route = createFileRoute("/_wms/knowledge-base")({
  head: () => ({
    meta: [{ title: "Knowledge Base — WMS 2.0 User Manual" }],
  }),
  validateSearch: (search: Record<string, unknown>): KnowledgeBaseSearch => ({
    page: typeof search.page === "string" ? search.page : undefined,
    section: typeof search.section === "string" ? search.section : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { page, section } = Route.useSearch();
  return <KnowledgeBaseViewer initialPageId={page} initialSectionId={section} />;
}
