"use client";

import { cn } from "@/lib/utils";
import { getHealthCategoryInfo } from "@/lib/admin/health-constants";

interface Props {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function HealthBadge({ score, showLabel = false, size = "sm" }: Props) {
  const info = getHealthCategoryInfo(score);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "rounded-full",
          info.dotColor,
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
        )}
      />
      <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
        {score}
      </span>
      {showLabel && (
        <span className={cn("text-xs rounded-full px-1.5 py-0.5", info.color)}>
          {info.label}
        </span>
      )}
    </div>
  );
}
