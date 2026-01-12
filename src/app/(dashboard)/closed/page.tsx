"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ClosedDealsTable } from "@/components/closed/ClosedDealsTable";
import { ClosedDealDrawer } from "@/components/closed/ClosedDealDrawer";
import { Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import type { Deal, Contact } from "@/lib/db/schema";

type DealWithContact = Deal & { contact: Contact | null };

type ViewMode = "list" | "grid";

export default function ClosedPage() {
  const [deals, setDeals] = useState<DealWithContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "won" | "lost">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);

  // Fetch closed deals
  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/deals?status=closed");
      if (res.ok) {
        const { deals: dealData } = await res.json();
        // Filter to only closed deals
        const closedDeals = dealData.filter(
          (d: DealWithContact) =>
            d.stage === "closed_won" || d.stage === "closed_lost"
        );
        setDeals(closedDeals);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load closed deals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Handle re-opening a deal
  const handleReopen = async (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const res = await fetch(`/api/deals/${dealId}/reopen`, {
      method: "POST",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to re-open deal");
    }

    // Remove from closed deals list
    setDeals((prev) => prev.filter((d) => d.id !== dealId));
  };

  // Calculate stats
  const wonCount = deals.filter((d) => d.stage === "closed_won").length;
  const lostCount = deals.filter((d) => d.stage === "closed_lost").length;
  const totalRevenue = deals
    .filter((d) => d.stage === "closed_won")
    .reduce((sum, d) => sum + (d.value ? parseFloat(d.value) : 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Closed Deals"
        description={`${wonCount} won, ${lostCount} lost`}
      />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Total Closed</div>
            <div className="text-2xl font-bold">{deals.length}</div>
          </div>
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400">Won</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {wonCount}
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Revenue Won</div>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Empty State or Table */}
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Archive className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No closed deals yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              When you mark deals as Won or Lost in the Pipeline, they will
              appear here.
            </p>
          </div>
        ) : (
          <ClosedDealsTable
            deals={deals}
            filter={filter}
            viewMode={viewMode}
            onFilterChange={setFilter}
            onViewModeChange={setViewMode}
            onDealClick={setSelectedDeal}
          />
        )}
      </div>

      <ClosedDealDrawer
        deal={selectedDeal}
        open={!!selectedDeal}
        onOpenChange={(open) => !open && setSelectedDeal(null)}
        onReopen={handleReopen}
      />
    </>
  );
}
