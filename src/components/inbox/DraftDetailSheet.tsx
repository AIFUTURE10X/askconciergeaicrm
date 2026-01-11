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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  RefreshCw,
  Save,
  Loader2,
  Mail,
  Calendar,
  User,
  Building2,
  ExternalLink,
} from "lucide-react";
import { DRAFT_STATUSES, DRAFT_TONES } from "@/lib/constants/email-drafts";
import type { DraftWithRelations } from "./DraftCard";

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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [selectedTone, setSelectedTone] = useState("");
  const [feedback, setFeedback] = useState("");

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

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(draft.id, selectedTone || draft.tone, feedback);
      setFeedback("");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
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

          {/* Original Email Section */}
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
                    {isSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-background border rounded-lg p-4 space-y-2">
                <div className="font-medium">
                  {draft.draftSubject || "(No subject)"}
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {draft.draftBody}
                </div>
              </div>
            )}
          </div>

          {/* Regenerate Section */}
          {isPending && !isEditing && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Regenerate with AI
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select
                      value={selectedTone || draft.tone}
                      onValueChange={setSelectedTone}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DRAFT_TONES.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label} - {t.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Feedback (optional)</Label>
                    <Textarea
                      placeholder="e.g., Make it shorter, mention our discount..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
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
