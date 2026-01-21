"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, Download, Tags, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES, SOURCES } from "@/lib/constants/pipeline";
import { AddContactDialog } from "./AddContactDialog";
import { ContactCard } from "./ContactCard";
import { ContactsEmptyState } from "./ContactsEmptyState";
import { exportContactsToCSV } from "./contacts-utils";
import { TagManager } from "@/components/contacts/TagManager";
import { BulkActionBar } from "@/components/contacts/BulkActionBar";
import { TagBadge } from "@/components/contacts/TagBadge";
import type { Contact, Deal, Tag } from "@/lib/db/schema";

type ContactWithDeals = Contact & { deals: Deal[] };

type FilterTab = { id: string; label: string };

function FilterTabs({
  label,
  tabs,
  selected,
  onSelect,
}: {
  label: string;
  tabs: FilterTab[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">{label}:</span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "px-2 py-1 text-xs rounded-md transition-colors",
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        )}
      >
        All
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={cn(
            "px-2 py-1 text-xs rounded-md transition-colors",
            selected === tab.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithDeals[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Filter states
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  async function fetchContacts() {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const { contacts: contactData } = await res.json();
        setContacts(contactData);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTags() {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const { tags: tagData } = await res.json();
        setTags(tagData);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search filter
      const matchesSearch =
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

      // Property type filter
      const matchesPropertyType =
        !propertyTypeFilter || contact.propertyType === propertyTypeFilter;

      // Source filter
      const matchesSource = !sourceFilter || contact.source === sourceFilter;

      // Tag filter
      const contactTagIds = (contact.tags as string[]) || [];
      const matchesTag = !tagFilter || contactTagIds.includes(tagFilter);

      return matchesSearch && matchesPropertyType && matchesSource && matchesTag;
    });
  }, [contacts, searchQuery, propertyTypeFilter, sourceFilter, tagFilter]);

  const handleSubmit = async (formData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    title: string;
    propertyType: string;
    website: string;
    linkedinUrl: string;
    source: string;
    notes: string;
  }) => {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    const { contact } = await res.json();
    setContacts((prev) => [{ ...contact, deals: [] }, ...prev]);
    toast.success("Contact created successfully");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("Contact deleted");
      }
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const hasActiveFilters = propertyTypeFilter || sourceFilter || tagFilter;

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
        title="Contacts"
        description={`${contacts.length} contacts`}
        action={{ label: "Add Contact", onClick: () => setIsAddDialogOpen(true) }}
      />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Search and actions bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-primary-foreground text-primary px-1.5 py-0.5 rounded-full text-xs">
                {[propertyTypeFilter, sourceFilter, tagFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsTagManagerOpen(true)} className="gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </Button>
          {contacts.length > 0 && (
            <Button variant="outline" onClick={() => exportContactsToCSV(filteredContacts)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        {showFilters && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
            <FilterTabs
              label="Type"
              tabs={[...PROPERTY_TYPES]}
              selected={propertyTypeFilter}
              onSelect={setPropertyTypeFilter}
            />
            <FilterTabs
              label="Source"
              tabs={[...SOURCES]}
              selected={sourceFilter}
              onSelect={setSourceFilter}
            />
            {tags && tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Tags:</span>
                <button
                  type="button"
                  onClick={() => setTagFilter(null)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    tagFilter === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  All
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setTagFilter(tag.id)}
                    className={cn(
                      "transition-opacity",
                      tagFilter === tag.id ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                  >
                    <TagBadge tag={tag} size="md" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            selectedIds={Array.from(selectedIds)}
            tags={tags}
            onClearSelection={clearSelection}
            onRefresh={() => {
              fetchContacts();
              fetchTags();
            }}
          />
        )}

        {/* Select all checkbox */}
        {filteredContacts.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedIds.size === filteredContacts.length && filteredContacts.length > 0
              }
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all ({filteredContacts.length})
            </span>
          </div>
        )}

        {/* Contact grid */}
        {filteredContacts.length === 0 ? (
          <ContactsEmptyState onAddClick={() => setIsAddDialogOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                tags={tags}
                isSelected={selectedIds.has(contact.id)}
                onSelectChange={() => toggleSelectContact(contact.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleSubmit}
      />

      <TagManager
        open={isTagManagerOpen}
        onOpenChange={setIsTagManagerOpen}
        tags={tags}
        onTagsChange={fetchTags}
      />
    </>
  );
}
