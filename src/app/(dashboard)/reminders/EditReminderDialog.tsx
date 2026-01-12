"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PRIORITIES } from "@/lib/constants/pipeline";
import type { Reminder, Deal, Contact } from "@/lib/db/schema";

type ReminderWithRelations = Reminder & {
  deal: (Deal & { contact: Contact | null }) | null;
  contact: Contact | null;
};

interface EditReminderDialogProps {
  reminder: ReminderWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: Deal[];
  onSave: (id: string, data: {
    title: string;
    description?: string;
    dueAt: string;
    priority: string;
    dealId?: string;
  }) => Promise<void>;
}

export function EditReminderDialog({
  reminder,
  open,
  onOpenChange,
  deals,
  onSave,
}: EditReminderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueAt: "",
    dueTime: "09:00",
    priority: "medium",
    dealId: "",
  });

  // Populate form when reminder changes
  useEffect(() => {
    if (reminder) {
      const dueDate = new Date(reminder.dueAt);
      setFormData({
        title: reminder.title,
        description: reminder.description || "",
        dueAt: format(dueDate, "yyyy-MM-dd"),
        dueTime: format(dueDate, "HH:mm"),
        priority: reminder.priority || "medium",
        dealId: reminder.dealId || "",
      });
    }
  }, [reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminder || !formData.title || !formData.dueAt) return;

    setIsSubmitting(true);
    try {
      const dueDateTime = new Date(`${formData.dueAt}T${formData.dueTime}`);
      await onSave(reminder.id, {
        title: formData.title,
        description: formData.description || undefined,
        dueAt: dueDateTime.toISOString(),
        priority: formData.priority,
        dealId: formData.dealId || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reminder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Reminder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              placeholder="e.g., Follow up with John"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date *</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueAt}
                onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueTime">Time</Label>
              <Input
                id="edit-dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-deal">Link to Deal</Label>
            <Select
              value={formData.dealId || "__none__"}
              onValueChange={(value) => setFormData({ ...formData, dealId: value === "__none__" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Notes</Label>
            <Textarea
              id="edit-description"
              placeholder="Any additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title || !formData.dueAt}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
