import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { Contact, Deal, Tag } from "@/lib/db/schema";

type ContactWithDeals = Contact & { deals: Deal[] };

export function useContacts() {
  const [contacts, setContacts] = useState<ContactWithDeals[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
      const matchesSearch =
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPropertyType = !propertyTypeFilter || contact.propertyType === propertyTypeFilter;
      const matchesSource = !sourceFilter || contact.source === sourceFilter;
      const contactTagIds = (contact.tags as string[]) || [];
      const matchesTag = !tagFilter || contactTagIds.includes(tagFilter);
      return matchesSearch && matchesPropertyType && matchesSource && matchesTag;
    });
  }, [contacts, searchQuery, propertyTypeFilter, sourceFilter, tagFilter]);

  const handleSubmit = async (formData: {
    name: string; email: string; phone: string; company: string;
    title: string; propertyType: string; website: string;
    linkedinUrl: string; source: string; notes: string;
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
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        toast.success("Contact deleted");
      }
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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

  const clearSelection = () => setSelectedIds(new Set());

  const hasActiveFilters = !!(propertyTypeFilter || sourceFilter || tagFilter);

  return {
    contacts, tags, isLoading, searchQuery, setSearchQuery,
    isAddDialogOpen, setIsAddDialogOpen, isTagManagerOpen, setIsTagManagerOpen,
    propertyTypeFilter, setPropertyTypeFilter, sourceFilter, setSourceFilter,
    tagFilter, setTagFilter, showFilters, setShowFilters,
    selectedIds, filteredContacts, hasActiveFilters,
    handleSubmit, handleDelete, toggleSelectContact, toggleSelectAll, clearSelection,
    fetchContacts, fetchTags,
  };
}
