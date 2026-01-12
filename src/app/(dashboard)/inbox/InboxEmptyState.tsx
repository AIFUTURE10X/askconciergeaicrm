import { Card, CardContent } from "@/components/ui/card";
import { Inbox as InboxIcon } from "lucide-react";

type StatusFilter = "pending" | "sent" | "all";

interface InboxEmptyStateProps {
  filter: StatusFilter;
}

export function InboxEmptyState({ filter }: InboxEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <InboxIcon className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No drafts</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          {filter === "pending"
            ? "All caught up! No pending drafts to review."
            : filter === "sent"
            ? "No emails have been sent yet."
            : "Drafts will appear here when emails are received."}
        </p>
      </CardContent>
    </Card>
  );
}
