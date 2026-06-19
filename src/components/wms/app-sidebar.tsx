import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BadgeCheck,
  Bell,
  Bot,
  Boxes,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  FilePlus2,
  Hand,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  MessagesSquare,
  MoveDown,
  Network,
  Package,
  Siren,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  Settings2,
  ShuffleIcon,
  SquarePen,
  TrendingUp,
  Users,
  Waypoints,
  Truck,
  Undo2,
  RotateCcw,
  Building2,
  UserRoundCheck,
  ScanLine,
  Warehouse,
  Waves,
  SlidersHorizontal,
  Database,
  ScrollText,
  ServerCog,
  Receipt,
  Gauge,
  Star,
  LogIn,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

// A submodule groups several leaf items under a collapsible heading
interface NavModule {
  title: string;
  icon: LucideIcon;
  children: NavItem[];
}

type NavEntry = NavItem | NavModule;

const isModule = (e: NavEntry): e is NavModule => "children" in e;

interface NavSection {
  label: string;
  items: NavEntry[];
}

const sections: NavSection[] = [
  {
    label: "Command Center",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Control Tower", url: "/control-tower", icon: Network },
      { title: "Stuck Orders", url: "/stuck-orders", icon: AlertTriangle },
      { title: "Site Performance", url: "/site-performance", icon: Activity },
      { title: "Trends", url: "/trends", icon: TrendingUp },
      { title: "Alerts", url: "/alerts", icon: Bell },
    ],
  },
  {
    label: "AI Agents",
    items: [
      { title: "Agent Health", url: "/agent-health", icon: Bot },
      { title: "Agent Directory", url: "/agent-directory", icon: Users },
      { title: "Drift & Feedback", url: "/drift-feedback", icon: Waypoints },
    ],
  },
  {
    label: "Exceptions",
    items: [
      { title: "Inbound Exceptions", url: "/inbound-exceptions", icon: ArrowDownToLine },
      { title: "Outbound Exceptions", url: "/outbound-exceptions", icon: ArrowUpFromLine },
      { title: "Incidents", url: "/incidents", icon: Siren },
      { title: "Recovery Queue", url: "/recovery-queue", icon: LifeBuoy },
      { title: "Customer Disputes", url: "/customer-disputes", icon: MessagesSquare },
    ],
  },
  {
    label: "Reverse & QC",
    items: [
      { title: "Returns Intake", url: "/returns-intake", icon: Undo2 },
      { title: "Returns Evaluation", url: "/returns-evaluation", icon: UserRoundCheck },
      { title: "RTO · Origin", url: "/returns-rto", icon: RotateCcw },
      { title: "RTV · Vendor", url: "/returns-rtv", icon: Building2 },
      { title: "CIR · Customer", url: "/returns-cir", icon: MessagesSquare },
      { title: "QC Station", url: "/qc-station", icon: ScanLine },
      { title: "Cycle Count", url: "/cycle-count", icon: ClipboardCheck },
    ],
  },
  {
    label: "Admin & Governance",
    items: [
      { title: "Users & Roles", url: "/users-roles", icon: UserRoundCheck },
      { title: "Policies", url: "/policies", icon: SlidersHorizontal },
      { title: "Master Data", url: "/master-data", icon: Database },
      { title: "Audit Log", url: "/audit-log", icon: ScrollText },
      { title: "Platform Health", url: "/admin", icon: ServerCog },
      { title: "Billing Leakage", url: "/billing-leakage", icon: Receipt },
      { title: "Carrier Scorecards", url: "/carrier-scorecards", icon: Gauge },
      { title: "Vendor Scorecards", url: "/vendor-scorecards", icon: Star },
      { title: "Gatepass Log", url: "/gatepass-log", icon: LogIn },
    ],
  },
  {
    label: "Devices",
    items: [
      { title: "Floor Handhelds", url: "/floor-handhelds", icon: Smartphone },
    ],
  },
  {
    label: "Outbound",
    items: [
      { title: "Order", url: "/orders", icon: Package },
      {
        title: "Picking",
        icon: Hand,
        children: [
          { title: "Wave Creation", url: "/wave-creation", icon: Waves },
          { title: "Pick", url: "/pick", icon: Hand },
          {
            title: "View Picklists",
            url: "/view-picklist",
            icon: ClipboardList,
          },
        ],
      },
      { title: "Sort", url: "/sort", icon: ShuffleIcon },
      { title: "Putwall", url: "/putwall", icon: LayoutGrid },
      {
        title: "Packing",
        icon: Boxes,
        children: [
          { title: "Pack", url: "/pack", icon: Boxes },
          {
            title: "View Packlists",
            url: "/view-pack",
            icon: ClipboardList,
          },
        ],
      },
      {
        title: "Manifest",
        icon: ClipboardList,
        children: [
          { title: "Create Manifest", url: "/manifest", icon: ClipboardList },
          { title: "View Manifests", url: "/view-manifest", icon: FileBarChart },
        ],
      },
      {
        title: "Dispatch",
        icon: Truck,
        children: [
          { title: "Dispatch", url: "/dispatch", icon: Truck },
          { title: "View Shiplists", url: "/view-dispatch", icon: ClipboardList },
        ],
      },
    ],
  },
  {
    label: "Inbound",
    items: [
      { title: "Gate Entry", url: "/gate-entry", icon: DoorOpen },
      { title: "Unloading", url: "/unloading", icon: PackageOpen },
      { title: "GRN", url: "/grn", icon: ClipboardCheck },
      {
        title: "Sales Return GRN",
        url: "/sales-return-grn",
        icon: ClipboardCheck,
      },
      { title: "Putaway", url: "/putaway", icon: MoveDown },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        title: "Detailed Inventory View",
        url: "/detailed-inventory-view",
        icon: Boxes,
      },
      { title: "Item Movement", url: "/item-movement", icon: ArrowLeftRight },
      { title: "Create Movement", url: "/movement-task-create", icon: FilePlus2 },
      { title: "Bin Inventory", url: "/item-info-update", icon: SquarePen },
      {
        title: "Kit",
        icon: Layers,
        children: [
          { title: "Kit Mapping", url: "/kit-mapping", icon: Boxes },
          { title: "Kit Order", url: "/kit-order", icon: FilePlus2 },
          { title: "Kitting", url: "/kitting", icon: PackageCheck },
        ],
      },
      { title: "Approvals", url: "/approvals", icon: BadgeCheck },
      { title: "Replenishment", url: "/replenishment", icon: PackagePlus },
      {
        title: "Slotting",
        icon: Settings2,
        children: [
          { title: "Density Heatmap", url: "/slotting", icon: LayoutGrid },
          { title: "Slotting Config", url: "/slotting-config", icon: Settings2 },
        ],
      },
    ],
  },
  {
    label: "Masters",
    items: [
      { title: "Dock Management", url: "/dock-management", icon: Warehouse },
    ],
  },
  {
    label: "Reports",
    items: [{ title: "Reports", url: "/reports", icon: FileBarChart }],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/orders" ? pathname.startsWith("/orders") : pathname === url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-ai text-white">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-sidebar-accent-foreground">
              Shiprocket
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/60">
              OMS · WMS
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => {
          const sectionActive = section.items.some((i) =>
            isModule(i) ? i.children.some((c) => isActive(c.url)) : isActive(i.url),
          );
          return (
            <Collapsible
              key={section.label}
              defaultOpen={sectionActive || section.label === "Outbound"}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden"
                >
                  <CollapsibleTrigger>
                    {section.label}
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) =>
                        isModule(item) ? (
                          <ModuleMenu key={item.title} module={item} />
                        ) : (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive(item.url)}
                              tooltip={item.title}
                            >
                              <Link to={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ),
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

function ModuleMenu({ module }: { module: NavModule }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/orders" ? pathname.startsWith("/orders") : pathname === url;
  const childActive = module.children.some((c) => isActive(c.url));

  return (
    <Collapsible defaultOpen={childActive} className="group/submodule">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={module.title}>
            <module.icon className="h-4 w-4" />
            <span>{module.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/submodule:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {module.children.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton asChild isActive={isActive(child.url)}>
                  <Link to={child.url}>
                    <child.icon className="h-4 w-4" />
                    <span>{child.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
