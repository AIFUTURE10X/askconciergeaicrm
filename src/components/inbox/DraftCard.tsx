"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, User, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DRAFT_STATUSES, DRAFT_TONES } from "@/lib/constants/email-drafts";
import type { EmailDraft, Contact, Deal } from "@/lib/db/schema";

export type DraftWithRelations = EmailDraft & {
  contact: Contact | null;
  deal: Deal | null;
};

interface DraftCardProps {
  draft: DraftWithRelations;
  onSelect: (draft: DraftWithRelations) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function DraftCard({
  draft,
  onSelect,
  onDelete,
  isDeleting,
  isSelected,
  onToggleSelect,
}: DraftCardProps) {
  const status = DRAFT_STATUSES.find((s) => s.id === draft.status);
  const tone = DRAFT_TONES.find((t) => t.id === draft.tone);
  const isPending = draft.status === "pending";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
      onClick={() => onSelect(draft)}
    >
      <CardContent className="p-2.5 flex flex-col flex-1">
        {/* Header: Checkbox + Icon + Name */}
        <div className="flex items-center gap-2 mb-1.5">
          {onToggleSelect && (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(draft.id)}
                aria-label={`Select ${draft.originalFromName || draft.originalFromEmail}`}
              />
            </div>
          )}
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs truncate">
              {draft.originalFromName || draft.originalFromEmail}
            </p>
          </div>
        </div>

        {/* Subject */}
        <p className="text-xs font-medium truncate mb-1">
          {draft.originalSubject || "(No subject)"}
        </p>

        {/* Draft Preview */}
        <p className="text-[11px] text-muted-foreground line-clamp-2 flex-1 mb-1.5">
          {draft.draftBody.substring(0, 80)}...
        </p>

        {/* Badges */}
        <div className="flex items-center gap-1 mb-1.5 flex-wrap">
          <Badge variant="secondary" className={`text-[10px] px-1 py-0 ${status?.color}`}>
            {status?.label}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {tone?.label}
          </Badge>
        </div>

        {/* Meta: Date + Contact */}
        <div className="text-[10px] text-muted-foreground space-y-0.5 mb-1.5">
          {draft.originalReceivedAt && (
            <p>{format(new Date(draft.originalReceivedAt), "MMM d")}</p>
          )}
          {draft.contact && (
            <p className="flex items-center gap-1 truncate">
              <User className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{draft.contact.name}</span>
            </p>
          )}
        </div>

        {/* Delete Action */}
        {isPending && (
          <div
            className="flex items-center justify-end pt-1.5 border-t"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(draft.id)}
              disabled={isDeleting}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
