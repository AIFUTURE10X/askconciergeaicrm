"use client";

import { useState, useEffect } from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AddReminderDialog } from "./AddReminderDialog";
import { EditReminderDialog } from "./EditReminderDialog";
import { ReminderCard } from "./ReminderCard";
import { RemindersEmptyState } from "./RemindersEmptyState";
import type { Reminder, Deal, Contact } from "@/lib/db/schema";

type ReminderWithRelations = Reminder & {
  deal: (Deal & { contact: Contact | null }) | null;
  contact: Contact | null;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithRelations[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderWithRelations | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [showCompleted]);

  async function fetchData() {
    try {
      const [remindersRes, dealsRes] = await Promise.all([
        fetch(`/api/reminders?showCompleted=${showCompleted}`),
        fetch("/api/deals"),
      ]);

      if (remindersRes.ok) {
        const { reminders: data } = await remindersRes.json();
        setReminders(data);
      }
      if (dealsRes.ok) {
        const { deals: data } = await dealsRes.json();
        setDeals(data);
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
    } catch {
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
    } catch {
      toast.error("Failed to delete reminder");
    }
  };

  const handleSubmit = async (data: {
    title: string;
    description?: string;
    dueAt: string;
    priority: string;
    dealId?: string;
    contactId?: string;
  }) => {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create reminder");

    const { reminder } = await res.json();
    setReminders((prev) =>
      [reminder, ...prev].sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      )
    );
    toast.success("Reminder created");
  };

  const handleUpdate = async (id: string, data: {
    title: string;
    description?: string;
    dueAt: string;
    priority: string;
    dealId?: string;
  }) => {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update reminder");

    const { reminder } = await res.json();
    setReminders((prev) =>
      prev
        .map((r) => (r.id === id ? { ...r, ...reminder } : r))
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    );
    toast.success("Reminder updated");
  };

  const handleReminderClick = (reminder: ReminderWithRelations) => {
    setSelectedReminder(reminder);
    setIsEditDialogOpen(true);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  // Group reminders by date
  const groupedReminders = reminders.reduce(
    (groups, reminder) => {
      const dateKey = format(new Date(reminder.dueAt), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
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
        action={{ label: "Add Reminder", onClick: () => setIsAddDialogOpen(true) }}
      />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
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

        {reminders.length === 0 ? (
          <RemindersEmptyState onAddClick={() => setIsAddDialogOpen(true)} />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                    {dateReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                        onClick={handleReminderClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddReminderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        deals={deals}
        onSubmit={handleSubmit}
      />

      <EditReminderDialog
        reminder={selectedReminder}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        deals={deals}
        onSave={handleUpdate}
      />
    </>
  );
}
