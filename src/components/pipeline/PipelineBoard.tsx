"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { PipelineColumn } from "./PipelineColumn";
import { DealDetailDrawer } from "./DealDetailDrawer";
import { AddDealDialog } from "./AddDealDialog";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Download, Trash2, LayoutGrid, List } from "lucide-react";
import { ACTIVE_STAGES } from "@/lib/constants/pipeline";
import { exportDealsToCSV } from "./pipeline-utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { Deal, Contact } from "@/lib/db/schema";

type DealWithContact = Deal & { contact: Contact | null };

export function PipelineBoard() {
  const [deals, setDeals] = useState<DealWithContact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const isMobile = useIsMobile();

  // On mobile, always use list view (compact)
  const effectiveViewMode = isMobile ? "list" : viewMode;

  const fetchData = useCallback(async () => {
    try {
      const [dealsRes, contactsRes] = await Promise.all([
        fetch("/api/deals"),
        fetch("/api/contacts"),
      ]);
      if (dealsRes.ok) {
        const { deals: dealData } = await dealsRes.json();
        setDeals(dealData);
      }
      if (contactsRes.ok) {
        const { contacts: contactData } = await contactsRes.json();
        setContacts(contactData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load pipeline data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeDeals = deals.filter(
    (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
  );

  const dealsByStage = ACTIVE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = activeDeals.filter(
        (deal) =>
          deal.stage === stage.id ||
          (stage.id === "lead" && !ACTIVE_STAGES.some((s) => s.id === deal.stage))
      );
      return acc;
    },
    {} as Record<string, DealWithContact[]>
  );

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const dealId = draggableId;
    const newStage = destination.droppableId;

    setDeals((prev) =>
      prev.map((deal) => (deal.id === dealId ? { ...deal, stage: newStage } : deal))
    );

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed to update deal");
      const { deal: updatedDeal } = await res.json();
      setDeals((prev) => prev.map((d) => (d.id === dealId ? updatedDeal : d)));
      toast.success(`Moved to ${ACTIVE_STAGES.find((s) => s.id === newStage)?.label}`);
    } catch {
      fetchData();
      toast.error("Failed to move deal");
    }
  };

  const handleAddDeal = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create deal");
    }
    const { deal } = await res.json();
    setDeals((prev) => [deal, ...prev]);
    toast.success("Deal created successfully");
  };

  const handleUpdateDeal = async (id: string, data: Partial<Deal>) => {
    const res = await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update deal");
    }
    const { deal } = await res.json();
    setDeals((prev) => prev.map((d) => (d.id === id ? deal : d)));
    setSelectedDeal(deal);
    toast.success("Deal updated");
  };

  const handleDeleteDeal = async (id: string) => {
    const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete deal");
    }
    setDeals((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deal deleted");
  };

  const handleDealClick = (deal: DealWithContact) => {
    setSelectedDeal(deal);
    setIsDetailOpen(true);
  };

  const handleSelectDeal = (dealId: string, selected: boolean) => {
    setSelectedDeals((prev) => {
      const next = new Set(prev);
      selected ? next.add(dealId) : next.delete(dealId);
      return next;
    });
  };

  const toggleSelectionMode = () => {
    if (selectionMode) setSelectedDeals(new Set());
    setSelectionMode(!selectionMode);
  };

  const handleSelectAll = () => {
    setSelectedDeals(
      selectedDeals.size === activeDeals.length
        ? new Set()
        : new Set(activeDeals.map((d) => d.id))
    );
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.size === 0) return;
    if (!window.confirm(`Delete ${selectedDeals.size} deal(s)? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/deals/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedDeals) }),
      });
      if (!res.ok) throw new Error("Failed to delete deals");
      const { deletedCount } = await res.json();
      setDeals((prev) => prev.filter((d) => !selectedDeals.has(d.id)));
      setSelectedDeals(new Set());
      setSelectionMode(false);
      toast.success(`${deletedCount} deal(s) deleted`);
    } catch {
      toast.error("Failed to delete deals");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    exportDealsToCSV(deals);
    toast.success("Deals exported to CSV");
  };

  if (isLoading) {
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
        description={`${activeDeals.length} active deals`}
        action={{ label: "Add Deal", onClick: () => setIsAddDialogOpen(true) }}
      />

      <div className="px-3 sm:px-6 pt-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {activeDeals.length > 0 && (
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className="touch-manipulation"
            >
              {selectionMode ? "Cancel" : "Select"}
            </Button>
          )}
          {selectionMode && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDeals.size === activeDeals.length && activeDeals.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {selectedDeals.size}/{activeDeals.length}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedDeals.size === 0 || isDeleting}
                className="touch-manipulation"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Delete </span>({selectedDeals.size})
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle - hidden on mobile (forced to list view) */}
          {!isMobile && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "board" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none px-2.5"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none px-2.5"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          {activeDeals.length > 0 && !selectionMode && (
            <Button variant="outline" size="sm" onClick={handleExport} className="touch-manipulation">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-6 pt-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4">
            {ACTIVE_STAGES.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage[stage.id] || []}
                onDealClick={handleDealClick}
                selectedDeals={selectedDeals}
                onSelectDeal={handleSelectDeal}
                selectionMode={selectionMode}
                compact={effectiveViewMode === "list"}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      <AddDealDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddDeal}
        contacts={contacts}
      />

      <DealDetailDrawer
        deal={selectedDeal}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={handleUpdateDeal}
        onDelete={handleDeleteDeal}
      />
    </>
  );
}
