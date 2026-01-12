import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface RemindersEmptyStateProps {
  onAddClick: () => void;
}

export function RemindersEmptyState({ onAddClick }: RemindersEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Bell className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No reminders</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Add reminders to keep track of follow-ups and tasks
        </p>
        <Button className="mt-4" onClick={onAddClick}>
          Add Reminder
        </Button>
      </CardContent>
    </Card>
  );
}
