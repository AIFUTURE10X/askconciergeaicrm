"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, Mail, LayoutGrid, List, Trash2 } from "lucide-react";

type StatusFilter = "pending" | "sent" | "all";
type ViewMode = "grid" | "list";

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
}: InboxToolbarProps) {
  return (
    <div className="flex items-center justify-between">
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
            {selectedCount > 0 && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBulkDelete}
                  disabled={isBulkDeleting}
                  className="ml-1"
                >
                  {isBulkDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancelSelection}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
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
          <span className="ml-2">Sync Gmail</span>
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
          <span className="ml-2">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
