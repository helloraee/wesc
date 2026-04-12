"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  ClipboardCheck,
  Bell,
  Settings,
  LogOut,
  Trophy,
  UserCircle,
  Dumbbell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Role } from "@/types";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/back-office/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER", "COACH"] as Role[],
  },
  {
    label: "Athletes",
    href: "/back-office/athletes",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER", "COACH"] as Role[],
  },
  {
    label: "Teams",
    href: "/back-office/teams",
    icon: Shield,
    roles: ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"] as Role[],
  },
  {
    label: "Sessions",
    href: "/back-office/attendance/sessions",
    icon: Dumbbell,
    roles: ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER", "COACH"] as Role[],
  },
  {
    label: "Attendance",
    href: "/back-office/attendance",
    icon: ClipboardCheck,
    roles: ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER", "COACH"] as Role[],
  },
  {
    label: "Notifications",
    href: "/back-office/notifications",
    icon: Bell,
    roles: ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER", "COACH"] as Role[],
  },
];

const ADMIN_ITEMS = [
  {
    label: "Sports",
    href: "/back-office/sports",
    icon: Trophy,
    roles: ["SUPER_ADMIN", "ADMIN"] as Role[],
  },
  {
    label: "Users",
    href: "/back-office/users",
    icon: UserCircle,
    roles: ["SUPER_ADMIN", "ADMIN"] as Role[],
  },
  {
    label: "Settings",
    href: "/back-office/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ADMIN"] as Role[],
  },
];

export function BackOfficeSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  const filteredNav = NAV_ITEMS.filter((item) => role && item.roles.includes(role));
  const filteredAdmin = ADMIN_ITEMS.filter((item) => role && item.roles.includes(role));

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "WE";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="!p-0 border-b border-sidebar-border">
        <Link href="/back-office/dashboard" className="flex h-14 items-center gap-3 px-4">
          <Image
            src="/assets/WEST_Logo.svg"
            alt="WESC"
            width={32}
            height={32}
          />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-sidebar-primary">
              West End SC
            </p>
            <p className="text-[10px] leading-tight text-sidebar-foreground/60">Back Office</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={
                      item.href === "/back-office/attendance"
                        ? pathname === "/back-office/attendance"
                        : pathname === item.href || pathname.startsWith(item.href + "/")
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdmin.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={
                      item.href === "/back-office/attendance"
                        ? pathname === "/back-office/attendance"
                        : pathname === item.href || pathname.startsWith(item.href + "/")
                    }
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md p-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
            <Avatar className="size-8">
              <AvatarFallback className="bg-w-600 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium leading-none">
                {session?.user?.name}
              </p>
              <p className="mt-0.5 text-xs text-sidebar-foreground/60">
                {session?.user?.role?.replace("_", " ")}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
