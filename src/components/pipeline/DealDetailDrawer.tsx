"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isToday, isPast, isTomorrow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActivityLogDialog } from "@/components/activities/ActivityLogDialog";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { EmailComposeDialog } from "@/components/email/EmailComposeDialog";
import { LostReasonDialog } from "@/components/pipeline/LostReasonDialog";
import {
  PIPELINE_STAGES,
  getTier,
  SOURCES,
  PROPERTY_COUNT_RANGES,
  CURRENT_SYSTEMS,
  PAIN_POINTS,
} from "@/lib/constants/pipeline";
import {
  User,
  Building2,
  Calendar,
  DollarSign,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  MessageSquare,
  Mail,
  AlertTriangle,
  Clock,
  Edit2,
  Save,
  X,
} from "lucide-react";
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

  // Fetch activities when deal changes
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
      // Initialize next step form
      setNextStepText(deal.nextStep || "");
      setFollowUpDateText(
        deal.followUpDate
          ? format(new Date(deal.followUpDate), "yyyy-MM-dd")
          : ""
      );
      setIsEditingNextStep(false);
    }
  }, [open, deal, fetchActivities]);

  if (!deal) return null;

  // Follow-up date status
  const followUpDate = deal.followUpDate ? new Date(deal.followUpDate) : null;
  const isOverdue = followUpDate && isPast(followUpDate) && !isToday(followUpDate);
  const isDueToday = followUpDate && isToday(followUpDate);
  const isDueTomorrow = followUpDate && isTomorrow(followUpDate);

  const tier = deal.tier ? getTier(deal.tier) : null;

  const handleStageChange = async (newStage: string) => {
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, { stage: newStage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickAction = async (action: "won" | "lost") => {
    if (action === "lost") {
      setIsLostDialogOpen(true);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(deal.id, {
        stage: "closed_won",
      });
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLostConfirm = async (reason: string, notes?: string) => {
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, {
        stage: "closed_lost",
        lostReason: reason,
        notes: notes ? (deal.notes ? `${deal.notes}\n\nLost reason: ${notes}` : `Lost reason: ${notes}`) : deal.notes,
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
      deal.followUpDate
        ? format(new Date(deal.followUpDate), "yyyy-MM-dd")
        : ""
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
      body: JSON.stringify({
        ...data,
        dealId: deal.id,
        contactId: deal.contactId,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to log activity");
    }

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
            {/* Stage Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stage</Label>
              <Select
                value={deal.stage}
                onValueChange={handleStageChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Actions */}
            {deal.stage !== "closed_won" && deal.stage !== "closed_lost" && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  onClick={() => handleQuickAction("won")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Won
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => handleQuickAction("lost")}
                  disabled={isUpdating}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark Lost
                </Button>
              </div>
            )}

            {/* Next Step Section - Most Important! */}
            {deal.stage !== "closed_won" && deal.stage !== "closed_lost" && (
              <div className={`p-4 rounded-lg border-2 ${
                isOverdue
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                  : isDueToday
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                  : isDueTomorrow
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
                  : "border-primary/30 bg-primary/5"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Next Step
                  </Label>
                  {!isEditingNextStep ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNextStep(true)}
                      className="h-7 px-2"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveNextStep}
                        disabled={isUpdating}
                        className="h-7 px-2 text-green-600 hover:text-green-700"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelNextStep}
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingNextStep ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        What needs to happen next?
                      </Label>
                      <Textarea
                        value={nextStepText}
                        onChange={(e) => setNextStepText(e.target.value)}
                        placeholder="e.g., Follow up on proposal, Schedule demo..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Follow-up Date
                      </Label>
                      <Input
                        type="date"
                        value={followUpDateText}
                        onChange={(e) => setFollowUpDateText(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deal.nextStep ? (
                      <p className="text-sm font-medium">{deal.nextStep}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No next step defined - click Edit to add one
                      </p>
                    )}
                    {followUpDate && (
                      <div className={`flex items-center gap-2 text-sm ${
                        isOverdue
                          ? "text-red-600 dark:text-red-400 font-semibold"
                          : isDueToday
                          ? "text-orange-600 dark:text-orange-400 font-semibold"
                          : "text-muted-foreground"
                      }`}>
                        {isOverdue && <AlertTriangle className="h-4 w-4" />}
                        <Calendar className="h-4 w-4" />
                        <span>
                          {isOverdue
                            ? `Overdue: ${format(followUpDate, "MMM d, yyyy")}`
                            : isDueToday
                            ? "Due Today"
                            : isDueTomorrow
                            ? "Due Tomorrow"
                            : format(followUpDate, "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Contact */}
            {deal.contact && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Contact</Label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{deal.contact.name}</div>
                    {deal.contact.company && (
                      <div className="text-sm text-muted-foreground truncate">
                        {deal.contact.company}
                      </div>
                    )}
                  </div>
                  {deal.contact.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={() => setIsEmailDialogOpen(true)}
                    >
                      <Mail className="h-4 w-4 mr-1.5" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Deal Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tier</Label>
                <div className="font-semibold">
                  {tier ? tier.label : "Not set"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Value</Label>
                <div className="font-semibold flex items-center">
                  <DollarSign className="h-4 w-4" />
                  {deal.value ? parseFloat(deal.value).toLocaleString() : "0"}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    /{deal.billingPeriod === "annual" ? "yr" : "mo"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Properties</Label>
                <div className="font-semibold flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  {deal.propertyCount || 1}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Probability</Label>
                <div className="font-semibold">{deal.probability}%</div>
              </div>
            </div>

            {deal.expectedCloseDate && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Expected Close</Label>
                <div className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {format(new Date(deal.expectedCloseDate), "MMMM d, yyyy")}
                </div>
              </div>
            )}

            {/* Qualification Info */}
            {(deal.leadSource || deal.propertyCountRange || deal.currentSystem || deal.painPoint) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qualification</Label>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {deal.leadSource && (
                      <div>
                        <span className="text-muted-foreground">Source: </span>
                        <span className="font-medium">
                          {SOURCES.find((s) => s.id === deal.leadSource)?.label || deal.leadSource}
                        </span>
                      </div>
                    )}
                    {deal.propertyCountRange && (
                      <div>
                        <span className="text-muted-foreground">Properties: </span>
                        <span className="font-medium">
                          {PROPERTY_COUNT_RANGES.find((r) => r.id === deal.propertyCountRange)?.label || deal.propertyCountRange}
                        </span>
                      </div>
                    )}
                    {deal.currentSystem && (
                      <div>
                        <span className="text-muted-foreground">Using: </span>
                        <span className="font-medium">
                          {CURRENT_SYSTEMS.find((s) => s.id === deal.currentSystem)?.label || deal.currentSystem}
                        </span>
                      </div>
                    )}
                    {deal.painPoint && (
                      <div>
                        <span className="text-muted-foreground">Pain: </span>
                        <span className="font-medium">
                          {PAIN_POINTS.find((p) => p.id === deal.painPoint)?.label || deal.painPoint}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {deal.notes && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                  {deal.notes}
                </p>
              </div>
            )}

            <Separator />

            {/* Activity Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  Activity
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsActivityDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Log Activity
                </Button>
              </div>

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ActivityTimeline activities={activities} />
              )}
            </div>

            <Separator />

            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-1 pb-2">
              <div>
                Created: {format(new Date(deal.createdAt), "MMM d, yyyy h:mm a")}
              </div>
              <div>
                Updated: {format(new Date(deal.updatedAt), "MMM d, yyyy h:mm a")}
              </div>
              {deal.closedAt && (
                <div>
                  Closed: {format(new Date(deal.closedAt), "MMM d, yyyy h:mm a")}
                </div>
              )}
            </div>

            {/* Delete Button */}
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
