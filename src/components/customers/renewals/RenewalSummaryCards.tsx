"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarClock, CalendarDays, UserMinus, BarChart3 } from "lucide-react";
import type { RenewalStats } from "@/lib/admin/renewal-queries";

interface Props {
  stats: RenewalStats;
}

export function RenewalSummaryCards({ stats }: Props) {
  const cards = [
    {
      label: "Renewing This Week",
      value: stats.upcomingThisWeek,
      icon: CalendarClock,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      label: "Renewing This Month",
      value: stats.upcomingThisMonth,
      icon: CalendarDays,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Total Churns Logged",
      value: stats.recentChurnCount,
      icon: UserMinus,
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    },
    {
      label: "Top Churn Reason",
      value: stats.topChurnReasons[0]?.reason
        ? stats.topChurnReasons[0].reason.replace("_", " ")
        : "N/A",
      icon: BarChart3,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
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
            <p className="text-lg font-semibold capitalize">{card.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
