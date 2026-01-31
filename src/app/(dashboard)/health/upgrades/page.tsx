"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UpgradeAlertSummary } from "@/components/customers/upgrades/UpgradeAlertSummary";
import { UpgradeAlertsList } from "@/components/customers/upgrades/UpgradeAlertsList";
import type { UpgradeOpportunity, UpgradeStats } from "@/lib/admin/upgrade-queries";

const SUB_PAGES = [
  { href: "/health", label: "Overview" },
  { href: "/health/trials", label: "Trials" },
  { href: "/health/renewals", label: "Renewals" },
  { href: "/health/upgrades", label: "Upgrades" },
];

export default function UpgradesPage() {
  const [opportunities, setOpportunities] = useState<UpgradeOpportunity[]>([]);
  const [stats, setStats] = useState<UpgradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers/upgrade-alerts");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching upgrade data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Header title="Upgrade Opportunities" description="Customers hitting tier limits - ready for upsell" />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Sub-page navigation */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {SUB_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                page.href === "/health/upgrades"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {page.label}
            </Link>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {stats && <UpgradeAlertSummary stats={stats} />}
            <UpgradeAlertsList opportunities={opportunities} />
          </>
        )}
      </div>
    </>
  );
}
