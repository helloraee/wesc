import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BackOfficeSidebar } from "@/components/layout/BackOfficeSidebar";
import { BackOfficeHeader } from "@/components/layout/BackOfficeHeader";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <TooltipProvider>
        <SidebarProvider>
          <BackOfficeSidebar />
          <SidebarInset>
            <BackOfficeHeader />
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
