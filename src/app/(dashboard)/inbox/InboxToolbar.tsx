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
    <div className="space-y-3">
      {/* Row 1: Select All, Status Tabs, Search, Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Select All */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-muted-foreground">
                {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
              </span>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1">
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("sent")}
            >
              Sent
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("all")}
            >
              All
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 pl-9 h-9"
            />
          </div>

          {/* Sync & Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncNow}
            disabled={isSyncing}
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
      <div className="flex items-center justify-between">
        {/* Enquiry Type Tabs */}
        <div className="flex items-center gap-1">
          {ENQUIRY_FILTERS.map((type) => (
            <Button
              key={type.id}
              variant={enquiryType === type.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onEnquiryTypeChange(type.id)}
              className={cn(
                "h-7 text-xs",
                enquiryType !== type.id && type.color
              )}
            >
              {type.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Delete (when selected) */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Delete {selectedCount}
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelSelection}>
                Cancel
              </Button>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}

export type { StatusFilter, EnquiryTypeFilter, ViewMode };
