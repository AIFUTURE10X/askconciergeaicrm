"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, XCircle, DollarSign, Calendar } from "lucide-react";
import { LOST_REASONS } from "@/lib/constants/pipeline";
import type { Deal, Contact } from "@/lib/db/schema";

type DealWithContact = Deal & { contact: Contact | null };

interface ClosedDealCardProps {
  deal: DealWithContact;
  onClick: () => void;
}

export function ClosedDealCard({ deal, onClick }: ClosedDealCardProps) {
  const isWon = deal.stage === "closed_won";
  const lostReasonLabel = deal.lostReason
    ? LOST_REASONS.find((r) => r.id === deal.lostReason)?.label
    : null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col ${
        isWon
          ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
          : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col flex-1">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-2">
          {isWon ? (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              Won
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Lost
            </Badge>
          )}
          {deal.closedAt && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(deal.closedAt), "MMM d")}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{deal.title}</h3>

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(deal.contact.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {deal.contact.name}
            </span>
          </div>
        )}

        {/* Loss Reason (if lost) */}
        {!isWon && lostReasonLabel && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">
            {lostReasonLabel}
          </p>
        )}

        {/* Value */}
        <div className="mt-auto pt-2 border-t flex items-center justify-between">
          <div className="flex items-center text-sm font-semibold">
            <DollarSign className="h-4 w-4" />
            {deal.value ? parseFloat(deal.value).toLocaleString() : "0"}
          </div>
          <span className="text-xs text-muted-foreground">
            /{deal.billingPeriod === "annual" ? "yr" : "mo"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
