"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download, Trash2, LayoutGrid, List } from "lucide-react";

interface PipelineToolbarProps {
  activeDealsCount: number;
  selectionMode: boolean;
  selectedCount: number;
  isDeleting: boolean;
  viewMode: "board" | "list";
  isMobile: boolean;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onViewModeChange: (mode: "board" | "list") => void;
  onExport: () => void;
}

export function PipelineToolbar({
  activeDealsCount, selectionMode, selectedCount, isDeleting,
  viewMode, isMobile, onToggleSelectionMode, onSelectAll,
  onBulkDelete, onViewModeChange, onExport,
}: PipelineToolbarProps) {
  return (
    <div className="px-3 sm:px-6 pt-2 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {activeDealsCount > 0 && (
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            className="touch-manipulation"
          >
            {selectionMode ? "Cancel" : "Select"}
          </Button>
        )}
        {selectionMode && (
          <>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCount === activeDealsCount && activeDealsCount > 0}
                onCheckedChange={onSelectAll}
              />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {selectedCount}/{activeDealsCount}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={selectedCount === 0 || isDeleting}
              className="touch-manipulation"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Delete </span>({selectedCount})
            </Button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isMobile && (
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none px-2.5"
              onClick={() => onViewModeChange("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none px-2.5"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
        {activeDealsCount > 0 && !selectionMode && (
          <Button variant="outline" size="sm" onClick={onExport} className="touch-manipulation">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        )}
      </div>
    </div>
  );
}
