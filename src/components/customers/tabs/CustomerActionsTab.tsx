"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_LABELS, TIER_COLORS, VALID_TIERS } from "@/lib/admin/constants";
import type { AdminOrgDetail } from "@/lib/admin/types";
import { useOrgActions } from "./useOrgActions";
import { InlineEditCard } from "./InlineEditCard";
import { DangerZoneCard } from "./DangerZoneCard";

interface Props {
  org: AdminOrgDetail;
  onRefresh: () => Promise<void>;
}

export function CustomerActionsTab({ org, onRefresh }: Props) {
  const a = useOrgActions({
    orgId: org.id,
    orgName: org.name,
    orgPhoneNumber: org.phoneNumber,
    orgPricingTier: org.pricingTier,
    onRefresh,
  });

  return (
    <div className="space-y-4">
      {/* Change Tier */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium">Change Tier</h3>
        <div className="flex flex-wrap gap-2">
          {VALID_TIERS.map((tier) => (
            <Button
              key={tier}
              variant={tier === org.pricingTier ? "default" : "outline"}
              size="sm"
              disabled={a.isChangingTier}
              onClick={() => a.handleChangeTier(tier)}
              className={cn(tier === org.pricingTier && "pointer-events-none")}
            >
              {a.isChangingTier ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[tier])}>
                {TIER_LABELS[tier]}
              </Badge>
            </Button>
          ))}
        </div>
      </Card>

      {/* Extend Trial */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium">Extend Trial</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={90}
            value={a.trialDays}
            onChange={(e) => a.setTrialDays(e.target.value)}
            className="w-24"
            placeholder="Days"
          />
          <span className="text-sm text-muted-foreground">days</span>
          <Button
            size="sm"
            onClick={a.handleExtendTrial}
            disabled={a.isExtendingTrial}
          >
            {a.isExtendingTrial && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Extend
          </Button>
        </div>
      </Card>

      <InlineEditCard
        label="Organization Name"
        value={org.name}
        editValue={a.nameValue}
        isEditing={a.editName}
        isSaving={a.isSaving}
        onEditStart={() => a.setEditName(true)}
        onEditCancel={() => {
          a.setEditName(false);
          a.setNameValue(org.name);
        }}
        onChange={a.setNameValue}
        onSave={a.handleSaveName}
      />

      <InlineEditCard
        label="Phone Number"
        value={org.phoneNumber || ""}
        editValue={a.phoneValue}
        isEditing={a.editPhone}
        isSaving={a.isSaving}
        placeholder="+1 555 123 4567"
        onEditStart={() => a.setEditPhone(true)}
        onEditCancel={() => {
          a.setEditPhone(false);
          a.setPhoneValue(org.phoneNumber || "");
        }}
        onChange={a.setPhoneValue}
        onSave={a.handleSavePhone}
      />

      {/* External Links */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          {org.stripeCustomerId && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View in Stripe <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </Card>

      <DangerZoneCard
        orgId={org.id}
        orgName={org.name}
        subscriptionStatus={org.subscriptionStatus}
        isCanceling={a.isCanceling}
        showChurnDialog={a.showChurnDialog}
        onCancel={a.handleCancel}
        onChurnDialogChange={a.setShowChurnDialog}
      />
    </div>
  );
}
