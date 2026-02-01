import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { DraftWithRelations } from "@/components/inbox/DraftCard";
import type { StatusFilter, EnquiryTypeFilter, ViewMode } from "./InboxToolbar";
import {
  fetchDrafts as fetchDraftsApi,
  syncGmail,
  sendDraft,
  regenerateDraft,
  saveDraft,
  deleteDraft,
  bulkDeleteDrafts,
} from "./inbox-actions";

export function useInbox() {
  const [rawDrafts, setRawDrafts] = useState<DraftWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDraft, setSelectedDraft] = useState<DraftWithRelations | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const [enquiryType, setEnquiryType] = useState<EnquiryTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getFilteredDrafts = useCallback(
    (data: DraftWithRelations[]): DraftWithRelations[] => {
      let filtered = data;
      if (enquiryType !== "all") {
        filtered = filtered.filter((d) => d.deal?.enquiryType === enquiryType);
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.originalFromName?.toLowerCase().includes(q) ||
            d.originalFromEmail?.toLowerCase().includes(q) ||
            d.originalSubject?.toLowerCase().includes(q) ||
            d.draftSubject?.toLowerCase().includes(q) ||
            d.deal?.title?.toLowerCase().includes(q)
        );
      }
      return filtered;
    },
    [enquiryType, debouncedSearch]
  );

  const drafts = getFilteredDrafts(rawDrafts);

  const loadDrafts = useCallback(async () => {
    try {
      const data = await fetchDraftsApi(filter);
      setRawDrafts(data);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [filter, enquiryType, debouncedSearch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDrafts();
    setIsRefreshing(false);
    setSelectedIds(new Set());
    toast.success("Inbox refreshed");
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const result = await syncGmail();
      if (result.success && result.processed > 0) {
        await loadDrafts();
      }
    } catch {
      toast.error("Failed to sync emails");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSend = async (id: string) => {
    setSendingId(id);
    try {
      await sendDraft(id);
      setRawDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "sent", sentAt: new Date() } : d))
      );
      if (filter === "pending") {
        setRawDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  const handleRegenerate = async (id: string, tone?: string, feedback?: string) => {
    try {
      const draft = await regenerateDraft(id, tone, feedback);
      if (draft) {
        setRawDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...draft } : d)));
        if (selectedDraft?.id === id) {
          setSelectedDraft({ ...selectedDraft, ...draft });
        }
      }
    } catch {
      toast.error("Failed to regenerate draft");
    }
  };

  const handleSave = async (id: string, data: { draftSubject: string; draftBody: string }) => {
    try {
      const draft = await saveDraft(id, data);
      if (draft) {
        setRawDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...draft } : d)));
        if (selectedDraft?.id === id) {
          setSelectedDraft({ ...selectedDraft, ...draft });
        }
      }
    } catch {
      toast.error("Failed to save draft");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    setDeletingId(id);
    try {
      await deleteDraft(id);
      setRawDrafts((prev) => prev.filter((d) => d.id !== id));
      if (selectedDraft?.id === id) setSelectedDraft(null);
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      toast.error("Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} draft(s)?`)) return;
    setIsBulkDeleting(true);
    try {
      await bulkDeleteDrafts(Array.from(selectedIds));
      setRawDrafts((prev) => prev.filter((d) => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to delete drafts");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectionMode && selectedIds.size === drafts.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else if (selectionMode && selectedIds.size > 0) {
      setSelectedIds(new Set(drafts.map((d) => d.id)));
    } else {
      setSelectionMode(true);
      setSelectedIds(new Set(drafts.map((d) => d.id)));
    }
  };

  const cancelSelection = () => { setSelectedIds(new Set()); setSelectionMode(false); };

  const pendingCount = drafts.filter((d) => d.status === "pending" || d.status === "generating").length;
  const allSelected = drafts.length > 0 && selectedIds.size === drafts.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < drafts.length;

  return {
    drafts, rawDrafts, isLoading, isRefreshing, filter, setFilter,
    viewMode, setViewMode, selectedDraft, setSelectedDraft,
    deletingId, sendingId, isSyncing, selectedIds, isBulkDeleting, selectionMode,
    enquiryType, setEnquiryType, searchQuery, setSearchQuery,
    handleRefresh, handleSyncNow, handleSend, handleRegenerate,
    handleSave, handleDelete, handleBulkDelete,
    toggleSelect, toggleSelectAll, cancelSelection,
    pendingCount, allSelected, someSelected,
  };
}
