"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trophy, XCircle, DollarSign, LayoutGrid, List } from "lucide-react";
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
        /* Grid View - larger cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDeals.map((deal) => (
            <ClosedDealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
            />
          ))}
        </div>
      ) : (
        /* List View - compact, 6 per row */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
          {filteredDeals.map((deal) => {
            const isWon = deal.stage === "closed_won";

            return (
              <Card
                key={deal.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onDealClick(deal)}
              >
                <CardContent className="p-2">
                  {/* Status + Date */}
                  <div className="flex items-center justify-between mb-1">
                    {isWon ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] px-1 py-0">
                        <Trophy className="h-2.5 w-2.5 mr-0.5" />
                        Won
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] px-1 py-0">
                        <XCircle className="h-2.5 w-2.5 mr-0.5" />
                        Lost
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {deal.closedAt
                        ? format(new Date(deal.closedAt), "MMM d")
                        : "-"}
                    </span>
                  </div>
                  {/* Title */}
                  <p className="text-xs font-medium truncate mb-1">{deal.title}</p>
                  {/* Contact */}
                  <p className="text-[10px] text-muted-foreground truncate mb-1">
                    {deal.contact?.name || "No contact"}
                  </p>
                  {/* Value */}
                  <div className="flex items-center text-xs font-semibold">
                    <DollarSign className="h-3 w-3" />
                    {deal.value ? parseFloat(deal.value).toLocaleString() : "0"}
                    <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                      /{deal.billingPeriod === "annual" ? "yr" : "mo"}
                    </span>
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
