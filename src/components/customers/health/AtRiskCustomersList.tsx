"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIER_LABELS, TIER_COLORS } from "@/lib/admin/constants";
import { getHealthCategoryInfo } from "@/lib/admin/health-constants";
import type { CustomerHealthData } from "@/lib/admin/health";

interface Props {
  customers: CustomerHealthData[];
  title?: string;
  emptyMessage?: string;
}

export function AtRiskCustomersList({
  customers,
  title = "At-Risk Customers",
  emptyMessage = "No at-risk customers found",
}: Props) {
  const sorted = [...customers]
    .filter((c) => c.breakdown.category !== "healthy")
    .sort((a, b) => a.breakdown.total - b.breakdown.total);

  if (sorted.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tier</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Score</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Weakest Area</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Last Chat</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.slice(0, 20).map((c) => {
              const info = getHealthCategoryInfo(c.breakdown.total);
              const weakest = findWeakestArea(c.breakdown);
              return (
                <tr key={c.orgId} className="hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={`/customers/${c.orgId}`} className="font-medium hover:underline">
                      {c.orgName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.owner?.email || "No owner"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[c.pricingTier || "ruby"])}>
                      {TIER_LABELS[c.pricingTier || "ruby"]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", info.dotColor)} />
                      <span className="font-medium">{c.breakdown.total}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {weakest}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {c.daysSinceLastChat === null
                      ? "Never"
                      : c.daysSinceLastChat === 0
                      ? "Today"
                      : `${c.daysSinceLastChat}d ago`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function findWeakestArea(b: CustomerHealthData["breakdown"]): string {
  const areas = [
    { label: "AI Usage", ratio: b.aiUsage / 25 },
    { label: "Property Setup", ratio: b.propertySetup / 25 },
    { label: "Guest Engagement", ratio: b.guestEngagement / 25 },
    { label: "Support Health", ratio: b.supportHealth / 15 },
    { label: "Account Activity", ratio: b.accountActivity / 10 },
  ];
  areas.sort((a, b) => a.ratio - b.ratio);
  return areas[0].label;
}
