"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnquiryTypeConfig } from "@/app/api/webhooks/inbound/constants";
import { getInitials, type DealStatus } from "./deal-card-utils";
import type { Deal, Contact } from "@/lib/db/schema";

interface DealCardMiniProps {
  deal: Deal & { contact: Contact | null };
  status: DealStatus;
  onClick?: () => void;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  selectionMode?: boolean;
}

export function DealCardMini({ deal, status, onClick, isSelected, onSelectChange, selectionMode }: DealCardMiniProps) {
  const { isOverdue, isDueToday, isStale, isWon, isLost } = status;

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
