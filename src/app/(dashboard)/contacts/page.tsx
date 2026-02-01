"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, Download, Tags, Filter } from "lucide-react";
import { PROPERTY_TYPES, SOURCES } from "@/lib/constants/pipeline";
import { AddContactDialog } from "./AddContactDialog";
import { ContactCard } from "./ContactCard";
import { ContactsEmptyState } from "./ContactsEmptyState";
import { exportContactsToCSV } from "./contacts-utils";
import { TagManager } from "@/components/contacts/TagManager";
import { BulkActionBar } from "@/components/contacts/BulkActionBar";
import { FilterTabs } from "./FilterTabs";
import { TagFilterRow } from "./TagFilterRow";
import { useContacts } from "./useContacts";

export default function ContactsPage() {
  const c = useContacts();

  if (c.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Contacts"
        description={`${c.contacts.length} contacts`}
        action={{ label: "Add Contact", onClick: () => c.setIsAddDialogOpen(true) }}
      />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={c.searchQuery}
              onChange={(e) => c.setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={c.showFilters ? "default" : "outline"}
            onClick={() => c.setShowFilters(!c.showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {c.hasActiveFilters && (
              <span className="ml-1 bg-primary-foreground text-primary px-1.5 py-0.5 rounded-full text-xs">
                {[c.propertyTypeFilter, c.sourceFilter, c.tagFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={() => c.setIsTagManagerOpen(true)} className="gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </Button>
          {c.contacts.length > 0 && (
            <Button variant="outline" onClick={() => exportContactsToCSV(c.filteredContacts)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {c.showFilters && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
            <FilterTabs label="Type" tabs={[...PROPERTY_TYPES]} selected={c.propertyTypeFilter} onSelect={c.setPropertyTypeFilter} />
            <FilterTabs label="Source" tabs={[...SOURCES]} selected={c.sourceFilter} onSelect={c.setSourceFilter} />
            <TagFilterRow tags={c.tags} tagFilter={c.tagFilter} onTagFilter={c.setTagFilter} />
          </div>
        )}

        {c.selectedIds.size > 0 && (
          <BulkActionBar
            selectedCount={c.selectedIds.size}
            selectedIds={Array.from(c.selectedIds)}
            tags={c.tags}
            onClearSelection={c.clearSelection}
            onRefresh={() => { c.fetchContacts(); c.fetchTags(); }}
          />
        )}

        {c.filteredContacts.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={c.selectedIds.size === c.filteredContacts.length && c.filteredContacts.length > 0}
              onCheckedChange={c.toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all ({c.filteredContacts.length})
            </span>
          </div>
        )}

        {c.filteredContacts.length === 0 ? (
          <ContactsEmptyState onAddClick={() => c.setIsAddDialogOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {c.filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                tags={c.tags}
                isSelected={c.selectedIds.has(contact.id)}
                onSelectChange={() => c.toggleSelectContact(contact.id)}
                onDelete={c.handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AddContactDialog open={c.isAddDialogOpen} onOpenChange={c.setIsAddDialogOpen} onSubmit={c.handleSubmit} />
      <TagManager open={c.isTagManagerOpen} onOpenChange={c.setIsTagManagerOpen} tags={c.tags} onTagsChange={c.fetchTags} />
    </>
  );
}
