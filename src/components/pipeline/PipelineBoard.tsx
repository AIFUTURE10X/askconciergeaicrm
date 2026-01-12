"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { PipelineColumn } from "./PipelineColumn";
import { DealDetailDrawer } from "./DealDetailDrawer";
import { AddDealDialog } from "./AddDealDialog";
import { Header } from "@/components/layout/Header";
import { ACTIVE_STAGES, ALL_KANBAN_STAGES } from "@/lib/constants/pipeline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Download, Trash2, Archive, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { PIPELINE_STAGES, TIERS } from "@/lib/constants/pipeline";
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
  const [showClosedDeals, setShowClosedDeals] = useState(true);

  // Fetch deals and contacts
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

  // Determine which stages to show based on toggle
  const visibleStages = showClosedDeals ? ALL_KANBAN_STAGES : ACTIVE_STAGES;

  // Group deals by stage
  const dealsByStage = visibleStages.reduce(
    (acc, stage) => {
      acc[stage.id] = deals.filter(
        (deal) =>
          deal.stage === stage.id ||
          (stage.id === "lead" &&
            !ALL_KANBAN_STAGES.some((s) => s.id === deal.stage))
      );
      return acc;
    },
    {} as Record<string, DealWithContact[]>
  );

  // Count closed deals
  const closedDealsCount = deals.filter(
    (d) => d.stage === "closed_won" || d.stage === "closed_lost"
  ).length;

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const dealId = draggableId;
    const newStage = destination.droppableId;

    // Optimistic update
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId ? { ...deal, stage: newStage } : deal
      )
    );

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) throw new Error("Failed to update deal");

      const { deal: updatedDeal } = await res.json();
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? updatedDeal : d))
      );

      toast.success(`Moved to ${ALL_KANBAN_STAGES.find((s) => s.id === newStage)?.label}`);
    } catch (error) {
      // Revert on error
      fetchData();
      toast.error("Failed to move deal");
    }
  };

  // Handle deal creation
  const handleAddDeal = async (data: {
    title: string;
    contactId?: string;
    tier?: string;
    value?: number;
    billingPeriod?: string;
    propertyCount?: number;
    expectedCloseDate?: string;
    notes?: string;
  }) => {
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

  // Handle deal update
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

  // Handle deal deletion
  const handleDeleteDeal = async (id: string) => {
    const res = await fetch(`/api/deals/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete deal");
    }

    setDeals((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deal deleted");
  };

  // Handle deal click
  const handleDealClick = (deal: DealWithContact) => {
    setSelectedDeal(deal);
    setIsDetailOpen(true);
  };

  // Handle deal selection
  const handleSelectDeal = (dealId: string, selected: boolean) => {
    setSelectedDeals((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(dealId);
      } else {
        next.delete(dealId);
      }
      return next;
    });
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedDeals(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  // Select all deals
  const handleSelectAll = () => {
    if (selectedDeals.size === deals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(deals.map((d) => d.id)));
    }
  };

  // Bulk delete selected deals
  const handleBulkDelete = async () => {
    if (selectedDeals.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDeals.size} deal(s)? This cannot be undone.`
    );
    if (!confirmed) return;

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
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Failed to delete deals");
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const exportDealsToCSV = () => {
    const headers = [
      "Title",
      "Contact",
      "Company",
      "Stage",
      "Tier",
      "Value",
      "Billing Period",
      "Properties",
      "Probability",
      "Expected Close",
      "Notes",
      "Created",
    ];

    const rows = deals.map((d) => [
      d.title,
      d.contact?.name || "",
      d.contact?.company || "",
      PIPELINE_STAGES.find((s) => s.id === d.stage)?.label || d.stage,
      TIERS.find((t) => t.id === d.tier)?.label || "",
      d.value ? parseFloat(d.value).toString() : "",
      d.billingPeriod || "",
      d.propertyCount?.toString() || "1",
      d.probability?.toString() || "",
      d.expectedCloseDate
        ? format(new Date(d.expectedCloseDate), "yyyy-MM-dd")
        : "",
      (d.notes || "").replace(/"/g, '""'),
      format(new Date(d.createdAt), "yyyy-MM-dd"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `deals-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.click();
    URL.revokeObjectURL(url);
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
        description={`${deals.length} deals in pipeline`}
        action={{
          label: "Add Deal",
          onClick: () => setIsAddDialogOpen(true),
        }}
      />

      <div className="px-6 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {deals.length > 0 && (
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              {selectionMode ? "Cancel" : "Select"}
            </Button>
          )}
          {selectionMode && (
            <>
              <div className="flex items-center gap-2 ml-2">
                <Checkbox
                  checked={selectedDeals.size === deals.length && deals.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({selectedDeals.size}/{deals.length})
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedDeals.size === 0 || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete ({selectedDeals.size})
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showClosedDeals ? "default" : "outline"}
            size="sm"
            onClick={() => setShowClosedDeals(!showClosedDeals)}
          >
            {showClosedDeals ? (
              <Eye className="h-4 w-4 mr-2" />
            ) : (
              <EyeOff className="h-4 w-4 mr-2" />
            )}
            Closed ({closedDealsCount})
          </Button>
          {deals.length > 0 && !selectionMode && (
            <Button variant="outline" size="sm" onClick={exportDealsToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 pt-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {visibleStages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage[stage.id] || []}
                onDealClick={handleDealClick}
                selectedDeals={selectedDeals}
                onSelectDeal={handleSelectDeal}
                selectionMode={selectionMode}
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
