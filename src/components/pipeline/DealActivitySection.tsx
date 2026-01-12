"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import type { Activity, Deal, Contact } from "@/lib/db/schema";

type ActivityWithRelations = Activity & {
  deal?: Deal | null;
  contact?: Contact | null;
};

interface DealActivitySectionProps {
  activities: ActivityWithRelations[];
  isLoading: boolean;
  onLogClick: () => void;
}

export function DealActivitySection({
  activities,
  isLoading,
  onLogClick,
}: DealActivitySectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Activity
        </Label>
        <Button size="sm" variant="outline" onClick={onLogClick}>
          <Plus className="h-4 w-4 mr-1" />
          Log Activity
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ActivityTimeline activities={activities} />
      )}
    </div>
  );
}
