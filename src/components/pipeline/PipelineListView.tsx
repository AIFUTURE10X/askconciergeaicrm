"use client";

import { DealCardCompact } from "./DealCardCompact";
import { ACTIVE_STAGES } from "@/lib/constants/pipeline";
import { cn } from "@/lib/utils";
import type { Deal, Contact } from "@/lib/db/schema";

type DealWithContact = Deal & { contact: Contact | null };

interface PipelineListViewProps {
  deals: DealWithContact[];
  onDealClick: (deal: DealWithContact) => void;
  selectedDeals: Set<string>;
  onSelectDeal: (dealId: string, selected: boolean) => void;
  selectionMode: boolean;
}

export function PipelineListView({
  deals,
  onDealClick,
  selectedDeals,
  onSelectDeal,
  selectionMode,
}: PipelineListViewProps) {
  // Group deals by stage
  const dealsByStage = ACTIVE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = deals.filter(
        (deal) =>
          deal.stage === stage.id ||
          (stage.id === "lead" && !ACTIVE_STAGES.some((s) => s.id === deal.stage))
      );
      return acc;
    },
    {} as Record<string, DealWithContact[]>
  );

  // Filter to only show stages with deals
  const stagesWithDeals = ACTIVE_STAGES.filter(
    (stage) => dealsByStage[stage.id]?.length > 0
  );

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No active deals in the pipeline
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stagesWithDeals.map((stage) => (
        <div key={stage.id} className="space-y-2">
          {/* Stage Header */}
          <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                stage.id === "lead" && "bg-gray-400",
                stage.id === "qualified" && "bg-yellow-500",
                stage.id === "demo_scheduled" && "bg-blue-500",
                stage.id === "proposal" && "bg-orange-500",
                stage.id === "negotiation" && "bg-purple-500"
              )}
            />
            <h3 className="font-medium text-sm">{stage.label}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {dealsByStage[stage.id]?.length || 0}
            </span>
          </div>

          {/* Deals List */}
          <div className="space-y-1.5 pl-4">
            {dealsByStage[stage.id]?.map((deal) => (
              <DealCardCompact
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick(deal)}
                isSelected={selectedDeals.has(deal.id)}
                onSelectChange={(selected) => onSelectDeal(deal.id, selected)}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
