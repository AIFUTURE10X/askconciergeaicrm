"use client";

import { useState, useEffect } from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  Bell,
  CheckCircle,
  Calendar,
  Clock,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { PRIORITIES } from "@/lib/constants/pipeline";
import type { Reminder, Deal, Contact } from "@/lib/db/schema";

type ReminderWithRelations = Reminder & {
  deal: (Deal & { contact: Contact | null }) | null;
  contact: Contact | null;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithRelations[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueAt: "",
    dueTime: "09:00",
    priority: "medium",
    dealId: "",
    contactId: "",
  });

  useEffect(() => {
    fetchData();
  }, [showCompleted]);

  async function fetchData() {
    try {
      const [remindersRes, dealsRes, contactsRes] = await Promise.all([
        fetch(`/api/reminders?showCompleted=${showCompleted}`),
        fetch("/api/deals"),
        fetch("/api/contacts"),
      ]);

      if (remindersRes.ok) {
        const { reminders: data } = await remindersRes.json();
        setReminders(data);
      }
      if (dealsRes.ok) {
        const { deals: data } = await dealsRes.json();
        setDeals(data);
      }
      if (contactsRes.ok) {
        const { contacts: data } = await contactsRes.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: true }),
      });

      if (res.ok) {
        setReminders((prev) =>
          showCompleted
            ? prev.map((r) =>
                r.id === id ? { ...r, isCompleted: true, completedAt: new Date() } : r
              )
            : prev.filter((r) => r.id !== id)
        );
        toast.success("Task completed");
      }
    } catch (error) {
      toast.error("Failed to complete task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        toast.success("Reminder deleted");
      }
    } catch (error) {
      toast.error("Failed to delete reminder");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueAt) return;

    setIsSubmitting(true);
    try {
      const dueDateTime = new Date(`${formData.dueAt}T${formData.dueTime}`);

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          dueAt: dueDateTime.toISOString(),
          priority: formData.priority,
          dealId: formData.dealId || undefined,
          contactId: formData.contactId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create reminder");

      const { reminder } = await res.json();
      setReminders((prev) => [reminder, ...prev].sort((a, b) =>
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      ));
      setFormData({
        title: "",
        description: "",
        dueAt: "",
        dueTime: "09:00",
        priority: "medium",
        dealId: "",
        contactId: "",
      });
      setIsAddDialogOpen(false);
      toast.success("Reminder created");
    } catch (error) {
      toast.error("Failed to create reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  const getPriorityColor = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.id === priority);
    return p?.color || "bg-gray-100 text-gray-700";
  };

  // Group reminders by date
  const groupedReminders = reminders.reduce(
    (groups, reminder) => {
      const dateKey = format(new Date(reminder.dueAt), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(reminder);
      return groups;
    },
    {} as Record<string, ReminderWithRelations[]>
  );

  const sortedDates = Object.keys(groupedReminders).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Reminders"
        description={`${reminders.filter((r) => !r.isCompleted).length} pending tasks`}
        action={{
          label: "Add Reminder",
          onClick: () => setIsAddDialogOpen(true),
        }}
      />

      <div className="p-6 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Button
            variant={showCompleted ? "outline" : "default"}
            size="sm"
            onClick={() => setShowCompleted(false)}
          >
            Pending
          </Button>
          <Button
            variant={showCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCompleted(true)}
          >
            All
          </Button>
        </div>

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No reminders</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Add reminders to keep track of follow-ups and tasks
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const date = new Date(dateKey);
              const dateReminders = groupedReminders[dateKey];
              const isOverdue = isPast(date) && !isToday(date);

              return (
                <div key={dateKey}>
                  <h3
                    className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                      isOverdue ? "text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    {isOverdue && <AlertCircle className="h-4 w-4" />}
                    {getDateLabel(date)}
                  </h3>
                  <div className="space-y-2">
                    {dateReminders.map((reminder) => (
                      <Card
                        key={reminder.id}
                        className={reminder.isCompleted ? "opacity-60" : ""}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 mt-0.5 ${
                                reminder.isCompleted
                                  ? "text-green-600"
                                  : "text-muted-foreground hover:text-green-600"
                              }`}
                              onClick={() =>
                                !reminder.isCompleted &&
                                handleComplete(reminder.id)
                              }
                              disabled={reminder.isCompleted ?? false}
                            >
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p
                                    className={`font-medium ${
                                      reminder.isCompleted
                                        ? "line-through"
                                        : ""
                                    }`}
                                  >
                                    {reminder.title}
                                  </p>
                                  {reminder.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {reminder.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDelete(reminder.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(reminder.dueAt), "h:mm a")}
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={getPriorityColor(
                                    reminder.priority || "medium"
                                  )}
                                >
                                  {reminder.priority}
                                </Badge>
                                {reminder.deal && (
                                  <span className="truncate">
                                    Deal: {reminder.deal.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Follow up with John"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueAt}
                  onChange={(e) =>
                    setFormData({ ...formData, dueAt: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueTime">Time</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) =>
                    setFormData({ ...formData, dueTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
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
              <Label htmlFor="deal">Link to Deal</Label>
              <Select
                value={formData.dealId}
                onValueChange={(value) =>
                  setFormData({ ...formData, dealId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                placeholder="Any additional details..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.dueAt}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Reminder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
