"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, CheckCircle } from "lucide-react";
import type { ReminderWithRelations } from "./types";

interface UpcomingTasksCardProps {
  reminders: ReminderWithRelations[];
  onCompleteReminder: (id: string) => void;
}

export function UpcomingTasksCard({
  reminders,
  onCompleteReminder,
}: UpcomingTasksCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.slice(0, 5).map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{reminder.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(reminder.dueAt), "MMM d, h:mm a")}
                    {reminder.deal && ` • ${reminder.deal.title}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-green-600"
                  onClick={() => onCompleteReminder(reminder.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Link href="/reminders">
          <Button variant="ghost" className="w-full mt-4">
            View All Tasks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
