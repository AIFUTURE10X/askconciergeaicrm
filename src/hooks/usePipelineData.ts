import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ACTIVE_STAGES } from "@/lib/constants/pipeline";
import { exportDealsToCSV } from "@/components/pipeline/pipeline-utils";
import type { Deal, Contact } from "@/lib/db/schema";
import type { DropResult } from "@hello-pangea/dnd";

type DealWithContact = Deal & { contact: Contact | null };

export function usePipelineData() {
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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  return {
    deals, contacts, isLoading, selectedDeal, isDetailOpen, setIsDetailOpen,
    isAddDialogOpen, setIsAddDialogOpen, selectedDeals, selectionMode, isDeleting,
    viewMode, setViewMode, activeDeals, dealsByStage,
    handleDragEnd, handleAddDeal, handleUpdateDeal, handleDeleteDeal,
    handleDealClick, handleSelectDeal, toggleSelectionMode, handleSelectAll,
    handleBulkDelete, handleExport,
  };
}
