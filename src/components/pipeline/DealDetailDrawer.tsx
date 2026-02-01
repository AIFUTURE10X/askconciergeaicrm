"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ActivityLogDialog } from "@/components/activities/ActivityLogDialog";
import { EmailComposeDialog } from "@/components/email/EmailComposeDialog";
import { LostReasonDialog } from "@/components/pipeline/LostReasonDialog";
import { DealStageSelector } from "./DealStageSelector";
import { NextStepSection } from "./NextStepSection";
import { DealContactCard } from "./DealContactCard";
import { DealDetailsGrid } from "./DealDetailsGrid";
import { DealActivitySection } from "./DealActivitySection";
import { DealMetadataFooter } from "./DealMetadataFooter";
import { useDealActions } from "@/hooks/useDealActions";
import type { Deal, Contact } from "@/lib/db/schema";

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
  const a = useDealActions({ deal, open, onUpdate, onDelete, onOpenChange });

  if (!deal) return null;

  const isClosed = deal.stage === "closed_won" || deal.stage === "closed_lost";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[500px] md:w-[560px] overflow-y-auto bg-background px-4 sm:px-6">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left pr-8">{deal.title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <DealStageSelector
              stage={deal.stage}
              onStageChange={a.handleStageChange}
              onMarkWon={a.handleMarkWon}
              onMarkLost={a.handleMarkLost}
              isUpdating={a.isUpdating}
            />

            {!isClosed && (
              <NextStepSection
                nextStep={deal.nextStep}
                followUpDate={deal.followUpDate}
                isEditing={a.isEditingNextStep}
                nextStepText={a.nextStepText}
                followUpDateText={a.followUpDateText}
                isUpdating={a.isUpdating}
                onEditStart={() => a.setIsEditingNextStep(true)}
                onSave={a.handleSaveNextStep}
                onCancel={a.handleCancelNextStep}
                onNextStepChange={a.setNextStepText}
                onFollowUpDateChange={a.setFollowUpDateText}
              />
            )}

            <Separator />

            {deal.contact && (
              <DealContactCard
                contact={deal.contact}
                onEmailClick={() => a.setIsEmailDialogOpen(true)}
                onAIResponseClick={a.handleGenerateAIResponse}
                isGeneratingAI={a.isGeneratingAI}
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
              activities={a.activities}
              isLoading={a.isLoadingActivities}
              onLogClick={() => a.setIsActivityDialogOpen(true)}
            />

            <Separator />

            <DealMetadataFooter
              deal={deal}
              isDeleting={a.isDeleting}
              onDelete={a.handleDelete}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ActivityLogDialog
        open={a.isActivityDialogOpen}
        onOpenChange={a.setIsActivityDialogOpen}
        dealId={deal.id}
        contactId={deal.contactId || undefined}
        onSubmit={a.handleLogActivity}
      />

      {deal.contact?.email && (
        <EmailComposeDialog
          open={a.isEmailDialogOpen}
          onOpenChange={a.setIsEmailDialogOpen}
          recipientEmail={deal.contact.email}
          recipientName={deal.contact.name}
          contactId={deal.contactId || undefined}
          dealId={deal.id}
          onEmailSent={a.handleEmailSent}
        />
      )}

      <LostReasonDialog
        open={a.isLostDialogOpen}
        onOpenChange={a.setIsLostDialogOpen}
        dealTitle={deal.title}
        onConfirm={a.handleLostConfirm}
      />
    </>
  );
}
