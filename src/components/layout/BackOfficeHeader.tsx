"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const BREADCRUMB_MAP: Record<string, string> = {
  "/back-office/dashboard": "Dashboard",
  "/back-office/athletes": "Athletes",
  "/back-office/teams": "Teams",
  "/back-office/attendance": "Attendance",
  "/back-office/attendance/sessions": "Sessions",
  "/back-office/notifications": "Notifications",
  "/back-office/sports": "Sports",
  "/back-office/users": "Users",
  "/back-office/settings": "Settings",
};

export function BackOfficeHeader() {
  const pathname = usePathname();
  const title =
    BREADCRUMB_MAP[pathname] ||
    Object.entries(BREADCRUMB_MAP).find(([key]) =>
      pathname.startsWith(key + "/")
    )?.[1] ||
    "";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      {title && (
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
      )}
    </header>
  );
}
