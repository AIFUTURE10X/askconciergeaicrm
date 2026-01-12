"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trophy, XCircle, DollarSign, Calendar, LayoutGrid, List } from "lucide-react";
import { LOST_REASONS } from "@/lib/constants/pipeline";
import { ClosedDealCard } from "./ClosedDealCard";
import type { Deal, Contact } from "@/lib/db/schema";

type DealWithContact = Deal & { contact: Contact | null };
type ViewMode = "list" | "grid";

interface ClosedDealsTableProps {
  deals: DealWithContact[];
  filter: "all" | "won" | "lost";
  viewMode: ViewMode;
  onFilterChange: (filter: "all" | "won" | "lost") => void;
  onViewModeChange: (mode: ViewMode) => void;
  onDealClick: (deal: DealWithContact) => void;
}

export function ClosedDealsTable({
  deals,
  filter,
  viewMode,
  onFilterChange,
  onViewModeChange,
  onDealClick,
}: ClosedDealsTableProps) {
  const [search, setSearch] = useState("");

  // Filter deals by search and status
  const filteredDeals = deals.filter((deal) => {
    // Status filter
    if (filter === "won" && deal.stage !== "closed_won") return false;
    if (filter === "lost" && deal.stage !== "closed_lost") return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        deal.title.toLowerCase().includes(searchLower) ||
        deal.contact?.name.toLowerCase().includes(searchLower) ||
        deal.contact?.company?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const wonCount = deals.filter((d) => d.stage === "closed_won").length;
  const lostCount = deals.filter((d) => d.stage === "closed_lost").length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("all")}
          >
            All ({deals.length})
          </Button>
          <Button
            variant={filter === "won" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("won")}
            className={filter === "won" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Trophy className="h-4 w-4 mr-1" />
            Won ({wonCount})
          </Button>
          <Button
            variant={filter === "lost" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("lost")}
            className={filter === "lost" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Lost ({lostCount})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-r-none"
              onClick={() => onViewModeChange("list")}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-l-none"
              onClick={() => onViewModeChange("grid")}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Deals */}
      {filteredDeals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? "No deals match your search" : "No closed deals yet"}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filteredDeals.map((deal) => (
            <ClosedDealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredDeals.map((deal) => {
            const isWon = deal.stage === "closed_won";
            const lostReasonLabel = deal.lostReason
              ? LOST_REASONS.find((r) => r.id === deal.lostReason)?.label
              : null;

            return (
              <Card
                key={deal.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onDealClick(deal)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Deal info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate">{deal.title}</h3>
                        {isWon ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 flex-shrink-0">
                            <Trophy className="h-3 w-3 mr-1" />
                            Won
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 flex-shrink-0">
                            <XCircle className="h-3 w-3 mr-1" />
                            Lost
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {deal.contact && (
                          <span>
                            {deal.contact.name}
                            {deal.contact.company && ` · ${deal.contact.company}`}
                          </span>
                        )}
                        {!isWon && lostReasonLabel && (
                          <span className="text-red-600 dark:text-red-400">
                            {lostReasonLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Value and date */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-semibold flex items-center justify-end">
                          <DollarSign className="h-4 w-4" />
                          {deal.value ? parseFloat(deal.value).toLocaleString() : "0"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          /{deal.billingPeriod === "annual" ? "year" : "month"}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground w-24">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          {deal.closedAt
                            ? format(new Date(deal.closedAt), "MMM d, yyyy")
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
