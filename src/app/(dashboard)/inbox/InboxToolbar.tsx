"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Mail, LayoutGrid, List, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "pending" | "sent" | "all";
type EnquiryTypeFilter = "all" | "sales" | "support" | "general";
type ViewMode = "grid" | "list";

const ENQUIRY_FILTERS: { id: EnquiryTypeFilter; label: string; color: string }[] = [
  { id: "all", label: "All Types", color: "" },
  { id: "sales", label: "Sales", color: "text-blue-600 dark:text-blue-400" },
  { id: "support", label: "Support", color: "text-orange-600 dark:text-orange-400" },
  { id: "general", label: "General", color: "text-gray-600 dark:text-gray-400" },
];

interface InboxToolbarProps {
  filter: StatusFilter;
  viewMode: ViewMode;
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  someSelected: boolean;
  isSyncing: boolean;
  isRefreshing: boolean;
  isBulkDeleting: boolean;
  onFilterChange: (filter: StatusFilter) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleSelectAll: () => void;
  onCancelSelection: () => void;
  onBulkDelete: () => void;
  onSyncNow: () => void;
  onRefresh: () => void;
  // New props for enquiry type and search
  enquiryType: EnquiryTypeFilter;
  onEnquiryTypeChange: (type: EnquiryTypeFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function InboxToolbar({
  filter,
  viewMode,
  selectedCount,
  totalCount,
  allSelected,
  someSelected,
  isSyncing,
  isRefreshing,
  isBulkDeleting,
  onFilterChange,
  onViewModeChange,
  onToggleSelectAll,
  onCancelSelection,
  onBulkDelete,
  onSyncNow,
  onRefresh,
  enquiryType,
  onEnquiryTypeChange,
  searchQuery,
  onSearchChange,
}: InboxToolbarProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Row 1: Select All, Status Tabs, Search, Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Left side: Select + Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Select All */}
          {totalCount > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as unknown as HTMLInputElement).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all"
              />
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                {selectedCount > 0 ? `${selectedCount}` : null}
                <span className="hidden sm:inline">
                  {selectedCount > 0 ? " selected" : "Select all"}
                </span>
              </span>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("pending")}
              className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
            >
              Pending
            </Button>
            <Button
              variant={filter === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("sent")}
              className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
            >
              Sent
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("all")}
              className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
            >
              All
            </Button>
          </div>
        </div>

        {/* Right side: Search + Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search Input - full width on mobile */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-48 pl-7 sm:pl-9 h-8 sm:h-9 text-sm"
            />
          </div>

          {/* Sync & Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="h-8 px-2 sm:px-3"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Sync Gmail</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Row 2: Enquiry Type Tabs, View Toggle, Bulk Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Enquiry Type Tabs - scrollable on mobile */}
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
          {ENQUIRY_FILTERS.map((type) => (
            <Button
              key={type.id}
              variant={enquiryType === type.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onEnquiryTypeChange(type.id)}
              className={cn(
                "h-6 px-2 text-xs sm:h-7 sm:px-2.5 whitespace-nowrap flex-shrink-0",
                enquiryType !== type.id && type.color
              )}
            >
              {type.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Bulk Delete (when selected) */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={isBulkDeleting}
                className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="ml-1">{selectedCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelSelection}
                className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-1.5 sm:h-8 sm:px-2 rounded-r-none"
              onClick={() => onViewModeChange("list")}
              title="List View"
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-1.5 sm:h-8 sm:px-2 rounded-l-none"
              onClick={() => onViewModeChange("grid")}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { StatusFilter, EnquiryTypeFilter, ViewMode };
