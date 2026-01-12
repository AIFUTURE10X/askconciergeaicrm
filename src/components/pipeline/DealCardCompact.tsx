"use client";

import { format, differenceInDays, isToday, isPast, isTomorrow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTier, getStage } from "@/lib/constants/pipeline";
import { getEnquiryTypeConfig } from "@/app/api/webhooks/inbound/constants";
import type { Deal, Contact } from "@/lib/db/schema";

interface DealCardCompactProps {
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
}

export function DealCardCompact({
  deal,
  onClick,
  isSelected,
  onSelectChange,
  selectionMode,
}: DealCardCompactProps) {
  const tier = deal.tier ? getTier(deal.tier) : null;
  const stage = getStage(deal.stage);

  const daysSinceUpdate = differenceInDays(new Date(), new Date(deal.updatedAt));
  const isStale = deal.stage === "proposal" && daysSinceUpdate >= 3;

  const followUpDate = deal.followUpDate ? new Date(deal.followUpDate) : null;
  const isOverdue = followUpDate && isPast(followUpDate) && !isToday(followUpDate);
  const isDueToday = followUpDate && isToday(followUpDate);
  const isDueTomorrow = followUpDate && isTomorrow(followUpDate);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg border bg-background cursor-pointer hover:bg-muted/50 transition-colors",
        isOverdue && "border-l-4 border-l-red-500",
        isDueToday && !isOverdue && "border-l-4 border-l-orange-400",
        isStale && !isOverdue && !isDueToday && "border-l-4 border-l-red-400"
      )}
      onClick={selectionMode ? undefined : onClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      )}

      {/* Contact Avatar */}
      {deal.contact && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(deal.contact.name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{deal.title}</span>
          {/* Alert indicators */}
          {(isOverdue || isDueToday || isStale) && (
            <AlertTriangle
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isOverdue ? "text-red-500" : isDueToday ? "text-orange-500" : "text-red-400"
              )}
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {deal.contact && <span>{deal.contact.name}</span>}
          {deal.contact && stage && <span>·</span>}
          {stage && <span className={stage.color}>{stage.label}</span>}
        </div>
      </div>

      {/* Enquiry Type Badge */}
      {deal.enquiryType && getEnquiryTypeConfig(deal.enquiryType) && (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 shrink-0",
            getEnquiryTypeConfig(deal.enquiryType)!.color
          )}
        >
          {getEnquiryTypeConfig(deal.enquiryType)!.label}
        </Badge>
      )}

      {/* Tier */}
      {tier && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {tier.label}
        </Badge>
      )}

      {/* Value */}
      {deal.value && (
        <div className="flex items-center text-xs text-muted-foreground shrink-0">
          <DollarSign className="h-3 w-3" />
          {parseFloat(deal.value).toLocaleString()}
        </div>
      )}

      {/* Follow-up Date */}
      {followUpDate && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs shrink-0",
            isOverdue
              ? "text-red-500 font-medium"
              : isDueToday
                ? "text-orange-500 font-medium"
                : isDueTomorrow
                  ? "text-yellow-600 font-medium"
                  : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3 w-3" />
          {isOverdue
            ? "Overdue"
            : isDueToday
              ? "Today"
              : isDueTomorrow
                ? "Tomorrow"
                : format(followUpDate, "MMM d")}
        </div>
      )}

      {/* Last Contact */}
      {deal.lastContactedAt && !followUpDate && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />
          {format(new Date(deal.lastContactedAt), "MMM d")}
        </div>
      )}

      {/* Probability */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${deal.probability || 0}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-7 text-right">
          {deal.probability}%
        </span>
      </div>
    </div>
  );
}
