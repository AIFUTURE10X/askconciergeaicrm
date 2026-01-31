"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RenewalSummaryCards } from "@/components/customers/renewals/RenewalSummaryCards";
import { RenewalPipelineList } from "@/components/customers/renewals/RenewalPipelineList";
import { ChurnReasonChart } from "@/components/customers/renewals/ChurnReasonChart";
import { RecentChurnList } from "@/components/customers/renewals/RecentChurnList";
import type { RenewalCustomer, RenewalStats, ChurnRecord } from "@/lib/admin/renewal-queries";

const SUB_PAGES = [
  { href: "/health", label: "Overview" },
  { href: "/health/trials", label: "Trials" },
  { href: "/health/renewals", label: "Renewals" },
  { href: "/health/upgrades", label: "Upgrades" },
];

export default function RenewalsPage() {
  const [customers, setCustomers] = useState<RenewalCustomer[]>([]);
  const [stats, setStats] = useState<RenewalStats | null>(null);
  const [recentChurns, setRecentChurns] = useState<ChurnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers/renewals");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setStats(data.stats);
        setRecentChurns(data.recentChurns);
      }
    } catch (error) {
      console.error("Error fetching renewal data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Header title="Renewals & Churn" description="Track upcoming renewals and churn reasons" />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Sub-page navigation */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {SUB_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                page.href === "/health/renewals"
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
            {stats && <RenewalSummaryCards stats={stats} />}
            <RenewalPipelineList customers={customers} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChurnReasonChart reasons={stats?.topChurnReasons || []} />
              <RecentChurnList churns={recentChurns} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
