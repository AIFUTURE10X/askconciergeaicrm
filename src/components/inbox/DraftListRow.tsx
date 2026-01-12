"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { DRAFT_STATUSES } from "@/lib/constants/email-drafts";
import type { DraftWithRelations } from "./DraftCard";

interface DraftListRowProps {
  draft: DraftWithRelations;
  onSelect: (draft: DraftWithRelations) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function DraftListRow({
  draft,
  onSelect,
  onDelete,
  isDeleting,
  isSelected,
  onToggleSelect,
}: DraftListRowProps) {
  const status = DRAFT_STATUSES.find((s) => s.id === draft.status);
  const isPending = draft.status === "pending";

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors p-2"
      onClick={() => onSelect(draft)}
    >
      {/* Checkbox + From + Date */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onToggleSelect && (
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(draft.id)}
                aria-label={`Select ${draft.originalFromName || draft.originalFromEmail}`}
              />
            </div>
          )}
          <p className="text-xs font-medium truncate flex-1">
            {draft.originalFromName || draft.originalFromEmail?.split("@")[0]}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">
          {draft.originalReceivedAt
            ? format(new Date(draft.originalReceivedAt), "MMM d, h:mm a")
            : ""}
        </span>
      </div>

      {/* Subject */}
      <p className="text-[11px] truncate mb-1 text-muted-foreground">
        {draft.originalSubject || "(No subject)"}
      </p>

      {/* Status Badge + Actions */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${status?.color}`}>
          {status?.label}
        </Badge>

        {isPending && (
          <div
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive hover:text-destructive"
              onClick={() => onDelete(draft.id)}
              disabled={isDeleting}
              title="Delete"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
