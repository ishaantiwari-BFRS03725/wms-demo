import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, flatNavItems } from "@/components/wms/app-sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export const Route = createFileRoute("/_wms")({
  component: WmsLayout,
});

function MenuSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted md:flex"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate text-[12px]">Search menu…</span>
        <kbd className="ml-auto rounded-[3px] border border-border bg-muted px-1 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search menu…" />
        <CommandList>
          <CommandEmpty>No menu items found.</CommandEmpty>
          <CommandGroup heading="Menu">
            {flatNavItems.map((item) => (
              <CommandItem
                key={`${item.parent ?? ""}/${item.url}`}
                value={`${item.title} ${item.parent ?? ""}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: item.url });
                }}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.title}</span>
                {item.parent && (
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                    {item.parent}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function ToolButton({ label, count }: { label: string; count?: number }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-foreground transition-colors hover:bg-muted"
    >
      {label}
      {count != null && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-[3px] bg-ai-bg px-1 text-[10px] font-medium text-ai">
          {count}
        </span>
      )}
    </button>
  );
}

function WmsLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-muted px-4">
            <SidebarTrigger />
            <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
              Site{" "}
              <span className="font-sans font-semibold normal-case tracking-normal text-foreground">
                BLR-01
              </span>{" "}
              · Outbound
            </div>
            <MenuSearch />
            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <ToolButton label="Alerts" count={4} />
              <ToolButton label="Approvals" count={6} />
              <ToolButton label="Copilot" />
            </div>
          </header>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
