"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { PRIORITIES } from "@/lib/constants/pipeline";
import type { Reminder, Deal, Contact } from "@/lib/db/schema";

type ReminderWithRelations = Reminder & {
  deal: (Deal & { contact: Contact | null }) | null;
  contact: Contact | null;
};

interface ReminderCardProps {
  reminder: ReminderWithRelations;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function getPriorityColor(priority: string) {
  const p = PRIORITIES.find((pr) => pr.id === priority);
  return p?.color || "bg-gray-100 text-gray-700";
}

export function ReminderCard({ reminder, onComplete, onDelete }: ReminderCardProps) {
  return (
    <Card className={reminder.isCompleted ? "opacity-60" : ""}>
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
            onClick={() => !reminder.isCompleted && onComplete(reminder.id)}
            disabled={reminder.isCompleted ?? false}
          >
            <CheckCircle className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`font-medium ${reminder.isCompleted ? "line-through" : ""}`}>
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
                onClick={() => onDelete(reminder.id)}
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
                className={getPriorityColor(reminder.priority || "medium")}
              >
                {reminder.priority}
              </Badge>
              {reminder.deal && (
                <span className="truncate">Deal: {reminder.deal.title}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
