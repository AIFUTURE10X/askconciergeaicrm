"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Kanban,
  Users,
  Bell,
  Inbox,
  Archive,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useMobileNav } from "@/components/layout/MobileNavContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/closed", label: "Closed", icon: Archive },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/reminders", label: "Reminders", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();
  const { isMobile, isMobileNavOpen, closeMobileNav } = useMobileNav();

  // On mobile, sidebar is controlled by MobileNavContext
  // On desktop, sidebar is controlled by SidebarContext (collapsed/expanded)
  const showSidebar = isMobile ? isMobileNavOpen : true;
  const sidebarWidth = isMobile ? "w-64" : isCollapsed ? "w-16" : "w-64";

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r bg-background transition-all duration-300",
          sidebarWidth,
          // CSS-first mobile hiding: hidden by default on mobile (< md), visible on desktop (>= md)
          // This prevents flash of sidebar on mobile during hydration
          "-translate-x-full md:translate-x-0",
          // JS override: when mobile nav is open, show the sidebar
          isMobile && isMobileNavOpen && "!translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold flex-shrink-0">
                A
              </div>
              {(!isCollapsed || isMobile) && (
                <span className="text-sm font-semibold whitespace-nowrap">
                  AskConciergeAI CRM
                </span>
              )}
            </Link>
            {/* Desktop: collapse toggle | Mobile: close button */}
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileNav}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="h-8 w-8 flex-shrink-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed && !isMobile ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && !isMobile && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!isCollapsed || isMobile) && item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-2">
            <div
              className={cn(
                "flex items-center",
                isCollapsed && !isMobile ? "flex-col gap-2" : "justify-between"
              )}
            >
              <Link
                href="/settings"
                title={isCollapsed && !isMobile ? "Settings" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-manipulation",
                  isCollapsed && !isMobile && "justify-center px-2"
                )}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && "Settings"}
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
