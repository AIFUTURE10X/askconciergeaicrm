"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TAG_COLORS, getTagColor } from "@/lib/constants/tags";
import { TagBadge } from "./TagBadge";
import type { Tag } from "@/lib/db/schema";

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags?: Tag[];
  onTagsChange: () => void;
}

export function TagManager({
  open,
  onOpenChange,
  tags = [],
  onTagsChange,
}: TagManagerProps) {
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("gray");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: selectedColor }),
      });

      if (!response.ok) throw new Error("Failed to create tag");

      toast.success("Tag created");
      setNewTagName("");
      setSelectedColor("gray");
      onTagsChange();
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setDeletingId(tagId);
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete tag");

      toast.success("Tag deleted");
      onTagsChange();
    } catch {
      toast.error("Failed to delete tag");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new tag */}
          <div className="space-y-3">
            <Label>Create New Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                className="flex-1"
              />
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isCreating}
                size="sm"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>

            {/* Color picker */}
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color.id)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-transform",
                    color.bg,
                    selectedColor === color.id
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  title={color.label}
                />
              ))}
            </div>

            {/* Preview */}
            {newTagName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Preview:</span>
                <TagBadge
                  tag={{
                    id: "preview",
                    name: newTagName,
                    color: selectedColor,
                    createdAt: new Date(),
                  }}
                  size="md"
                />
              </div>
            )}
          </div>

          {/* Existing tags */}
          <div className="space-y-2">
            <Label>Existing Tags ({tags.length})</Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tags yet. Create your first tag above.
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <TagBadge tag={tag} size="md" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={deletingId === tag.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
