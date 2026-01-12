"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActivityLogDialog } from "@/components/activities/ActivityLogDialog";
import { EmailComposeDialog } from "@/components/email/EmailComposeDialog";
import { LostReasonDialog } from "@/components/pipeline/LostReasonDialog";
import { DealStageSelector } from "./DealStageSelector";
import { NextStepSection } from "./NextStepSection";
import { DealContactCard } from "./DealContactCard";
import { DealDetailsGrid } from "./DealDetailsGrid";
import { DealActivitySection } from "./DealActivitySection";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Deal, Contact, Activity } from "@/lib/db/schema";

type ActivityWithRelations = Activity & {
  deal?: Deal | null;
  contact?: Contact | null;
};

interface DealDetailDrawerProps {
  deal: (Deal & { contact: Contact | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DealDetailDrawer({
  deal,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: DealDetailDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityWithRelations[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Next step editing state
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

  if (!deal) return null;

  const isClosed = deal.stage === "closed_won" || deal.stage === "closed_lost";

  const handleStageChange = async (newStage: string) => {
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, { stage: newStage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkWon = async () => {
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[500px] sm:w-[560px] overflow-y-auto bg-background px-6">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left pr-8">{deal.title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <DealStageSelector
              stage={deal.stage}
              onStageChange={handleStageChange}
              onMarkWon={handleMarkWon}
              onMarkLost={handleMarkLost}
              isUpdating={isUpdating}
            />

            {!isClosed && (
              <NextStepSection
                nextStep={deal.nextStep}
                followUpDate={deal.followUpDate}
                isEditing={isEditingNextStep}
                nextStepText={nextStepText}
                followUpDateText={followUpDateText}
                isUpdating={isUpdating}
                onEditStart={() => setIsEditingNextStep(true)}
                onSave={handleSaveNextStep}
                onCancel={handleCancelNextStep}
                onNextStepChange={setNextStepText}
                onFollowUpDateChange={setFollowUpDateText}
              />
            )}

            <Separator />

            {deal.contact && (
              <DealContactCard
                contact={deal.contact}
                onEmailClick={() => setIsEmailDialogOpen(true)}
              />
            )}

            <DealDetailsGrid
              deal={deal}
              onProbabilityChange={async (probability) => {
                await onUpdate(deal.id, { probability });
              }}
            />

            <Separator />

            <DealActivitySection
              activities={activities}
              isLoading={isLoadingActivities}
              onLogClick={() => setIsActivityDialogOpen(true)}
            />

            <Separator />

            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-1 pb-2">
              <div>Created: {format(new Date(deal.createdAt), "MMM d, yyyy h:mm a")}</div>
              <div>Updated: {format(new Date(deal.updatedAt), "MMM d, yyyy h:mm a")}</div>
              {deal.closedAt && (
                <div>Closed: {format(new Date(deal.closedAt), "MMM d, yyyy h:mm a")}</div>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Deal
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ActivityLogDialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
        dealId={deal.id}
        contactId={deal.contactId || undefined}
        onSubmit={handleLogActivity}
      />

      {deal.contact?.email && (
        <EmailComposeDialog
          open={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
          recipientEmail={deal.contact.email}
          recipientName={deal.contact.name}
          contactId={deal.contactId || undefined}
          dealId={deal.id}
          onEmailSent={handleEmailSent}
        />
      )}

      <LostReasonDialog
        open={isLostDialogOpen}
        onOpenChange={setIsLostDialogOpen}
        dealTitle={deal.title}
        onConfirm={handleLostConfirm}
      />
    </>
  );
}
