"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UpgradeAlertCard } from "./UpgradeAlertCard";
import { TIER_LABELS, TIER_PRICING } from "@/lib/admin/constants";
import type { UpgradeOpportunity } from "@/lib/admin/upgrade-queries";

interface Props {
  opportunities: UpgradeOpportunity[];
}

export function UpgradeAlertsList({ opportunities }: Props) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDeal = async (opp: UpgradeOpportunity) => {
    setIsCreating(true);
    try {
      // First check if contact exists for this org's owner
      const contactRes = await fetch(`/api/contacts?search=${encodeURIComponent(opp.owner?.email || opp.orgName)}&limit=1`);
      let contactId: string | null = null;

      if (contactRes.ok) {
        const { contacts } = await contactRes.json();
        if (contacts && contacts.length > 0) {
          contactId = contacts[0].id;
        }
      }

      const suggestedPrice = TIER_PRICING[opp.suggestedTier];
      const value = opp.billingPeriod === "annual"
        ? suggestedPrice?.annual || 0
        : suggestedPrice?.monthly || 0;

      const dealRes = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${opp.orgName} - Upgrade to ${TIER_LABELS[opp.suggestedTier]}`,
          contactId,
          stage: "lead",
          tier: opp.suggestedTier,
          value,
          billingPeriod: opp.billingPeriod || "monthly",
          notes: `Auto-created from upgrade alert.\nTriggers: ${opp.triggers.map((t) => t.description).join(", ")}`,
        }),
      });

      if (dealRes.ok) {
        toast.success("Deal created from upgrade alert");
        router.push("/pipeline");
      } else {
        toast.error("Failed to create deal");
      }
    } catch (error) {
      toast.error("Failed to create deal");
    } finally {
      setIsCreating(false);
    }
  };

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No upgrade opportunities detected</p>
        <p className="text-xs mt-1">Customers hitting limits will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {opportunities.map((opp) => (
        <UpgradeAlertCard
          key={opp.orgId}
          opportunity={opp}
          onCreateDeal={handleCreateDeal}
        />
      ))}
    </div>
  );
}
