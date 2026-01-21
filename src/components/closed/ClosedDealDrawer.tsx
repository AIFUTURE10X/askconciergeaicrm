"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  User,
  Building2,
  Calendar,
  DollarSign,
  Trophy,
  XCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getTier, LOST_REASONS, ACTIVE_STAGES } from "@/lib/constants/pipeline";
import type { Deal, Contact } from "@/lib/db/schema";

interface ClosedDealDrawerProps {
  deal: (Deal & { contact: Contact | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReopen: (dealId: string) => Promise<void>;
}

export function ClosedDealDrawer({
  deal,
  open,
  onOpenChange,
  onReopen,
}: ClosedDealDrawerProps) {
  const [isReopening, setIsReopening] = useState(false);

  if (!deal) return null;

  const tier = deal.tier ? getTier(deal.tier) : null;
  const isWon = deal.stage === "closed_won";
  const lostReasonLabel = deal.lostReason
    ? LOST_REASONS.find((r) => r.id === deal.lostReason)?.label || deal.lostReason
    : null;

  // Get the stage label for lastStage
  const lastStageLabel = deal.lastStage
    ? ACTIVE_STAGES.find((s) => s.id === deal.lastStage)?.label || deal.lastStage
    : "Lead";

  const handleReopen = async () => {
    if (!confirm(`Re-open this deal? It will return to the "${lastStageLabel}" stage.`)) {
      return;
    }

    setIsReopening(true);
    try {
      await onReopen(deal.id);
      onOpenChange(false);
      toast.success(`Deal re-opened and moved to ${lastStageLabel}`);
    } catch (error) {
      toast.error("Failed to re-open deal");
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[500px] md:w-[560px] overflow-y-auto bg-background px-4 sm:px-6">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left pr-8">{deal.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {isWon ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
                <Trophy className="h-4 w-4 mr-1.5" />
                Won
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-3 py-1">
                <XCircle className="h-4 w-4 mr-1.5" />
                Lost
              </Badge>
            )}
            {deal.closedAt && (
              <span className="text-sm text-muted-foreground">
                {format(new Date(deal.closedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {/* Re-open Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleReopen}
            disabled={isReopening}
          >
            {isReopening ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Re-open Deal
            <span className="ml-1 text-muted-foreground">
              (→ {lastStageLabel})
            </span>
          </Button>

          <Separator />

          {/* Loss Reason (if lost) */}
          {!isWon && lostReasonLabel && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <Label className="text-sm font-medium text-red-700 dark:text-red-400">
                Loss Reason
              </Label>
              <p className="mt-1 text-sm font-semibold">{lostReasonLabel}</p>
            </div>
          )}

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
              <Label className="text-xs text-muted-foreground">Last Stage</Label>
              <div className="font-semibold">{lastStageLabel}</div>
            </div>
          </div>

          {deal.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                  {deal.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 pb-2">
            <div>
              Created: {format(new Date(deal.createdAt), "MMM d, yyyy h:mm a")}
            </div>
            {deal.closedAt && (
              <div>
                Closed: {format(new Date(deal.closedAt), "MMM d, yyyy h:mm a")}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
