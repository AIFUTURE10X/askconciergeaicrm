"use client";

import { DragDropContext } from "@hello-pangea/dnd";
import { PipelineColumn } from "./PipelineColumn";
import { DealDetailDrawer } from "./DealDetailDrawer";
import { AddDealDialog } from "./AddDealDialog";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { ACTIVE_STAGES } from "@/lib/constants/pipeline";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { usePipelineData } from "@/hooks/usePipelineData";
import { PipelineToolbar } from "./PipelineToolbar";

export function PipelineBoard() {
  const p = usePipelineData();
  const isMobile = useIsMobile();
  const effectiveViewMode = isMobile ? "list" : p.viewMode;

  if (p.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Pipeline"
        description={`${p.activeDeals.length} active deals`}
        action={{ label: "Add Deal", onClick: () => p.setIsAddDialogOpen(true) }}
      />

      <PipelineToolbar
        activeDealsCount={p.activeDeals.length}
        selectionMode={p.selectionMode}
        selectedCount={p.selectedDeals.size}
        isDeleting={p.isDeleting}
        viewMode={p.viewMode}
        isMobile={isMobile}
        onToggleSelectionMode={p.toggleSelectionMode}
        onSelectAll={p.handleSelectAll}
        onBulkDelete={p.handleBulkDelete}
        onViewModeChange={p.setViewMode}
        onExport={p.handleExport}
      />

      <div className="p-3 sm:p-6 pt-4">
        <DragDropContext onDragEnd={p.handleDragEnd}>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4">
            {ACTIVE_STAGES.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={p.dealsByStage[stage.id] || []}
                onDealClick={p.handleDealClick}
                selectedDeals={p.selectedDeals}
                onSelectDeal={p.handleSelectDeal}
                selectionMode={p.selectionMode}
                compact={effectiveViewMode === "list"}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      <AddDealDialog
        open={p.isAddDialogOpen}
        onOpenChange={p.setIsAddDialogOpen}
        onSubmit={p.handleAddDeal}
        contacts={p.contacts}
      />

      <DealDetailDrawer
        deal={p.selectedDeal}
        open={p.isDetailOpen}
        onOpenChange={p.setIsDetailOpen}
        onUpdate={p.handleUpdateDeal}
        onDelete={p.handleDeleteDeal}
      />
    </>
  );
}
