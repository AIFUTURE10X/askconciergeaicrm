"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VALID_TIERS, TIER_LABELS } from "@/lib/admin/constants";
import type { CustomerHealthData, HealthDashboardStats } from "@/lib/admin/health";
import { HealthSummaryCards } from "@/components/customers/health/HealthSummaryCards";
import { AtRiskCustomersList } from "@/components/customers/health/AtRiskCustomersList";
import { UsageWarningsList } from "@/components/customers/health/UsageWarningsList";
import { InactiveCustomersList } from "@/components/customers/health/InactiveCustomersList";

const CATEGORY_TABS = [
  { id: "", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "atRisk", label: "At Risk" },
  { id: "healthy", label: "Healthy" },
] as const;

const SUB_PAGES = [
  { href: "/health", label: "Overview" },
  { href: "/health/trials", label: "Trials" },
  { href: "/health/renewals", label: "Renewals" },
  { href: "/health/upgrades", label: "Upgrades" },
];

export default function HealthDashboardPage() {
  const [customers, setCustomers] = useState<CustomerHealthData[]>([]);
  const [stats, setStats] = useState<HealthDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [sortField, setSortField] = useState("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (tierFilter) params.set("tier", tierFilter);
      params.set("sort", sortField);
      params.set("order", sortOrder);

      const res = await fetch(`/api/customers/health?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, tierFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Header title="Customer Health" description="Monitor customer health scores and identify at-risk accounts" />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Sub-page navigation */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {SUB_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                page.href === "/health"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {page.label}
            </Link>
          ))}
        </div>

        {/* Summary cards */}
        {stats && <HealthSummaryCards stats={stats} />}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex gap-1 rounded-lg border p-0.5">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  categoryFilter === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Tiers</option>
            {VALID_TIERS.map((t) => (
              <option key={t} value={t}>{TIER_LABELS[t]}</option>
            ))}
          </select>

          <select
            value={`${sortField}:${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split(":");
              setSortField(f);
              setSortOrder(o as "asc" | "desc");
            }}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="score:asc">Score (Low to High)</option>
            <option value="score:desc">Score (High to Low)</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="usage:desc">Usage (High to Low)</option>
            <option value="engagement:desc">Engagement (High to Low)</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* At-risk / critical customers table */}
            <AtRiskCustomersList customers={customers} />

            {/* Side-by-side widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UsageWarningsList customers={customers} />
              <InactiveCustomersList customers={customers} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
