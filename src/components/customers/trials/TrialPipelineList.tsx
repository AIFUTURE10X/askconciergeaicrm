"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrialMilestoneIndicator } from "./TrialMilestoneIndicator";
import type { TrialOnboardingData } from "@/lib/admin/health-queries";

interface Props {
  trials: TrialOnboardingData[];
}

function getDaysColor(days: number): string {
  if (days <= 3) return "text-red-600 dark:text-red-400";
  if (days <= 7) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function getDaysBadgeColor(days: number): string {
  if (days <= 3) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (days <= 7) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

export function TrialPipelineList({ trials }: Props) {
  if (trials.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Trial Pipeline</h3>
        <p className="text-sm text-muted-foreground">No active trials</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Trial Pipeline</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Days Left</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Milestones</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Progress</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trials.map((trial) => (
              <tr key={trial.orgId} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={`/customers/${trial.orgId}`} className="font-medium hover:underline">
                    {trial.orgName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {trial.owner?.email || "No owner"}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className={cn("text-xs", getDaysBadgeColor(trial.daysRemaining))}>
                    {trial.daysRemaining}d
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <TrialMilestoneIndicator milestones={trial.milestones} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted/30">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(trial.milestonesCompleted / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{trial.milestonesCompleted}/5</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {trial.lastActivityDaysAgo === null
                    ? "Never"
                    : trial.lastActivityDaysAgo === 0
                    ? "Today"
                    : `${trial.lastActivityDaysAgo}d ago`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
