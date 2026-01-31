"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, DollarSign, Zap } from "lucide-react";
import type { UpgradeStats } from "@/lib/admin/upgrade-queries";

interface Props {
  stats: UpgradeStats;
}

const TRIGGER_LABELS: Record<string, string> = {
  usage_high: "High Usage",
  property_limit: "Property Limit",
  unit_limit: "Unit Limit",
  high_engagement_ruby: "High Engagement Ruby",
  missing_features: "Missing Features",
};

export function UpgradeAlertSummary({ stats }: Props) {
  const cards = [
    {
      label: "Opportunities",
      value: stats.totalOpportunities,
      icon: Zap,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Potential MRR Increase",
      value: `$${stats.potentialMrrIncrease}`,
      icon: DollarSign,
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      label: "Top Trigger",
      value: stats.triggerBreakdown[0]
        ? TRIGGER_LABELS[stats.triggerBreakdown[0].type] || stats.triggerBreakdown[0].type
        : "N/A",
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
