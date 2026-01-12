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
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto pl-8">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Draft Response
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className={status?.color}>
              {status?.label}
            </Badge>
            {draft.sentAt && (
              <span className="text-sm text-muted-foreground">
                Sent: {format(new Date(draft.sentAt), "MMM d, h:mm a")}
              </span>
            )}
          </div>

          <OriginalEmailSection draft={draft} />

          <Separator />

          {/* Draft Response Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Draft Response
              </h3>
              {isPending && !isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={12}
                    className="resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-background border rounded-lg p-4 space-y-2">
                <div className="font-medium">
                  {draft.draftSubject || "(No subject)"}
                </div>
                <div className="text-sm whitespace-pre-wrap">{draft.draftBody}</div>
              </div>
            )}
          </div>

          {/* Regenerate Section */}
          {isPending && !isEditing && (
            <RegenerateSection
              draftId={draft.id}
              currentTone={draft.tone}
              onRegenerate={onRegenerate}
            />
          )}

          {/* Send Button */}
          {isPending && !isEditing && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Email
                </Button>
              </div>
            </>
          )}

          {/* Error Message */}
          {draft.errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-4 text-sm">
              <strong>Error:</strong> {draft.errorMessage}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
