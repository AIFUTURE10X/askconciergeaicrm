import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, Building2 } from "lucide-react";
import {
  getTier,
  SOURCES,
  PROPERTY_COUNT_RANGES,
  CURRENT_SYSTEMS,
  PAIN_POINTS,
} from "@/lib/constants/pipeline";
import type { Deal } from "@/lib/db/schema";

interface DealDetailsGridProps {
  deal: Deal;
}

export function DealDetailsGrid({ deal }: DealDetailsGridProps) {
  const tier = deal.tier ? getTier(deal.tier) : null;
  const hasQualification =
    deal.leadSource || deal.propertyCountRange || deal.currentSystem || deal.painPoint;

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tier</Label>
          <div className="font-semibold">{tier ? tier.label : "Not set"}</div>
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

      {hasQualification && (
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
                    {PROPERTY_COUNT_RANGES.find((r) => r.id === deal.propertyCountRange)?.label ||
                      deal.propertyCountRange}
                  </span>
                </div>
              )}
              {deal.currentSystem && (
                <div>
                  <span className="text-muted-foreground">Using: </span>
                  <span className="font-medium">
                    {CURRENT_SYSTEMS.find((s) => s.id === deal.currentSystem)?.label ||
                      deal.currentSystem}
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
          <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{deal.notes}</p>
        </div>
      )}
    </>
  );
}
