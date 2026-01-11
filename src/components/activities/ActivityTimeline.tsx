"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  Presentation,
  Users,
  Linkedin,
  StickyNote,
  CheckCircle,
  XCircle,
  Clock,
  Voicemail,
} from "lucide-react";
import { ACTIVITY_TYPES } from "@/lib/constants/pipeline";
import type { Activity, Deal, Contact } from "@/lib/db/schema";

type ActivityWithRelations = Activity & {
  deal?: Deal | null;
  contact?: Contact | null;
};

interface ActivityTimelineProps {
  activities: ActivityWithRelations[];
  showDealLink?: boolean;
  showContactLink?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  demo: Presentation,
  meeting: Users,
  linkedin_message: Linkedin,
  note: StickyNote,
};

const outcomeConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  completed: {
    icon: CheckCircle,
    color: "text-green-600",
    label: "Completed",
  },
  no_answer: { icon: XCircle, color: "text-orange-500", label: "No Answer" },
  voicemail: { icon: Voicemail, color: "text-blue-500", label: "Voicemail" },
  scheduled_followup: {
    icon: Clock,
    color: "text-purple-500",
    label: "Follow-up Scheduled",
  },
  interested: {
    icon: CheckCircle,
    color: "text-green-600",
    label: "Interested",
  },
  not_interested: {
    icon: XCircle,
    color: "text-red-500",
    label: "Not Interested",
  },
};

export function ActivityTimeline({
  activities,
  showDealLink = false,
  showContactLink = false,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activities logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = iconMap[activity.type] || StickyNote;
        const activityType = ACTIVITY_TYPES.find((t) => t.id === activity.type);
        const outcome = activity.outcome
          ? outcomeConfig[activity.outcome]
          : null;

        return (
          <div key={activity.id} className="flex gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {/* Connector line */}
              {index < activities.length - 1 && (
                <div className="w-px h-full bg-border ml-4 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {activityType?.label || activity.type}
                    </span>
                    {outcome && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${outcome.color}`}
                      >
                        {outcome.label}
                      </Badge>
                    )}
                  </div>
                  {activity.subject && (
                    <p className="text-sm mt-0.5">{activity.subject}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {activity.description}
                </p>
              )}

              {/* Links */}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {showDealLink && activity.deal && (
                  <span>Deal: {activity.deal.title}</span>
                )}
                {showContactLink && activity.contact && (
                  <span>Contact: {activity.contact.name}</span>
                )}
                <span>
                  {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
