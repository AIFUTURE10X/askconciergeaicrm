"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
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
import { ActivityLogDialog } from "@/components/activities/ActivityLogDialog";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { EmailComposeDialog } from "@/components/email/EmailComposeDialog";
import {
  PIPELINE_STAGES,
  getTier,
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
  const [activities, setActivities] = useState<ActivityWithRelations[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

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
    }
  }, [open, deal, fetchActivities]);

  if (!deal) return null;

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
    setIsUpdating(true);
    try {
      await onUpdate(deal.id, {
        stage: action === "won" ? "closed_won" : "closed_lost",
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
    </>
  );
}
