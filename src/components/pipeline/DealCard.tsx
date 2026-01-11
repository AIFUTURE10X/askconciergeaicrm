"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, DollarSign, Building2 } from "lucide-react";
import { getTier, getStage } from "@/lib/constants/pipeline";
import type { Deal, Contact } from "@/lib/db/schema";

interface DealCardProps {
  deal: Deal & { contact: Contact | null };
  onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const tier = deal.tier ? getTier(deal.tier) : null;
  const stage = getStage(deal.stage);

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
      className="cursor-pointer hover:shadow-md transition-shadow bg-background"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-3">
        {/* Title */}
        <div className="font-medium text-sm line-clamp-2">{deal.title}</div>

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
      </CardContent>
    </Card>
  );
}
