"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, Target, Zap } from "lucide-react";

interface Props {
  stats: {
    activeTrials: number;
    stalledCount: number;
    avgMilestones: number;
    urgentCount: number;
  };
}

export function TrialSummaryCards({ stats }: Props) {
  const cards = [
    {
      label: "Active Trials",
      value: stats.activeTrials,
      icon: Clock,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Stalled (7d+)",
      value: stats.stalledCount,
      icon: AlertTriangle,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Avg Milestones",
      value: `${stats.avgMilestones}/5`,
      icon: Target,
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      label: "Urgent (<7d, <3 milestones)",
      value: stats.urgentCount,
      icon: Zap,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="p-3 sm:p-4 flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", card.color)}>
            <card.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-lg font-semibold">{card.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
