"use client";

import { format, differenceInDays, isToday, isPast, isTomorrow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Linkify } from "@/components/ui/linkify";
import { Calendar, DollarSign, Building2, AlertTriangle, Clock, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTier, getStage } from "@/lib/constants/pipeline";
import { getEnquiryTypeConfig } from "@/app/api/webhooks/inbound/constants";
import type { Deal, Contact } from "@/lib/db/schema";

interface DealCardProps {
  deal: Deal & {
    contact: Contact | null;
    lastContactedAt?: Date | string | null;
    nextStep?: string | null;
    followUpDate?: Date | string | null;
  };
  onClick?: () => void;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  selectionMode?: boolean;
  compact?: boolean;
}

export function DealCard({ deal, onClick, isSelected, onSelectChange, selectionMode, compact }: DealCardProps) {
  const tier = deal.tier ? getTier(deal.tier) : null;
  const stage = getStage(deal.stage);

  // Stale deal detection: Proposal Sent stage + 3+ days since last update
  const daysSinceUpdate = differenceInDays(new Date(), new Date(deal.updatedAt));
  const isStale = deal.stage === "proposal" && daysSinceUpdate >= 3;

  // Won/Lost status
  const isWon = deal.stage === "closed_won";
  const isLost = deal.stage === "closed_lost";

  // Follow-up date status
  const followUpDate = deal.followUpDate ? new Date(deal.followUpDate) : null;
  const isOverdue = followUpDate && isPast(followUpDate) && !isToday(followUpDate);
  const isDueToday = followUpDate && isToday(followUpDate);
  const isDueTomorrow = followUpDate && isTomorrow(followUpDate);
  const hasFollowUp = followUpDate && !isWon && !isLost;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Compact card for list view
  if (compact) {
    return (
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow bg-background",
          isOverdue && "border-l-4 border-l-red-500",
          isDueToday && !isOverdue && "border-l-4 border-l-orange-400",
          isStale && !isOverdue && !isDueToday && "border-l-4 border-l-red-400",
          isWon && "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
          isLost && "border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20 opacity-75"
        )}
        onClick={selectionMode ? undefined : onClick}
      >
        <CardContent className="p-2 space-y-1.5">
          {/* Selection + Title Row */}
          <div className="flex items-center gap-2">
            {selectionMode && (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelectChange?.(checked === true)}
                  className="data-[state=checked]:bg-primary h-3.5 w-3.5"
                />
              </div>
            )}
            {(isOverdue || isDueToday || isStale) && !isWon && !isLost && (
              <AlertTriangle className={cn(
                "h-3 w-3 shrink-0",
                isOverdue ? "text-red-500" : isDueToday ? "text-orange-500" : "text-red-400"
              )} />
            )}
            {isWon && <Trophy className="h-3 w-3 text-green-500 shrink-0" />}
            {isLost && <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
            <span className="font-medium text-xs truncate flex-1">{deal.title}</span>
            {deal.enquiryType && getEnquiryTypeConfig(deal.enquiryType) && (
              <Badge
                variant="outline"
                className={cn("text-[9px] px-1 py-0 shrink-0", getEnquiryTypeConfig(deal.enquiryType)!.color)}
              >
                {getEnquiryTypeConfig(deal.enquiryType)!.label}
              </Badge>
            )}
          </div>

          {/* Contact + Probability Row */}
          <div className="flex items-center gap-2">
            {deal.contact && (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(deal.contact.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground truncate">
                  {deal.contact.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${deal.probability || 0}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-6 text-right">
                {deal.probability}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card for board view
  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow bg-background",
        isOverdue && "border-2 border-red-500 dark:border-red-400",
        isDueToday && !isOverdue && "border-2 border-orange-400 dark:border-orange-500",
        isStale && !isOverdue && !isDueToday && "border-2 border-red-400 dark:border-red-500",
        isWon && "border-2 border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/30",
        isLost && "border-2 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950/30 opacity-75"
      )}
      onClick={selectionMode ? undefined : onClick}
    >
      <CardContent className="p-3 space-y-3">
        {/* Selection Checkbox */}
        {selectionMode && (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectChange?.(checked === true)}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-xs text-muted-foreground">Select</span>
          </div>
        )}

        {/* Status Badges */}
        {isWon && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
            <Trophy className="h-3 w-3" />
            Won
          </div>
        )}
        {isLost && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            <XCircle className="h-3 w-3" />
            Lost
          </div>
        )}
        {isStale && !isWon && !isLost && !isOverdue && !isDueToday && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            <AlertTriangle className="h-3 w-3" />
            Stale ({daysSinceUpdate}d)
          </div>
        )}

        {/* Follow-up Alert */}
        {hasFollowUp && (isOverdue || isDueToday) && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-semibold",
            isOverdue ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
          )}>
            <AlertTriangle className="h-3 w-3" />
            {isOverdue
              ? `OVERDUE: ${format(followUpDate, "MMM d")}`
              : "Follow up TODAY"}
          </div>
        )}

        {/* Title */}
        <div className="font-medium text-sm line-clamp-2">{deal.title}</div>

        {/* Enquiry Type Badge */}
        {deal.enquiryType && getEnquiryTypeConfig(deal.enquiryType) && (
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 w-fit", getEnquiryTypeConfig(deal.enquiryType)!.color)}
          >
            {getEnquiryTypeConfig(deal.enquiryType)!.label}
          </Badge>
        )}

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(deal.contact.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {deal.contact.name}
            </span>
          </div>
        )}

        {/* Tier & Value */}
        <div className="flex items-center justify-between">
          {tier && (
            <Badge variant="secondary" className="text-xs">
              {tier.label}
            </Badge>
          )}
          {deal.value && (
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {parseFloat(deal.value).toLocaleString()}
              <span className="text-xs ml-0.5">
                /{deal.billingPeriod === "annual" ? "yr" : "mo"}
              </span>
            </div>
          )}
        </div>

        {/* Property count & expected close */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {deal.propertyCount && deal.propertyCount > 1 && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {deal.propertyCount} properties
            </div>
          )}
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(deal.expectedCloseDate), "MMM d")}
            </div>
          )}
        </div>

        {/* Last Contacted */}
        {deal.lastContactedAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last contact: {format(new Date(deal.lastContactedAt), "MMM d, h:mm a")}</span>
          </div>
        )}

        {/* Probability */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${deal.probability || 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">
            {deal.probability}%
          </span>
        </div>

        {/* Next Step & Follow-up (if not overdue/today, show normally) */}
        {!isWon && !isLost && (deal.nextStep || (hasFollowUp && !isOverdue && !isDueToday)) && (
          <div className="pt-2 border-t space-y-1">
            {deal.nextStep && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                <span className="font-medium text-foreground">Next:</span>{" "}
                <Linkify>{deal.nextStep}</Linkify>
              </p>
            )}
            {hasFollowUp && !isOverdue && !isDueToday && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isDueTomorrow
                  ? "text-yellow-600 dark:text-yellow-500 font-medium"
                  : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                {isDueTomorrow
                  ? "Tomorrow"
                  : format(followUpDate!, "MMM d")}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
