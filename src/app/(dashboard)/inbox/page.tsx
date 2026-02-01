"use client";

import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { DraftCard } from "@/components/inbox/DraftCard";
import { DraftListRow } from "@/components/inbox/DraftListRow";
import { DraftDetailSheet } from "@/components/inbox/DraftDetailSheet";
import { InboxToolbar } from "./InboxToolbar";
import { InboxEmptyState } from "./InboxEmptyState";
import { DraftUrlHandler } from "./DraftUrlHandler";
import { useInbox } from "./useInbox";

function InboxContent() {
  const inbox = useInbox();

  if (inbox.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <DraftUrlHandler
          drafts={inbox.drafts}
          isLoading={inbox.isLoading}
          filter={inbox.filter}
          onFilterChange={inbox.setFilter}
          onSelectDraft={inbox.setSelectedDraft}
        />
      </Suspense>

      <Header title="Inbox" description={`${inbox.pendingCount} pending drafts to review`} />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <InboxToolbar
          filter={inbox.filter}
          viewMode={inbox.viewMode}
          selectedCount={inbox.selectedIds.size}
          totalCount={inbox.drafts.length}
          allSelected={inbox.allSelected}
          someSelected={inbox.someSelected}
          isSyncing={inbox.isSyncing}
          isRefreshing={inbox.isRefreshing}
          isBulkDeleting={inbox.isBulkDeleting}
          onFilterChange={inbox.setFilter}
          onViewModeChange={inbox.setViewMode}
          onToggleSelectAll={inbox.toggleSelectAll}
          onCancelSelection={inbox.cancelSelection}
          onBulkDelete={inbox.handleBulkDelete}
          onSyncNow={inbox.handleSyncNow}
          onRefresh={inbox.handleRefresh}
          enquiryType={inbox.enquiryType}
          onEnquiryTypeChange={inbox.setEnquiryType}
          searchQuery={inbox.searchQuery}
          onSearchChange={inbox.setSearchQuery}
        />

        {inbox.drafts.length === 0 ? (
          <InboxEmptyState filter={inbox.filter} />
        ) : inbox.viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {inbox.drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onSelect={inbox.setSelectedDraft}
                onDelete={inbox.handleDelete}
                isDeleting={inbox.deletingId === draft.id}
                isSelected={inbox.selectedIds.has(draft.id)}
                onToggleSelect={inbox.selectionMode ? inbox.toggleSelect : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {inbox.drafts.map((draft) => (
              <DraftListRow
                key={draft.id}
                draft={draft}
                onSelect={inbox.setSelectedDraft}
                onDelete={inbox.handleDelete}
                isDeleting={inbox.deletingId === draft.id}
                isSelected={inbox.selectedIds.has(draft.id)}
                onToggleSelect={inbox.selectionMode ? inbox.toggleSelect : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <DraftDetailSheet
        draft={inbox.selectedDraft}
        open={!!inbox.selectedDraft}
        onOpenChange={(open) => !open && inbox.setSelectedDraft(null)}
        onSave={inbox.handleSave}
        onSend={inbox.handleSend}
        onRegenerate={inbox.handleRegenerate}
      />
    </>
  );
}

export default function InboxPage() {
  return <InboxContent />;
}
