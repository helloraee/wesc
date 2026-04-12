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
          <div className="flex min-h-screen w-full">
            <BackOfficeSidebar />
            <SidebarInset className="flex flex-1 flex-col">
              <BackOfficeHeader />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
