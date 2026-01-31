"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIER_LABELS, TIER_COLORS } from "@/lib/admin/constants";
import type { RenewalCustomer } from "@/lib/admin/renewal-queries";

interface Props {
  customers: RenewalCustomer[];
}

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  this_week: { label: "This Week", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  this_month: { label: "This Month", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  next_month: { label: "Next Month", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  later: { label: "Later", color: "bg-muted text-muted-foreground" },
};

export function RenewalPipelineList({ customers }: Props) {
  const groups = {
    this_week: customers.filter((c) => c.renewalUrgency === "this_week"),
    this_month: customers.filter((c) => c.renewalUrgency === "this_month"),
    next_month: customers.filter((c) => c.renewalUrgency === "next_month"),
  };

  const hasAny = Object.values(groups).some((g) => g.length > 0);

  if (!hasAny) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Renewal Pipeline</h3>
        <p className="text-sm text-muted-foreground">No upcoming renewals to display</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-sm font-medium">Renewal Pipeline</h3>
      {(["this_week", "this_month", "next_month"] as const).map((urgency) => {
        const group = groups[urgency];
        if (group.length === 0) return null;
        const config = URGENCY_CONFIG[urgency];

        return (
          <div key={urgency}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={cn("text-xs", config.color)}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{group.length} customers</span>
            </div>
            <div className="space-y-1.5">
              {group.slice(0, 10).map((c) => (
                <div key={c.orgId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link href={`/customers/${c.orgId}`} className="text-sm font-medium hover:underline truncate">
                      {c.orgName}
                    </Link>
                    <Badge variant="secondary" className={cn("text-xs flex-shrink-0", TIER_COLORS[c.pricingTier || "ruby"])}>
                      {TIER_LABELS[c.pricingTier || "ruby"]}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2 capitalize">
                    {c.billingPeriod || "monthly"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
