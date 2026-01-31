"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TrialOnboardingData } from "@/lib/admin/health-queries";

interface Props {
  trials: TrialOnboardingData[];
}

export function StalledTrialsList({ trials }: Props) {
  const stalled = trials
    .filter((t) => t.lastActivityDaysAgo === null || t.lastActivityDaysAgo >= 7)
    .sort((a, b) => {
      if (a.lastActivityDaysAgo === null) return -1;
      if (b.lastActivityDaysAgo === null) return 1;
      return b.lastActivityDaysAgo - a.lastActivityDaysAgo;
    });

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-1">Stalled Trials</h3>
      <p className="text-xs text-muted-foreground mb-3">No activity in 7+ days</p>
      {stalled.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stalled trials</p>
      ) : (
        <div className="space-y-2">
          {stalled.slice(0, 10).map((t) => (
            <div key={t.orgId} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="min-w-0">
                <Link href={`/customers/${t.orgId}`} className="text-sm font-medium hover:underline truncate block">
                  {t.orgName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {t.milestonesCompleted}/5 milestones · {t.daysRemaining}d left
                </p>
              </div>
              <span className={cn(
                "text-xs flex-shrink-0 ml-2",
                t.daysRemaining <= 7 ? "text-red-600 font-medium" : "text-muted-foreground"
              )}>
                {t.lastActivityDaysAgo === null ? "Never active" : `${t.lastActivityDaysAgo}d idle`}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
