"use client";

import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Building2, ExternalLink, Send, Briefcase, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnquiryTypeConfig } from "@/app/api/webhooks/inbound/constants";
import type { DraftWithRelations } from "./DraftCard";

interface OriginalEmailSectionProps {
  draft: DraftWithRelations;
}

// Stage labels for pipeline stages
const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  demo_scheduled: "Demo Scheduled",
  proposal: "Proposal",
  negotiation: "Negotiation",
};

const getStageLabel = (stage: string) => STAGE_LABELS[stage] || stage;

export function OriginalEmailSection({ draft }: OriginalEmailSectionProps) {
  // Check if this is an outreach email (no original email context)
  // Outreach emails have no originalSubject, no originalBody, and no gmailThreadId
  const isOutreach = !draft.originalSubject && !draft.originalBody && !draft.gmailThreadId;

  if (isOutreach) {
    // Show recipient info for outreach emails
    return (
      <>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            <Send className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Sending To
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">To:</span>
              <span>
                {draft.originalFromName || draft.originalFromEmail}
                {draft.originalFromName && (
                  <span className="text-muted-foreground ml-1">
                    &lt;{draft.originalFromEmail}&gt;
                  </span>
                )}
              </span>
            </div>
            {draft.deal && (
              <>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{draft.deal.title}</span>
                  {draft.deal.enquiryType && getEnquiryTypeConfig(draft.deal.enquiryType) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-1.5 py-0 ml-1",
                        getEnquiryTypeConfig(draft.deal.enquiryType)!.color
                      )}
                    >
                      {getEnquiryTypeConfig(draft.deal.enquiryType)!.label}
                    </Badge>
                  )}
                  {draft.deal.stage && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                      {getStageLabel(draft.deal.stage)}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Original Inquiry Context */}
        {draft.deal?.notes && (
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Original Inquiry
            </h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm whitespace-pre-wrap">
                {draft.deal.notes}
              </p>
            </div>
          </div>
        )}

        {/* Next Step */}
        {draft.deal?.nextStep && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Next Step:</span>
            <span className="text-muted-foreground">{draft.deal.nextStep}</span>
          </div>
        )}

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

  // Show original email info for reply emails
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
