"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTagColor } from "@/lib/constants/tags";
import type { Tag } from "@/lib/db/schema";

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function TagBadge({
  tag,
  onRemove,
  size = "sm",
  className,
}: TagBadgeProps) {
  const color = getTagColor(tag.color);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        color.bg,
        color.text,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "rounded-full hover:bg-black/10 dark:hover:bg-white/10",
            size === "sm" ? "p-0.5" : "p-0.5"
          )}
        >
          <X className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
      )}
    </span>
  );
}
