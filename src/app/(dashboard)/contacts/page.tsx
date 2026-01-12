"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { AddContactDialog } from "./AddContactDialog";
import { ContactCard } from "./ContactCard";
import { ContactsEmptyState } from "./ContactsEmptyState";
import { exportContactsToCSV } from "./contacts-utils";
import type { Contact, Deal } from "@/lib/db/schema";

type ContactWithDeals = Contact & { deals: Deal[] };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithDeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
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

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        toast.success("Contact deleted");
      }
    } catch {
      toast.error("Failed to delete contact");
    }
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
        title="Contacts"
        description={`${contacts.length} contacts`}
        action={{ label: "Add Contact", onClick: () => setIsAddDialogOpen(true) }}
      />

      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {contacts.length > 0 && (
            <Button variant="outline" onClick={() => exportContactsToCSV(filteredContacts)}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {filteredContacts.length === 0 ? (
          <ContactsEmptyState onAddClick={() => setIsAddDialogOpen(true)} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
