"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIER_LABELS, TIER_COLORS } from "@/lib/admin/constants";
import type { CustomerHealthData } from "@/lib/admin/health";

interface Props {
  customers: CustomerHealthData[];
}

export function UsageWarningsList({ customers }: Props) {
  const highUsage = customers
    .filter((c) => c.usagePercent >= 80)
    .sort((a, b) => b.usagePercent - a.usagePercent);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-1">Usage Warnings</h3>
      <p className="text-xs text-muted-foreground mb-3">Customers using &gt;80% of AI messages</p>
      {highUsage.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customers near their usage limit</p>
      ) : (
        <div className="space-y-2">
          {highUsage.slice(0, 10).map((c) => (
            <div key={c.orgId} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Link href={`/customers/${c.orgId}`} className="text-sm font-medium hover:underline truncate">
                  {c.orgName}
                </Link>
                <Badge variant="secondary" className={cn("text-xs flex-shrink-0", TIER_COLORS[c.pricingTier || "ruby"])}>
                  {TIER_LABELS[c.pricingTier || "ruby"]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <div className="w-16 h-1.5 rounded-full bg-muted/30">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      c.usagePercent >= 95 ? "bg-red-500" : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min(100, c.usagePercent)}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  c.usagePercent >= 95 ? "text-red-600" : "text-amber-600"
                )}>
                  {c.usagePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
