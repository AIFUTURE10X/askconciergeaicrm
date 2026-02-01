"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  CreditCard,
  Gift,
  Package,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIER_LABELS,
  TIER_COLORS,
  TIER_LIMITS,
  STATUS_LABELS,
  STATUS_COLORS,
  EXTRA_PROPERTY_PRICING,
  EXTRA_UNIT_PRICING,
  CRM_ADDON_PRICING,
  TIER_PRICING,
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

      {/* Revenue Breakdown & Add-ons */}
      <RevenueBreakdownCard org={org} />

      {/* CRM Add-on Details */}
      {org.crmSubscription && (
        <CrmAddonDetailsCard crmSubscription={org.crmSubscription} />
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

function RevenueBreakdownCard({ org }: { org: AdminOrgDetail }) {
  const tier = org.pricingTier || "ruby";
  const billing = org.billingPeriod || "monthly";
  const pricing = TIER_PRICING[tier];

  const baseMrr = pricing
    ? billing === "annual"
      ? pricing.annual / 12
      : pricing.monthly
    : 0;

  const extraProps = org.extraPropertiesCount || 0;
  const propRate = EXTRA_PROPERTY_PRICING[tier] || 0;
  const extraPropsMrr = extraProps * propRate;

  const extraUnits = org.extraUnitsCount || 0;
  const unitRate = EXTRA_UNIT_PRICING[tier] || 0;
  const extraUnitsMrr = extraUnits * unitRate;

  const hasCrm = !!org.crmSubscription;
  const crmPeriod = org.crmSubscription?.billingPeriod || "monthly";
  const crmMrr = hasCrm
    ? crmPeriod === "annual"
      ? CRM_ADDON_PRICING.annual / 12
      : CRM_ADDON_PRICING.monthly
    : 0;

  const totalMrr = baseMrr + extraPropsMrr + extraUnitsMrr + crmMrr;
  const hasExtras = extraPropsMrr > 0 || extraUnitsMrr > 0 || crmMrr > 0;

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <Package className="h-4 w-4" /> Add-ons & Revenue
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1.5 pr-4 font-medium text-muted-foreground">Line Item</th>
              <th className="py-1.5 pr-4 font-medium text-muted-foreground">Detail</th>
              <th className="py-1.5 text-right font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Base Plan — always shown */}
            <tr>
              <td className="py-1.5 pr-4">Base Plan</td>
              <td className="py-1.5 pr-4 text-muted-foreground">
                {TIER_LABELS[tier]} ({billing})
              </td>
              <td className="py-1.5 text-right font-mono text-xs">
                ${baseMrr.toFixed(2)}/mo
              </td>
            </tr>
            {extraPropsMrr > 0 && (
              <tr>
                <td className="py-1.5 pr-4">Extra Properties</td>
                <td className="py-1.5 pr-4 text-muted-foreground">
                  {extraProps} &times; ${propRate.toFixed(2)}
                </td>
                <td className="py-1.5 text-right font-mono text-xs">
                  ${extraPropsMrr.toFixed(2)}/mo
                </td>
              </tr>
            )}
            {extraUnitsMrr > 0 && (
              <tr>
                <td className="py-1.5 pr-4">Extra Units</td>
                <td className="py-1.5 pr-4 text-muted-foreground">
                  {extraUnits} &times; ${unitRate.toFixed(2)}
                </td>
                <td className="py-1.5 text-right font-mono text-xs">
                  ${extraUnitsMrr.toFixed(2)}/mo
                </td>
              </tr>
            )}
            {crmMrr > 0 && (
              <tr>
                <td className="py-1.5 pr-4">CRM Add-on</td>
                <td className="py-1.5 pr-4 text-muted-foreground capitalize">{crmPeriod}</td>
                <td className="py-1.5 text-right font-mono text-xs">
                  ${crmMrr.toFixed(2)}/mo
                </td>
              </tr>
            )}
            {/* Total row */}
            <tr className="border-t-2">
              <td className="py-1.5 pr-4 font-semibold" colSpan={2}>
                Total MRR
              </td>
              <td className="py-1.5 text-right font-mono text-xs font-semibold">
                ${totalMrr.toFixed(2)}/mo
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {!hasExtras && (
        <p className="text-xs text-muted-foreground">No active add-ons</p>
      )}
    </Card>
  );
}

function CrmAddonDetailsCard({
  crmSubscription,
}: {
  crmSubscription: NonNullable<AdminOrgDetail["crmSubscription"]>;
}) {
  const isActive = crmSubscription.status === "active";

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        CRM Add-on Details
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            )}
          >
            {crmSubscription.status}
          </Badge>
        </div>
        <div>
          <span className="text-muted-foreground">Billing:</span>
          <span className="ml-2 capitalize">{crmSubscription.billingPeriod}</span>
        </div>
        {crmSubscription.currentPeriodEnd && (
          <div>
            <span className="text-muted-foreground">Renews:</span>
            <span className="ml-2">
              {new Date(crmSubscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      {crmSubscription.cancelAtPeriodEnd && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Cancels at end of billing period
        </div>
      )}
    </Card>
  );
}
