"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Layers, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_LABELS, TIER_COLORS, STATUS_LABELS, STATUS_COLORS } from "@/lib/admin/constants";
import type { AdminOrgDetail } from "@/lib/admin/types";

interface Props {
  org: AdminOrgDetail;
}

export function CustomerOverviewTab({ org }: Props) {
  const tier = org.pricingTier || "ruby";
  const status = org.subscriptionStatus || "trialing";

  return (
    <div className="space-y-4">
      {/* Org info */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Organization Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <InfoRow label="Name" value={org.name} />
          <InfoRow label="Slug" value={org.slug} mono />
          <InfoRow label="Type" value={org.type} />
          <InfoRow label="Language" value={org.defaultLanguage || "en"} />
          <InfoRow label="Custom Domain" value={org.customDomain || "—"} />
          <InfoRow label="Phone" value={org.phoneNumber || "—"} />
        </div>
        <div className="flex gap-2 pt-1">
          <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[tier])}>
            {TIER_LABELS[tier]}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[status])}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
      </Card>

      {/* Owner */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" /> Owner
        </h3>
        {org.owner ? (
          <div className="text-sm">
            <p className="font-medium">{org.owner.name || "—"}</p>
            <p className="text-muted-foreground">{org.owner.email}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No owner</p>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatBlock
          icon={Building2}
          label="Properties"
          value={org.propertyCount}
          extra={org.extraPropertiesCount ? `+${org.extraPropertiesCount} extra` : undefined}
        />
        <StatBlock
          icon={Layers}
          label="Units"
          value={org.unitCount}
          extra={org.extraUnitsCount ? `+${org.extraUnitsCount} extra` : undefined}
        />
        <StatBlock icon={Users} label="Members" value={org.memberCount} />
      </div>

      {/* Timeline */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Timeline
        </h3>
        <div className="space-y-2 text-sm">
          <TimelineRow label="Created" date={org.createdAt} />
          <TimelineRow label="Trial Started" date={org.trialStartedAt} />
          <TimelineRow label="Trial Ends" date={org.trialEndsAt} />
          <TimelineRow label="Onboarding Completed" date={org.onboardingCompletedAt} />
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("ml-2", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  extra?: string;
}) {
  return (
    <Card className="p-4 text-center">
      <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {extra && <p className="text-xs text-blue-500">{extra}</p>}
    </Card>
  );
}

function TimelineRow({ label, date }: { label: string; date: Date | string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{date ? new Date(date).toLocaleDateString() : "—"}</span>
    </div>
  );
}
