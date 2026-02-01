import { useState } from "react";
import { toast } from "sonner";
import { TIER_LABELS } from "@/lib/admin/constants";

interface UseOrgActionsArgs {
  orgId: string;
  orgName: string;
  orgPhoneNumber: string | null;
  orgPricingTier: string | null;
  onRefresh: () => Promise<void>;
}

export function useOrgActions({
  orgId,
  orgName,
  orgPhoneNumber,
  orgPricingTier,
  onRefresh,
}: UseOrgActionsArgs) {
  const [isChangingTier, setIsChangingTier] = useState(false);
  const [isExtendingTrial, setIsExtendingTrial] = useState(false);
  const [trialDays, setTrialDays] = useState("14");
  const [isCanceling, setIsCanceling] = useState(false);
  const [showChurnDialog, setShowChurnDialog] = useState(false);

  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(orgName);
  const [editPhone, setEditPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(orgPhoneNumber || "");
  const [isSaving, setIsSaving] = useState(false);

  const patchOrg = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/customers/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");
    return data;
  };

  const handleChangeTier = async (newTier: string) => {
    if (newTier === orgPricingTier) return;
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

  return {
    isChangingTier,
    isExtendingTrial,
    trialDays,
    setTrialDays,
    isCanceling,
    showChurnDialog,
    setShowChurnDialog,
    editName,
    setEditName,
    nameValue,
    setNameValue,
    editPhone,
    setEditPhone,
    phoneValue,
    setPhoneValue,
    isSaving,
    handleChangeTier,
    handleExtendTrial,
    handleSaveName,
    handleSavePhone,
    handleCancel,
  };
}
