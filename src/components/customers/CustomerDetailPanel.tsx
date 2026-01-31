"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Loader2, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIER_LABELS,
  TIER_COLORS,
  TIER_LIMITS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/admin/constants";
import type { AdminOrgDetail, AdminOrgUsage } from "@/lib/admin/types";

interface CustomerDetailPanelProps {
  orgId: string;
  onClose: () => void;
}

export function CustomerDetailPanel({ orgId, onClose }: CustomerDetailPanelProps) {
  const [org, setOrg] = useState<AdminOrgDetail | null>(null);
  const [usage, setUsage] = useState<AdminOrgUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [orgRes, usageRes] = await Promise.all([
          fetch(`/api/customers/${orgId}`),
          fetch(`/api/customers/${orgId}/usage`),
        ]);
        if (orgRes.ok) {
          const { organization } = await orgRes.json();
          setOrg(organization);
        }
        if (usageRes.ok) {
          const { usage: usageData } = await usageRes.json();
          setUsage(usageData);
        }
      } catch (error) {
        console.error("Error loading detail:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [orgId]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentUsage = usage.find((u) => u.month === currentMonth);
  const tier = org?.pricingTier || "ruby";
  const messageLimit = TIER_LIMITS[tier]?.messages || 1000;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            {isLoading ? "Loading..." : org?.name || "Customer"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : org ? (
          <div className="p-4 space-y-4">
            {/* Overview */}
            <Card className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="ml-1 font-mono text-xs">{org.slug}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-1">{org.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="ml-1">{org.owner?.name || org.owner?.email || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-1">{org.phoneNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-1">{new Date(org.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Onboarded:</span>
                  <span className="ml-1">
                    {org.onboardingCompletedAt
                      ? new Date(org.onboardingCompletedAt).toLocaleDateString()
                      : "Not yet"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Subscription */}
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Subscription</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[tier])}>
                  {TIER_LABELS[tier]}
                </Badge>
                <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[org.subscriptionStatus || "trialing"])}>
                  {STATUS_LABELS[org.subscriptionStatus || "trialing"]}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">{org.billingPeriod}</span>
              </div>
              {org.subscriptionStatus === "trialing" && org.trialEndsAt && (
                <p className="text-xs text-muted-foreground">
                  Trial ends: {new Date(org.trialEndsAt).toLocaleDateString()}
                  {(org.trialExtendedCount || 0) > 0 && ` (extended ${org.trialExtendedCount}x)`}
                </p>
              )}
              {org.extraPropertiesCount ? (
                <p className="text-xs text-muted-foreground">
                  Extra properties: +{org.extraPropertiesCount}
                </p>
              ) : null}
              {org.stripeCustomerId && (
                <a
                  href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                >
                  View in Stripe <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </Card>

            {/* Usage */}
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">AI Usage (This Month)</h3>
              {currentUsage ? (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Messages</span>
                      <span>{currentUsage.messagesUsed} / {messageLimit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(100, ((currentUsage.messagesUsed || 0) / messageLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Properties: {org.propertyCount}</div>
                    <div>Units: {org.unitCount}</div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No usage this month</p>
              )}
            </Card>

            {/* Link to full details */}
            <Button asChild className="w-full">
              <Link href={`/customers/${org.id}`}>
                Full details <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Customer not found
          </div>
        )}
      </div>
    </>
  );
}
