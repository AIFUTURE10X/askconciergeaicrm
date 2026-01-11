"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_TYPES } from "@/lib/constants/pipeline";
import {
  Loader2,
  Phone,
  Mail,
  Presentation,
  Users,
  Linkedin,
  StickyNote,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Phone,
  Mail,
  Presentation,
  Users,
  Linkedin,
  StickyNote,
};

interface ActivityLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
  contactId?: string;
  onSubmit: (data: {
    type: string;
    subject?: string;
    description?: string;
    outcome?: string;
  }) => Promise<void>;
}

const OUTCOMES = [
  { id: "completed", label: "Completed" },
  { id: "no_answer", label: "No Answer" },
  { id: "voicemail", label: "Left Voicemail" },
  { id: "scheduled_followup", label: "Scheduled Follow-up" },
  { id: "interested", label: "Interested" },
  { id: "not_interested", label: "Not Interested" },
];

export function ActivityLogDialog({
  open,
  onOpenChange,
  dealId,
  contactId,
  onSubmit,
}: ActivityLogDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    description: "",
    outcome: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: formData.type,
        subject: formData.subject || undefined,
        description: formData.description || undefined,
        outcome: formData.outcome || undefined,
      });
      setFormData({ type: "", subject: "", description: "", outcome: "" });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = ACTIVITY_TYPES.find((t) => t.id === formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type Selection */}
          <div className="space-y-2">
            <Label>Activity Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = iconMap[type.icon] || StickyNote;
                const isSelected = formData.type === type.id;
                return (
                  <Button
                    key={type.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder={
                formData.type === "call"
                  ? "e.g., Initial discovery call"
                  : formData.type === "email"
                  ? "e.g., Sent pricing proposal"
                  : formData.type === "demo"
                  ? "e.g., Product demo for team"
                  : "Brief description"
              }
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
            />
          </div>

          {/* Outcome (for calls and meetings) */}
          {(formData.type === "call" ||
            formData.type === "meeting" ||
            formData.type === "demo") && (
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Select
                value={formData.outcome}
                onValueChange={(value) =>
                  setFormData({ ...formData, outcome: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="What happened?" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((outcome) => (
                    <SelectItem key={outcome.id} value={outcome.id}>
                      {outcome.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              placeholder="What was discussed? Any key takeaways?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.type}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Log Activity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
