"use client";

import { Bell, Plus, Menu, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileNav } from "@/components/layout/MobileNavContext";

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, description, action }: HeaderProps) {
  const { isMobile, openMobileNav } = useMobileNav();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-3 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger menu - mobile only */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={openMobileNav}
            className="h-10 w-10 -ml-1 touch-manipulation"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
        <a
          href="https://askconciergeai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Open AskConciergeAI website"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Website</span>
        </a>
        <div className="h-5 w-px bg-border hidden sm:block" />
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 touch-manipulation"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        {action && (
          <Button
            onClick={action.onClick}
            size={isMobile ? "sm" : "default"}
            className="touch-manipulation"
          >
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>
    </header>
  );
}
