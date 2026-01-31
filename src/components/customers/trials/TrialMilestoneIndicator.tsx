"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface Props {
  milestones: {
    hasProperty: boolean;
    hasFaq: boolean;
    hasContentSection: boolean;
    hasFirstChat: boolean;
    onboardingCompleted: boolean;
  };
}

const MILESTONE_LABELS = [
  { key: "hasProperty" as const, label: "Property" },
  { key: "hasFaq" as const, label: "FAQ" },
  { key: "hasContentSection" as const, label: "Content" },
  { key: "hasFirstChat" as const, label: "1st Chat" },
  { key: "onboardingCompleted" as const, label: "Onboarding" },
];

export function TrialMilestoneIndicator({ milestones }: Props) {
  return (
    <div className="flex items-center gap-1">
      {MILESTONE_LABELS.map(({ key, label }) => {
        const done = milestones[key];
        return (
          <div
            key={key}
            title={`${label}: ${done ? "Complete" : "Incomplete"}`}
            className={cn(
              "flex items-center justify-center h-5 w-5 rounded-full",
              done
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {done ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </div>
        );
      })}
    </div>
  );
}
