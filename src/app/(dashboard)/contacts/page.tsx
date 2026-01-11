"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Mail,
  Phone,
  Building2,
  Linkedin,
  Loader2,
  Trash2,
  Download,
  ChevronRight,
} from "lucide-react";
import { PROPERTY_TYPES, SOURCES } from "@/lib/constants/pipeline";
import type { Contact, Deal } from "@/lib/db/schema";

type ContactWithDeals = Contact & { deals: Deal[] };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithDeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    propertyType: "",
    website: "",
    linkedinUrl: "",
    source: "",
    notes: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
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
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        title: "",
        propertyType: "",
        website: "",
        linkedinUrl: "",
        source: "",
        notes: "",
      });
      setIsAddDialogOpen(false);
      toast.success("Contact created successfully");
    } catch (error) {
      toast.error("Failed to create contact");
    } finally {
      setIsSubmitting(false);
    }
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
    } catch (error) {
      toast.error("Failed to delete contact");
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Title",
      "Property Type",
      "Source",
      "LinkedIn",
      "Website",
      "Notes",
      "Deals Count",
      "Created",
    ];

    const rows = filteredContacts.map((c) => [
      c.name,
      c.email || "",
      c.phone || "",
      c.company || "",
      c.title || "",
      PROPERTY_TYPES.find((t) => t.id === c.propertyType)?.label || "",
      SOURCES.find((s) => s.id === c.source)?.label || "",
      c.linkedinUrl || "",
      c.website || "",
      (c.notes || "").replace(/"/g, '""'),
      c.deals.length,
      format(new Date(c.createdAt), "yyyy-MM-dd"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Contacts exported to CSV");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        action={{
          label: "Add Contact",
          onClick: () => setIsAddDialogOpen(true),
        }}
      />

      <div className="p-6 space-y-4">
        {/* Search and Export */}
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
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Contact List */}
        {filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No contacts yet</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Add your first contact to start building your sales pipeline
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <Link key={contact.id} href={`/contacts/${contact.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{contact.name}</h3>
                        {contact.company && (
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.title && `${contact.title} at `}
                            {contact.company}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(contact.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.linkedinUrl && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Linkedin className="h-3.5 w-3.5" />
                          <span>LinkedIn</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-1">
                        {contact.propertyType && (
                          <Badge variant="secondary" className="text-xs">
                            {PROPERTY_TYPES.find((t) => t.id === contact.propertyType)?.label || contact.propertyType}
                          </Badge>
                        )}
                      </div>
                      {contact.deals.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {contact.deals.length} deal{contact.deals.length !== 1 && "s"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., General Manager"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, propertyType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedinUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedinUrl: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this contact..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Contact
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
