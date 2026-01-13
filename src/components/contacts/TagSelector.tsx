"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TagBadge } from "./TagBadge";
import type { Tag } from "@/lib/db/schema";

interface TagSelectorProps {
  trigger: React.ReactNode;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  tags: Tag[];
  align?: "start" | "center" | "end";
}

export function TagSelector({
  trigger,
  selectedTagIds,
  onTagsChange,
  tags,
  align = "start",
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align={align}>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tags created yet
          </p>
        ) : (
          <div className="space-y-1">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                    isSelected
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <TagBadge tag={tag} size="md" />
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface BulkTagSelectorProps {
  trigger: React.ReactNode;
  tags: Tag[];
  onApplyTags: (tagIds: string[], action: "add" | "remove") => void;
  align?: "start" | "center" | "end";
}

export function BulkTagSelector({
  trigger,
  tags,
  onApplyTags,
  align = "start",
}: BulkTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [action, setAction] = useState<"add" | "remove">("add");

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleApply = () => {
    if (selectedTagIds.length > 0) {
      onApplyTags(selectedTagIds, action);
      setSelectedTagIds([]);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-64 p-3" align={align}>
        <div className="space-y-3">
          {/* Action toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-md">
            <button
              type="button"
              onClick={() => setAction("add")}
              className={cn(
                "flex-1 px-3 py-1 text-sm rounded transition-colors",
                action === "add"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              Add Tags
            </button>
            <button
              type="button"
              onClick={() => setAction("remove")}
              className={cn(
                "flex-1 px-3 py-1 text-sm rounded transition-colors",
                action === "remove"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              Remove Tags
            </button>
          </div>

          {/* Tag list */}
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tags created yet
            </p>
          ) : (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 dark:bg-primary/20"
                        : "hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <TagBadge tag={tag} size="md" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Apply button */}
          <Button
            onClick={handleApply}
            disabled={selectedTagIds.length === 0}
            size="sm"
            className="w-full"
          >
            {action === "add" ? "Add" : "Remove"} {selectedTagIds.length} tag
            {selectedTagIds.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
