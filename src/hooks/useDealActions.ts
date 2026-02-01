import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Deal, Contact, Activity } from "@/lib/db/schema";

type ActivityWithRelations = Activity & {
  deal?: Deal | null;
  contact?: Contact | null;
};

type DealWithContact = Deal & { contact: Contact | null };

interface UseDealActionsArgs {
  deal: DealWithContact | null;
  open: boolean;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function useDealActions({
  deal,
  open,
  onUpdate,
  onDelete,
  onOpenChange,
}: UseDealActionsArgs) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityWithRelations[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [isEditingNextStep, setIsEditingNextStep] = useState(false);
  const [nextStepText, setNextStepText] = useState("");
  const [followUpDateText, setFollowUpDateText] = useState("");

  const fetchActivities = useCallback(async () => {
    if (!deal) return;
    setIsLoadingActivities(true);
    try {
      const res = await fetch(`/api/activities?dealId=${deal.id}&limit=10`);
      if (res.ok) {
        const { activities: data } = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [deal]);

  useEffect(() => {
    if (open && deal) {
      fetchActivities();
      setNextStepText(deal.nextStep || "");
      setFollowUpDateText(
        deal.followUpDate ? format(new Date(deal.followUpDate), "yyyy-MM-dd") : ""
      );
      setIsEditingNextStep(false);
    }
  }, [open, deal, fetchActivities]);

  const handleStageChange = async (newStage: string) => {
    if (!deal) return;
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, { stage: newStage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkWon = async () => {
    if (!deal) return;
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, { stage: "closed_won", lastStage: deal.stage });
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkLost = () => {
    setIsLostDialogOpen(true);
  };

  const handleLostConfirm = async (reason: string, notes?: string) => {
    if (!deal) return;
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, {
        stage: "closed_lost",
        lostReason: reason,
        lastStage: deal.stage,
        notes: notes
          ? deal.notes
            ? `${deal.notes}\n\nLost reason: ${notes}`
            : `Lost reason: ${notes}`
          : deal.notes,
      });
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (!confirm("Are you sure you want to delete this deal?")) return;
    setIsDeleting(true);
    try {
      await onDelete(deal.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNextStep = async () => {
    if (!deal) return;
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, {
        nextStep: nextStepText || null,
        followUpDate: followUpDateText ? new Date(followUpDateText) : null,
      });
      setIsEditingNextStep(false);
      toast.success("Next step saved");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelNextStep = () => {
    if (!deal) return;
    setNextStepText(deal.nextStep || "");
    setFollowUpDateText(
      deal.followUpDate ? format(new Date(deal.followUpDate), "yyyy-MM-dd") : ""
    );
    setIsEditingNextStep(false);
  };

  const handleLogActivity = async (data: {
    type: string;
    subject?: string;
    description?: string;
    outcome?: string;
  }) => {
    if (!deal) return;
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, dealId: deal.id, contactId: deal.contactId }),
    });
    if (!res.ok) throw new Error("Failed to log activity");
    const { activity } = await res.json();
    setActivities((prev) => [activity, ...prev]);
    toast.success("Activity logged");
  };

  const handleEmailSent = async (data: {
    type: string;
    subject?: string;
    description?: string;
  }) => {
    if (!deal) return;
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        dealId: deal.id,
        contactId: deal.contactId,
        outcome: "completed",
      }),
    });
    if (!res.ok) throw new Error("Failed to log email activity");
    const { activity } = await res.json();
    setActivities((prev) => [activity, ...prev]);
  };

  const handleGenerateAIResponse = async () => {
    if (!deal) return;
    if (!deal.contact?.email) {
      toast.error("Contact has no email address");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/generate-draft`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate draft");
      }
      const { draftId } = await res.json();
      toast.success("AI draft generated! Opening in Inbox...");
      onOpenChange(false);
      router.push(`/inbox?draft=${draftId}`);
    } catch (error) {
      console.error("Error generating AI draft:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate AI response");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return {
    isUpdating,
    isDeleting,
    isActivityDialogOpen,
    setIsActivityDialogOpen,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    isLostDialogOpen,
    setIsLostDialogOpen,
    activities,
    isLoadingActivities,
    isGeneratingAI,
    isEditingNextStep,
    setIsEditingNextStep,
    nextStepText,
    setNextStepText,
    followUpDateText,
    setFollowUpDateText,
    handleStageChange,
    handleMarkWon,
    handleMarkLost,
    handleLostConfirm,
    handleDelete,
    handleSaveNextStep,
    handleCancelNextStep,
    handleLogActivity,
    handleEmailSent,
    handleGenerateAIResponse,
  };
}
