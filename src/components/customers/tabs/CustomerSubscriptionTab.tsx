"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CreditCard, Gift, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIER_LABELS,
  TIER_COLORS,
  TIER_LIMITS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/admin/constants";
import type { AdminOrgDetail } from "@/lib/admin/types";

interface Props {
  org: AdminOrgDetail;
}

export function CustomerSubscriptionTab({ org }: Props) {
  const tier = org.pricingTier || "ruby";
  const status = org.subscriptionStatus || "trialing";
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.ruby;

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Current Plan
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[tier])}>
            {TIER_LABELS[tier]}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[status])}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Billing:</span>
            <span className="ml-2 capitalize">{org.billingPeriod || "monthly"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Message Limit:</span>
            <span className="ml-2">{limits.messages.toLocaleString()}/mo</span>
          </div>
          <div>
            <span className="text-muted-foreground">Property Limit:</span>
            <span className="ml-2">{limits.properties}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Unit Limit:</span>
            <span className="ml-2">{limits.units}</span>
          </div>
        </div>
      </Card>

      {/* Trial Info */}
      {(org.trialStartedAt || org.trialEndsAt) && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Gift className="h-4 w-4" /> Trial
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {org.trialStartedAt && (
              <div>
                <span className="text-muted-foreground">Started:</span>
                <span className="ml-2">{new Date(org.trialStartedAt).toLocaleDateString()}</span>
              </div>
            )}
            {org.trialEndsAt && (
              <div>
                <span className="text-muted-foreground">Ends:</span>
                <span className="ml-2">{new Date(org.trialEndsAt).toLocaleDateString()}</span>
              </div>
            )}
            {(org.trialExtendedCount || 0) > 0 && (
              <div>
                <span className="text-muted-foreground">Extensions:</span>
                <span className="ml-2">{org.trialExtendedCount}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Add-ons */}
      {((org.extraPropertiesCount || 0) > 0 || (org.extraUnitsCount || 0) > 0) && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Package className="h-4 w-4" /> Add-ons
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {(org.extraPropertiesCount || 0) > 0 && (
              <div>
                <span className="text-muted-foreground">Extra Properties:</span>
                <span className="ml-2">+{org.extraPropertiesCount}</span>
              </div>
            )}
            {(org.extraUnitsCount || 0) > 0 && (
              <div>
                <span className="text-muted-foreground">Extra Units:</span>
                <span className="ml-2">+{org.extraUnitsCount}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Stripe */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium">Stripe</h3>
        {org.stripeCustomerId ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Customer ID:</span>
              <span className="ml-2 font-mono text-xs">{org.stripeCustomerId}</span>
            </div>
            {org.stripeSubscriptionId && (
              <div>
                <span className="text-muted-foreground">Subscription ID:</span>
                <span className="ml-2 font-mono text-xs">{org.stripeSubscriptionId}</span>
              </div>
            )}
            <a
              href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
            >
              View in Stripe <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No Stripe customer linked</p>
        )}
      </Card>
    </div>
  );
}
