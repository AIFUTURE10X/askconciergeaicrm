"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, User, Building2, Send, RefreshCw, Trash2 } from "lucide-react";
import { DRAFT_STATUSES, DRAFT_TONES } from "@/lib/constants/email-drafts";
import type { EmailDraft, Contact, Deal } from "@/lib/db/schema";

export type DraftWithRelations = EmailDraft & {
  contact: Contact | null;
  deal: Deal | null;
};

interface DraftCardProps {
  draft: DraftWithRelations;
  onSelect: (draft: DraftWithRelations) => void;
  onSend: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  isSending?: boolean;
}

export function DraftCard({
  draft,
  onSelect,
  onSend,
  onRegenerate,
  onDelete,
  isDeleting,
  isSending,
}: DraftCardProps) {
  const status = DRAFT_STATUSES.find((s) => s.id === draft.status);
  const tone = DRAFT_TONES.find((t) => t.id === draft.tone);
  const isPending = draft.status === "pending";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(draft)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* From / Subject */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {draft.originalFromName || draft.originalFromEmail}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {draft.originalSubject || "(No subject)"}
                </p>
              </div>
            </div>

            {/* Draft Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 pl-13">
              {draft.draftBody.substring(0, 150)}...
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-3 pl-13 text-xs text-muted-foreground flex-wrap">
              {draft.originalReceivedAt && (
                <span>
                  {format(new Date(draft.originalReceivedAt), "MMM d, h:mm a")}
                </span>
              )}
              {draft.contact && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">
                    {draft.contact.name}
                  </span>
                </div>
              )}
              {draft.contact?.company && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">
                    {draft.contact.company}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Status + Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={status?.color}>
                {status?.label}
              </Badge>
              <Badge variant="outline">{tone?.label}</Badge>
            </div>

            {isPending && (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRegenerate(draft.id)}
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700"
                  onClick={() => onSend(draft.id)}
                  disabled={isSending}
                  title="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(draft.id)}
                  disabled={isDeleting}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
