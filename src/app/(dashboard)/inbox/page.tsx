"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DraftCard, type DraftWithRelations } from "@/components/inbox/DraftCard";
import { DraftListRow } from "@/components/inbox/DraftListRow";
import { DraftDetailSheet } from "@/components/inbox/DraftDetailSheet";
import { InboxToolbar, type StatusFilter, type EnquiryTypeFilter, type ViewMode } from "./InboxToolbar";
import { InboxEmptyState } from "./InboxEmptyState";
import {
  fetchDrafts as fetchDraftsApi,
  syncGmail,
  sendDraft,
  regenerateDraft,
  saveDraft,
  deleteDraft,
  bulkDeleteDrafts,
} from "./inbox-actions";

// Component that handles URL params and auto-selects draft
function DraftUrlHandler({
  drafts,
  isLoading,
  filter,
  onFilterChange,
  onSelectDraft,
}: {
  drafts: DraftWithRelations[];
  isLoading: boolean;
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  onSelectDraft: (draft: DraftWithRelations) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get("draft");
  const [hasHandledUrlDraft, setHasHandledUrlDraft] = useState(false);

  useEffect(() => {
    if (draftIdFromUrl && !hasHandledUrlDraft && drafts.length > 0) {
      const draftFromUrl = drafts.find((d) => d.id === draftIdFromUrl);
      if (draftFromUrl) {
        onSelectDraft(draftFromUrl);
        setHasHandledUrlDraft(true);
        router.replace("/inbox", { scroll: false });
      } else if (!isLoading) {
        if (filter !== "all") {
          onFilterChange("all");
        } else {
          setHasHandledUrlDraft(true);
          router.replace("/inbox", { scroll: false });
        }
      }
    }
  }, [draftIdFromUrl, drafts, hasHandledUrlDraft, isLoading, filter, router, onFilterChange, onSelectDraft]);

  return null;
}

function InboxContent() {
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

  // New state for enquiry type filter and search
  const [enquiryType, setEnquiryType] = useState<EnquiryTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side filtering - derive filtered drafts from raw data
  const getFilteredDrafts = useCallback(
    (data: DraftWithRelations[]): DraftWithRelations[] => {
      let filtered = data;

      // Filter by enquiry type (client-side)
      if (enquiryType !== "all") {
        filtered = filtered.filter((d) => d.deal?.enquiryType === enquiryType);
      }

      // Filter by search (client-side)
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

  // Compute filtered drafts whenever raw data or filters change
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

  // Re-fetch when status filter changes
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Reset selection when any filter changes
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
        prev.map((d) =>
          d.id === id ? { ...d, status: "sent", sentAt: new Date() } : d
        )
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const pendingCount = drafts.filter(
    (d) => d.status === "pending" || d.status === "generating"
  ).length;

  const allSelected = drafts.length > 0 && selectedIds.size === drafts.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < drafts.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Handle URL params for auto-selecting draft */}
      <Suspense fallback={null}>
        <DraftUrlHandler
          drafts={drafts}
          isLoading={isLoading}
          filter={filter}
          onFilterChange={setFilter}
          onSelectDraft={setSelectedDraft}
        />
      </Suspense>

      <Header title="Inbox" description={`${pendingCount} pending drafts to review`} />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <InboxToolbar
          filter={filter}
          viewMode={viewMode}
          selectedCount={selectedIds.size}
          totalCount={drafts.length}
          allSelected={allSelected}
          someSelected={someSelected}
          isSyncing={isSyncing}
          isRefreshing={isRefreshing}
          isBulkDeleting={isBulkDeleting}
          onFilterChange={setFilter}
          onViewModeChange={setViewMode}
          onToggleSelectAll={toggleSelectAll}
          onCancelSelection={cancelSelection}
          onBulkDelete={handleBulkDelete}
          onSyncNow={handleSyncNow}
          onRefresh={handleRefresh}
          enquiryType={enquiryType}
          onEnquiryTypeChange={setEnquiryType}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {drafts.length === 0 ? (
          <InboxEmptyState filter={filter} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onSelect={setSelectedDraft}
                onDelete={handleDelete}
                isDeleting={deletingId === draft.id}
                isSelected={selectedIds.has(draft.id)}
                onToggleSelect={selectionMode ? toggleSelect : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {drafts.map((draft) => (
              <DraftListRow
                key={draft.id}
                draft={draft}
                onSelect={setSelectedDraft}
                onDelete={handleDelete}
                isDeleting={deletingId === draft.id}
                isSelected={selectedIds.has(draft.id)}
                onToggleSelect={selectionMode ? toggleSelect : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <DraftDetailSheet
        draft={selectedDraft}
        open={!!selectedDraft}
        onOpenChange={(open) => !open && setSelectedDraft(null)}
        onSave={handleSave}
        onSend={handleSend}
        onRegenerate={handleRegenerate}
      />
    </>
  );
}

export default function InboxPage() {
  return <InboxContent />;
}
