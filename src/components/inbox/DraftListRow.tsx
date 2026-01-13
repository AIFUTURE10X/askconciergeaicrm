"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DRAFT_STATUSES } from "@/lib/constants/email-drafts";
import { getEnquiryTypeConfig } from "@/app/api/webhooks/inbound/constants";
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
      className="cursor-pointer hover:bg-muted/50 transition-colors px-2 py-1.5"
      onClick={() => onSelect(draft)}
    >
      {/* Row 1: Checkbox + Name + Enquiry Badge */}
      <div className="flex items-center gap-1.5 mb-0.5">
        {onToggleSelect && (
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(draft.id)}
              aria-label={`Select ${draft.originalFromName || draft.originalFromEmail}`}
              className="h-3 w-3"
            />
          </div>
        )}
        <span className="text-xs font-medium truncate">
          {draft.originalFromName || draft.originalFromEmail?.split("@")[0]}
        </span>
        {draft.deal?.enquiryType && getEnquiryTypeConfig(draft.deal.enquiryType) && (
          <Badge
            variant="outline"
            className={cn(
              "text-[8px] px-1 py-0 shrink-0 ml-auto",
              getEnquiryTypeConfig(draft.deal.enquiryType)!.color
            )}
          >
            {getEnquiryTypeConfig(draft.deal.enquiryType)!.label}
          </Badge>
        )}
      </div>

      {/* Row 2: Inquiry (what they want) - 2 lines */}
      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-0.5">
        {draft.deal?.notes || draft.originalSubject || draft.draftSubject || "(No subject)"}
      </p>

      {/* Row 3: Status + Delete */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={`text-[8px] px-1 py-0 ${status?.color}`}>
          {status?.label}
        </Badge>
        {isPending && (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-destructive hover:text-destructive"
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
