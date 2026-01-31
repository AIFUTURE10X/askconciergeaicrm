"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { TIER_LABELS, TIER_COLORS } from "@/lib/admin/constants";
import type { UpgradeOpportunity } from "@/lib/admin/upgrade-queries";

interface Props {
  opportunity: UpgradeOpportunity;
  onCreateDeal?: (opp: UpgradeOpportunity) => void;
}

const TRIGGER_ICONS: Record<string, string> = {
  usage_high: "AI Usage",
  property_limit: "Properties",
  unit_limit: "Units",
  high_engagement_ruby: "Engagement",
  missing_features: "Features",
};

export function UpgradeAlertCard({ opportunity: opp, onCreateDeal }: Props) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/customers/${opp.orgId}`} className="font-medium hover:underline">
            {opp.orgName}
          </Link>
          <p className="text-xs text-muted-foreground">{opp.owner?.email || "No owner"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">+${opp.potentialMrrIncrease}/mo</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[opp.currentTier])}>
          {TIER_LABELS[opp.currentTier]}
        </Badge>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[opp.suggestedTier])}>
          {TIER_LABELS[opp.suggestedTier]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {opp.triggers.map((t, i) => (
          <span
            key={i}
            className="text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          >
            {t.description}
          </span>
        ))}
      </div>

      {onCreateDeal && (
        <Button size="sm" variant="outline" onClick={() => onCreateDeal(opp)}>
          Create Deal
        </Button>
      )}
    </Card>
  );
}
