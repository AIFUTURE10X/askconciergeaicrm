"use client";

import { Card } from "@/components/ui/card";
import { HEALTH_WEIGHTS } from "@/lib/admin/health-constants";
import type { HealthScoreBreakdown } from "@/lib/admin/health";

interface Props {
  breakdown: HealthScoreBreakdown;
}

const COMPONENTS = [
  { key: "aiUsage" as const, label: "AI Usage", max: HEALTH_WEIGHTS.aiUsage },
  { key: "propertySetup" as const, label: "Property Setup", max: HEALTH_WEIGHTS.propertySetup },
  { key: "guestEngagement" as const, label: "Guest Engagement", max: HEALTH_WEIGHTS.guestEngagement },
  { key: "supportHealth" as const, label: "Support Health", max: HEALTH_WEIGHTS.supportHealth },
  { key: "accountActivity" as const, label: "Account Activity", max: HEALTH_WEIGHTS.accountActivity },
];

function getBarColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.7) return "bg-green-500";
  if (pct >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

export function HealthBreakdownCard({ breakdown }: Props) {
  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Score Breakdown</h3>
      <div className="space-y-2.5">
        {COMPONENTS.map(({ key, label, max }) => {
          const score = breakdown[key];
          const pct = (score / max) * 100;
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">
                  {score}/{max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/30">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(score, max)}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
        <span>Total Score</span>
        <span>{breakdown.total}/100</span>
      </div>
    </Card>
  );
}
