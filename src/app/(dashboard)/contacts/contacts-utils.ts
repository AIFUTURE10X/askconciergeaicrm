import { format } from "date-fns";
import { toast } from "sonner";
import { PROPERTY_TYPES, SOURCES } from "@/lib/constants/pipeline";
import type { Contact, Deal } from "@/lib/db/schema";

type ContactWithDeals = Contact & { deals: Deal[] };

export function exportContactsToCSV(contacts: ContactWithDeals[]): void {
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

  const rows = contacts.map((c) => [
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
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `contacts-${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Contacts exported to CSV");
}
