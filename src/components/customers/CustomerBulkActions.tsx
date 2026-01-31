"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomerBulkActionsProps {
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function CustomerBulkActions({
  selectedCount,
  selectedIds,
  onClearSelection,
  onRefresh,
}: CustomerBulkActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/customers/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationIds: selectedIds }),
      });

      if (!response.ok) throw new Error("Failed to delete organizations");

      const data = await response.json();
      toast.success(
        `Deleted ${data.deletedCount} organization${data.deletedCount !== 1 ? "s" : ""}`
      );
      onRefresh();
      onClearSelection();
    } catch {
      toast.error("Failed to delete organizations");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
        <span className="text-sm font-medium">
          {selectedCount} organization{selectedCount !== 1 ? "s" : ""} selected
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Selected
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-6 w-6 ml-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} organization{selectedCount !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected organizations and ALL
              their data including properties, units, FAQs, chat sessions, AI
              usage, and team members. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
