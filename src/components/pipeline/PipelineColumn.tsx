"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { DealCard } from "./DealCard";
import { cn } from "@/lib/utils";
import type { Deal, Contact } from "@/lib/db/schema";

interface PipelineColumnProps {
  stage: {
    id: string;
    label: string;
    color: string;
  };
  deals: (Deal & { contact: Contact | null })[];
  onDealClick: (deal: Deal & { contact: Contact | null }) => void;
  selectedDeals?: Set<string>;
  onSelectDeal?: (dealId: string, selected: boolean) => void;
  selectionMode?: boolean;
  compact?: boolean;
}

export function PipelineColumn({
  stage,
  deals,
  onDealClick,
  selectedDeals,
  onSelectDeal,
  selectionMode,
  compact
}: PipelineColumnProps) {
  const totalValue = deals.reduce((sum, deal) => {
    return sum + (deal.value ? parseFloat(deal.value) : 0);
  }, 0);

  return (
    <div className={cn(
      "flex flex-col bg-muted/50 rounded-lg",
      compact ? "w-56 min-w-56" : "w-72 min-w-72"
    )}>
      {/* Column Header */}
      <div className={cn("px-3 py-2 rounded-t-lg border-b", stage.color)}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{stage.label}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <div className="text-xs mt-1 opacity-80">
            ${totalValue.toLocaleString()} total
          </div>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            {deals.map((deal, index) => (
              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "transition-transform",
                      snapshot.isDragging && "rotate-2 scale-105"
                    )}
                  >
                    <DealCard
                      deal={deal}
                      onClick={() => onDealClick(deal)}
                      isSelected={selectedDeals?.has(deal.id)}
                      onSelectChange={(selected) => onSelectDeal?.(deal.id, selected)}
                      selectionMode={selectionMode}
                      compact={compact}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {deals.length === 0 && (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                No deals
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
