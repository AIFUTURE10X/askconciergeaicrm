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

export function InactiveCustomersList({ customers }: Props) {
  const inactive = customers
    .filter((c) => c.daysSinceLastChat === null || c.daysSinceLastChat >= 30)
    .sort((a, b) => {
      if (a.daysSinceLastChat === null) return -1;
      if (b.daysSinceLastChat === null) return 1;
      return b.daysSinceLastChat - a.daysSinceLastChat;
    });

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-1">Inactive Customers</h3>
      <p className="text-xs text-muted-foreground mb-3">No chat sessions in 30+ days</p>
      {inactive.length === 0 ? (
        <p className="text-sm text-muted-foreground">All customers have recent activity</p>
      ) : (
        <div className="space-y-2">
          {inactive.slice(0, 10).map((c) => (
            <div key={c.orgId} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Link href={`/customers/${c.orgId}`} className="text-sm font-medium hover:underline truncate">
                  {c.orgName}
                </Link>
                <Badge variant="secondary" className={cn("text-xs flex-shrink-0", TIER_COLORS[c.pricingTier || "ruby"])}>
                  {TIER_LABELS[c.pricingTier || "ruby"]}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {c.daysSinceLastChat === null ? "Never chatted" : `${c.daysSinceLastChat}d inactive`}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
