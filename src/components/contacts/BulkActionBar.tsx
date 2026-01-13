"use client";

import { useState } from "react";
import { Tag, Trash2, X } from "lucide-react";
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
import { BulkTagSelector } from "./TagSelector";
import type { Tag as TagType } from "@/lib/db/schema";

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  tags?: TagType[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkActionBar({
  selectedCount,
  selectedIds,
  tags = [],
  onClearSelection,
  onRefresh,
}: BulkActionBarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplyingTags, setIsApplyingTags] = useState(false);

  const handleApplyTags = async (
    tagIds: string[],
    action: "add" | "remove"
  ) => {
    setIsApplyingTags(true);
    try {
      const response = await fetch("/api/contacts/bulk-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: selectedIds,
          tagIds,
          action,
        }),
      });

      if (!response.ok) throw new Error("Failed to update tags");

      toast.success(
        `Tags ${action === "add" ? "added to" : "removed from"} ${selectedCount} contact${selectedCount !== 1 ? "s" : ""}`
      );
      onRefresh();
      onClearSelection();
    } catch {
      toast.error("Failed to update tags");
    } finally {
      setIsApplyingTags(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/contacts/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedIds }),
      });

      if (!response.ok) throw new Error("Failed to delete contacts");

      toast.success(
        `Deleted ${selectedCount} contact${selectedCount !== 1 ? "s" : ""}`
      );
      onRefresh();
      onClearSelection();
    } catch {
      toast.error("Failed to delete contacts");
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
          {selectedCount} contact{selectedCount !== 1 ? "s" : ""} selected
        </span>

        <div className="flex items-center gap-2">
          <BulkTagSelector
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={isApplyingTags}
                className="gap-1.5"
              >
                <Tag className="h-3.5 w-3.5" />
                {isApplyingTags ? "Applying..." : "Tags"}
              </Button>
            }
            tags={tags}
            onApplyTags={handleApplyTags}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-6 w-6 ml-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contacts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} contact
              {selectedCount !== 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
