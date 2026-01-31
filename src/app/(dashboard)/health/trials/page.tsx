"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrialSummaryCards } from "@/components/customers/trials/TrialSummaryCards";
import { TrialPipelineList } from "@/components/customers/trials/TrialPipelineList";
import { StalledTrialsList } from "@/components/customers/trials/StalledTrialsList";
import type { TrialOnboardingData } from "@/lib/admin/health-queries";

const SUB_PAGES = [
  { href: "/health", label: "Overview" },
  { href: "/health/trials", label: "Trials" },
  { href: "/health/renewals", label: "Renewals" },
  { href: "/health/upgrades", label: "Upgrades" },
];

export default function TrialsPage() {
  const [trials, setTrials] = useState<TrialOnboardingData[]>([]);
  const [stats, setStats] = useState<{
    activeTrials: number;
    stalledCount: number;
    avgMilestones: number;
    urgentCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers/trials");
      if (res.ok) {
        const data = await res.json();
        setTrials(data.trials);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching trial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Header title="Trial Tracker" description="Monitor trial-to-paid conversion pipeline" />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Sub-page navigation */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {SUB_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                page.href === "/health/trials"
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
            {stats && <TrialSummaryCards stats={stats} />}
            <TrialPipelineList trials={trials} />
            <StalledTrialsList trials={trials} />
          </>
        )}
      </div>
    </>
  );
}
