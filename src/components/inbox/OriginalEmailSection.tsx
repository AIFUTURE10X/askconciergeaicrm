"use client";

import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Send, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnquiryTypeConfig } from "@/app/api/webhooks/inbound/constants";
import type { DraftWithRelations } from "./DraftCard";

interface OriginalEmailSectionProps {
  draft: DraftWithRelations;
}

interface ResizableContentProps {
  children: React.ReactNode;
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
  className?: string;
}

function ResizableContent({
  children,
  minHeight = 60,
  maxHeight = 400,
  defaultHeight = 100,
  className,
}: ResizableContentProps) {
  const [height, setHeight] = useState(defaultHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.clientY - startY.current;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight.current + deltaY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [height, minHeight, maxHeight]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={cn("overflow-y-auto", className)}
        style={{ height: `${height}px` }}
      >
        {children}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-7 flex items-center justify-center cursor-ns-resize hover:bg-accent/50 transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <div className="bg-muted border border-border shadow-sm group-hover:bg-accent group-hover:border-primary/50 rounded-full px-5 py-1 transition-all">
          <GripHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

export function OriginalEmailSection({ draft }: OriginalEmailSectionProps) {
  // Check if this is an outreach email (no original email context)
  // Outreach emails have no originalSubject, no originalBody, and no gmailThreadId
  const isOutreach = !draft.originalSubject && !draft.originalBody && !draft.gmailThreadId;

  if (isOutreach) {
    // Show recipient info for outreach emails
    const inquiryContext = draft.deal?.notes || draft.deal?.painPoint || draft.contact?.notes;

    return (
      <div className="space-y-2">
        {/* Recipient */}
        <div className="bg-muted/50 rounded p-2.5 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Send className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{draft.originalFromName || draft.originalFromEmail}</span>
              {draft.originalFromName && (
                <span className="text-xs text-muted-foreground">&lt;{draft.originalFromEmail}&gt;</span>
              )}
            </div>
            {draft.deal && (
              <div className="flex items-center gap-2">
                {draft.deal.enquiryType && getEnquiryTypeConfig(draft.deal.enquiryType) && (
                  <Badge variant="outline" className={cn("text-[10px] px-1 py-0", getEnquiryTypeConfig(draft.deal.enquiryType)!.color)}>
                    {getEnquiryTypeConfig(draft.deal.enquiryType)!.label}
                  </Badge>
                )}
                <a href={`/pipeline?deal=${draft.deal.id}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  <ExternalLink className="h-2.5 w-2.5" />
                  Deal
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Original Inquiry / Context */}
        {inquiryContext ? (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original Inquiry</h4>
            <ResizableContent defaultHeight={80} minHeight={40} maxHeight={300} className="bg-muted/30 rounded p-2.5 text-sm whitespace-pre-wrap">
              {inquiryContext}
            </ResizableContent>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No original inquiry context available
          </div>
        )}
      </div>
    );
  }

  // Show original email info for reply emails - compact single box
  return (
    <div className="bg-muted/50 rounded p-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{draft.originalFromName || draft.originalFromEmail}</span>
          {draft.originalFromName && (
            <span className="text-xs text-muted-foreground">&lt;{draft.originalFromEmail}&gt;</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {draft.originalReceivedAt && (
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(draft.originalReceivedAt), "MMM d, h:mm a")}
            </span>
          )}
          {draft.deal && (
            <a href={`/pipeline?deal=${draft.deal.id}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
              <ExternalLink className="h-2.5 w-2.5" />
              Deal
            </a>
          )}
        </div>
      </div>
      <div className="text-xs font-medium">{draft.originalSubject || "(No subject)"}</div>
      <ResizableContent defaultHeight={60} minHeight={40} maxHeight={250} className="text-xs text-muted-foreground whitespace-pre-wrap border-t pt-1.5">
        {draft.originalBody}
      </ResizableContent>
    </div>
  );
}
