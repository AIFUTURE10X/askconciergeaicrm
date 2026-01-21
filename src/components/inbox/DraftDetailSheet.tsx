"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Send, Save, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { DRAFT_STATUSES } from "@/lib/constants/email-drafts";
import type { DraftWithRelations } from "./DraftCard";
import { OriginalEmailSection } from "./OriginalEmailSection";
import { RegenerateSection } from "./RegenerateSection";

interface DraftDetailSheetProps {
  draft: DraftWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: { draftSubject: string; draftBody: string }) => Promise<void>;
  onSend: (id: string) => Promise<void>;
  onRegenerate: (id: string, tone: string, feedback?: string) => Promise<void>;
}

export function DraftDetailSheet({
  draft,
  open,
  onOpenChange,
  onSave,
  onSend,
  onRegenerate,
}: DraftDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  if (!draft) return null;

  const status = DRAFT_STATUSES.find((s) => s.id === draft.status);
  const isPending = draft.status === "pending";

  const handleEdit = () => {
    setEditedSubject(draft.draftSubject || "");
    setEditedBody(draft.draftBody);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft.id, {
        draftSubject: editedSubject,
        draftBody: editedBody,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(draft.id);
      onOpenChange(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[500px] md:w-[600px] overflow-y-auto px-3 sm:px-4 py-3">
        <SheetHeader className="pb-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-1.5 text-sm">
              <Mail className="h-3.5 w-3.5" />
              Draft Response
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-xs py-0", status?.color)}>
                {status?.label}
              </Badge>
              {draft.sentAt && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(draft.sentAt), "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-3 mt-2">
          <OriginalEmailSection draft={draft} />

          {/* Draft Response Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                Response
              </h3>
              {isPending && !isEditing && (
                <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Input
                  id="subject"
                  placeholder="Subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="h-7 text-sm"
                />
                <Textarea
                  id="body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={8}
                  className="resize-none text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7" onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    <Save className="mr-1 h-3 w-3" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="h-7" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-background border rounded p-2.5 space-y-1">
                <div className="font-medium text-sm">
                  {draft.draftSubject || "(No subject)"}
                </div>
                <div className="text-sm whitespace-pre-wrap">{draft.draftBody}</div>
              </div>
            )}
          </div>

          {/* Regenerate + Send Row */}
          {isPending && !isEditing && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <RegenerateSection
                draftId={draft.id}
                currentTone={draft.tone}
                onRegenerate={onRegenerate}
              />
              <Button
                onClick={handleSend}
                disabled={isSending}
                size="sm"
                className="h-7 bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3 w-3" />
                )}
                Send
              </Button>
            </div>
          )}

          {/* Error Message */}
          {draft.errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded p-2 text-xs">
              <strong>Error:</strong> {draft.errorMessage}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
