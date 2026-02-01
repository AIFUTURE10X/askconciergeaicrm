"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Linkify } from "@/components/ui/linkify";
import { Calendar, DollarSign, Building2, AlertTriangle, Clock, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTier } from "@/lib/constants/pipeline";
import { getEnquiryTypeConfig } from "@/app/api/webhooks/inbound/constants";
import { getInitials, getDealStatus } from "./deal-card-utils";
import { DealCardMini } from "./DealCardMini";
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
  const status = getDealStatus(deal);
  const { isStale, isWon, isLost, isOverdue, isDueToday, isDueTomorrow, hasFollowUp, daysSinceUpdate, followUpDate } = status;

  if (compact) {
    return (
      <DealCardMini
        deal={deal}
        status={status}
        onClick={onClick}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
        selectionMode={selectionMode}
      />
    );
  }

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
      <CardContent className="p-2.5 space-y-2">
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
              ? `OVERDUE: ${format(followUpDate!, "MMM d")}`
              : "Follow up TODAY"}
          </div>
        )}

        {/* Title */}
        <div className="font-medium text-xs line-clamp-2">{deal.title}</div>

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
          <div className="flex items-center gap-1.5">
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
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">Last: {format(new Date(deal.lastContactedAt), "MMM d, h:mm a")}</span>
          </div>
        )}

        {/* Probability */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${deal.probability || 0}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground w-7 text-right">
            {deal.probability}%
          </span>
        </div>

        {/* Next Step & Follow-up */}
        {!isWon && !isLost && (deal.nextStep || (hasFollowUp && !isOverdue && !isDueToday)) && (
          <div className="pt-1.5 border-t space-y-1">
            {deal.nextStep && (
              <p className="text-[11px] text-muted-foreground line-clamp-1">
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
