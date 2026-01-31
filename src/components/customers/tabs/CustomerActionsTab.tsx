"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Pencil, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  TIER_LABELS,
  TIER_COLORS,
  VALID_TIERS,
} from "@/lib/admin/constants";
import type { AdminOrgDetail } from "@/lib/admin/types";
import { ChurnReasonDialog } from "@/components/customers/renewals/ChurnReasonDialog";

interface Props {
  org: AdminOrgDetail;
  onRefresh: () => Promise<void>;
}

export function CustomerActionsTab({ org, onRefresh }: Props) {
  const [isChangingTier, setIsChangingTier] = useState(false);
  const [isExtendingTrial, setIsExtendingTrial] = useState(false);
  const [trialDays, setTrialDays] = useState("14");
  const [isCanceling, setIsCanceling] = useState(false);
  const [showChurnDialog, setShowChurnDialog] = useState(false);

  // Inline edit states
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(org.name);
  const [editPhone, setEditPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(org.phoneNumber || "");
  const [isSaving, setIsSaving] = useState(false);

  const patchOrg = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/customers/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");
    return data;
  };

  const handleChangeTier = async (newTier: string) => {
    if (newTier === org.pricingTier) return;
    setIsChangingTier(true);
    try {
      await patchOrg({ action: "changeTier", tier: newTier });
      toast.success(`Tier changed to ${TIER_LABELS[newTier]}`);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change tier");
    } finally {
      setIsChangingTier(false);
    }
  };

  const handleExtendTrial = async () => {
    const days = parseInt(trialDays);
    if (!days || days < 1 || days > 90) {
      toast.error("Enter a number between 1 and 90");
      return;
    }
    setIsExtendingTrial(true);
    try {
      const data = await patchOrg({ action: "extendTrial", days });
      toast.success(`Trial extended. New end: ${new Date(data.trialEndsAt).toLocaleDateString()}`);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to extend trial");
    } finally {
      setIsExtendingTrial(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await patchOrg({ action: "editDetails", name: nameValue });
      toast.success("Name updated");
      setEditName(false);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhone = async () => {
    setIsSaving(true);
    try {
      await patchOrg({ action: "editDetails", phoneNumber: phoneValue });
      toast.success("Phone updated");
      setEditPhone(false);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update phone");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Mark this subscription as canceled? This only updates the database, not Stripe.")) {
      return;
    }
    setIsCanceling(true);
    try {
      await patchOrg({ action: "cancelSubscription" });
      toast.success("Subscription marked as canceled");
      setShowChurnDialog(true);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel");
    } finally {
      setIsCanceling(false);
    }
  };

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
              disabled={isChangingTier}
              onClick={() => handleChangeTier(tier)}
              className={cn(tier === org.pricingTier && "pointer-events-none")}
            >
              {isChangingTier ? (
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
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            className="w-24"
            placeholder="Days"
          />
          <span className="text-sm text-muted-foreground">days</span>
          <Button
            size="sm"
            onClick={handleExtendTrial}
            disabled={isExtendingTrial}
          >
            {isExtendingTrial && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Extend
          </Button>
        </div>
      </Card>

      {/* Edit Name */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Organization Name</h3>
          {!editName && (
            <Button variant="ghost" size="sm" onClick={() => setEditName(true)}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          )}
        </div>
        {editName ? (
          <div className="flex items-center gap-2">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditName(false);
                setNameValue(org.name);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm">{org.name}</p>
        )}
      </Card>

      {/* Edit Phone */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Phone Number</h3>
          {!editPhone && (
            <Button variant="ghost" size="sm" onClick={() => setEditPhone(true)}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          )}
        </div>
        {editPhone ? (
          <div className="flex items-center gap-2">
            <Input
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              className="flex-1"
              placeholder="+1 555 123 4567"
            />
            <Button size="icon" variant="ghost" onClick={handleSavePhone} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditPhone(false);
                setPhoneValue(org.phoneNumber || "");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm">{org.phoneNumber || "—"}</p>
        )}
      </Card>

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

      {/* Cancel Subscription */}
      {org.subscriptionStatus !== "canceled" && org.subscriptionStatus !== "expired" && (
        <Card className="p-4 space-y-3 border-destructive/50">
          <h3 className="font-medium text-destructive">Danger Zone</h3>
          <p className="text-xs text-muted-foreground">
            Database only. Use Stripe dashboard for actual billing changes.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={isCanceling}
          >
            {isCanceling && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Mark as Canceled
          </Button>
        </Card>
      )}

      {/* Log churn reason for already-canceled orgs */}
      {org.subscriptionStatus === "canceled" && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium">Log Churn Reason</h3>
          <p className="text-xs text-muted-foreground">Record why this customer canceled for analytics.</p>
          <Button size="sm" variant="outline" onClick={() => setShowChurnDialog(true)}>
            Log Reason
          </Button>
        </Card>
      )}

      {showChurnDialog && (
        <ChurnReasonDialog
          orgId={org.id}
          orgName={org.name}
          onClose={() => setShowChurnDialog(false)}
        />
      )}
    </div>
  );
}
