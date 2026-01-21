"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";
import { MobileNavProvider } from "@/components/layout/MobileNavContext";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn(
        "transition-all duration-300",
        // CSS-first: No padding on mobile, default padding on desktop
        // This prevents flash of incorrect padding during hydration
        "pl-0 md:pl-64",
        // JS override: On desktop, adjust padding based on collapsed state
        isCollapsed && "md:pl-16"
      )}
    >
      {children}
    </main>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <MobileNavProvider>
        <div className="min-h-screen bg-muted/30">
          <Sidebar />
          <DashboardContent>{children}</DashboardContent>
        </div>
      </MobileNavProvider>
    </SidebarProvider>
  );
}
