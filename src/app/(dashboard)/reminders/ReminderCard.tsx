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
  onClick: (reminder: ReminderWithRelations) => void;
}

function getPriorityColor(priority: string) {
  const p = PRIORITIES.find((pr) => pr.id === priority);
  return p?.color || "bg-gray-100 text-gray-700";
}

export function ReminderCard({ reminder, onComplete, onDelete, onClick }: ReminderCardProps) {
  return (
    <Card
      className={`cursor-pointer hover:bg-muted/50 transition-colors ${reminder.isCompleted ? "opacity-60" : ""}`}
      onClick={() => onClick(reminder)}
    >
      <CardContent className="p-2">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 flex-shrink-0 ${
              reminder.isCompleted
                ? "text-green-600"
                : "text-muted-foreground hover:text-green-600"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!reminder.isCompleted) onComplete(reminder.id);
            }}
            disabled={reminder.isCompleted ?? false}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium truncate ${reminder.isCompleted ? "line-through" : ""}`}>
              {reminder.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {format(new Date(reminder.dueAt), "h:mm a")}
              </span>
              <Badge
                variant="secondary"
                className={`text-[9px] px-1 py-0 ${getPriorityColor(reminder.priority || "medium")}`}
              >
                {reminder.priority}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(reminder.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
