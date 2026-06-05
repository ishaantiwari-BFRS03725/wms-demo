import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  Hand,
  LayoutGrid,
  MoveDown,
  Package,
  PackageOpen,
  ShuffleIcon,
  Truck,
  Warehouse,
} from "lucide-react";
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
} from "@/components/ui/sidebar";

const outboundItems = [
  { title: "Order", url: "/orders", icon: Package },
  { title: "Pick", url: "/pick", icon: Hand },
  { title: "Sort", url: "/sort", icon: ShuffleIcon },
  { title: "Putwall", url: "/putwall", icon: LayoutGrid },
  { title: "Pack", url: "/pack", icon: Boxes },
  { title: "Manifest", url: "/manifest", icon: ClipboardList },
  { title: "Dispatch", url: "/dispatch", icon: Truck },
] as const;

const inboundItems = [
  { title: "Gate Entry", url: "/gate-entry", icon: DoorOpen },
  { title: "Unloading", url: "/unloading", icon: PackageOpen },
  { title: "GRN", url: "/grn", icon: ClipboardCheck },
  { title: "Sales Return GRN", url: "/sales-return-grn", icon: ClipboardCheck },
  { title: "Putaway", url: "/putaway", icon: MoveDown },
] as const;

const toolItems = [
  { title: "Reports", url: "/reports", icon: FileBarChart },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/orders" ? pathname.startsWith("/orders") : pathname === url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Warehouse className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Shiprocket WMS</span>
            <span className="text-xs text-muted-foreground">Outbound</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Outbound</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {outboundItems.map((item) => (
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Inbound</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inboundItems.map((item) => (
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
