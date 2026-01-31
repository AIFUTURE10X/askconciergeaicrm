"use client";

import { Card } from "@/components/ui/card";
import { CHURN_REASON_LABELS } from "@/lib/admin/renewal-queries";

interface Props {
  reasons: Array<{ reason: string; count: number }>;
}

const BAR_COLORS = [
  "bg-red-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-gray-500",
];

export function ChurnReasonChart({ reasons }: Props) {
  if (reasons.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Churn Reasons</h3>
        <p className="text-sm text-muted-foreground">No churn data recorded yet</p>
      </Card>
    );
  }

  const maxCount = Math.max(...reasons.map((r) => r.count), 1);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Churn Reasons</h3>
      <div className="space-y-2.5">
        {reasons.map((r, i) => (
          <div key={r.reason} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground capitalize">
                {CHURN_REASON_LABELS[r.reason] || r.reason}
              </span>
              <span className="font-medium">{r.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${(r.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
