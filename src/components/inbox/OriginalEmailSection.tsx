"use client";

import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Building2, ExternalLink } from "lucide-react";
import type { DraftWithRelations } from "./DraftCard";

interface OriginalEmailSectionProps {
  draft: DraftWithRelations;
}

export function OriginalEmailSection({ draft }: OriginalEmailSectionProps) {
  return (
    <>
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Original Email
        </h3>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">From:</span>
            <span>
              {draft.originalFromName || draft.originalFromEmail}
              {draft.originalFromName && (
                <span className="text-muted-foreground ml-1">
                  &lt;{draft.originalFromEmail}&gt;
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Subject:</span>
            <span>{draft.originalSubject || "(No subject)"}</span>
          </div>
          {draft.originalReceivedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(
                  new Date(draft.originalReceivedAt),
                  "EEEE, MMMM d, yyyy 'at' h:mm a"
                )}
              </span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
            {draft.originalBody}
          </div>
        </div>
      </div>

      {/* Contact/Deal Info */}
      {(draft.contact || draft.deal) && (
        <div className="flex flex-wrap gap-4">
          {draft.contact && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{draft.contact.name}</span>
              {draft.contact.company && (
                <>
                  <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
                  <span>{draft.contact.company}</span>
                </>
              )}
            </div>
          )}
          {draft.deal && (
            <a
              href={`/pipeline?deal=${draft.deal.id}`}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View Deal
            </a>
          )}
        </div>
      )}
    </>
  );
}
