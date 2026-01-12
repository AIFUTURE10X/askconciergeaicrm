import { format } from "date-fns";
import { PIPELINE_STAGES, TIERS } from "@/lib/constants/pipeline";
import type { Deal, Contact } from "@/lib/db/schema";

type DealWithContact = Deal & { contact: Contact | null };

export function exportDealsToCSV(deals: DealWithContact[]): void {
  const headers = [
    "Title",
    "Contact",
    "Company",
    "Stage",
    "Tier",
    "Value",
    "Billing Period",
    "Properties",
    "Probability",
    "Expected Close",
    "Notes",
    "Created",
  ];

  const rows = deals.map((d) => [
    d.title,
    d.contact?.name || "",
    d.contact?.company || "",
    PIPELINE_STAGES.find((s) => s.id === d.stage)?.label || d.stage,
    TIERS.find((t) => t.id === d.tier)?.label || "",
    d.value ? parseFloat(d.value).toString() : "",
    d.billingPeriod || "",
    d.propertyCount?.toString() || "1",
    d.probability?.toString() || "",
    d.expectedCloseDate
      ? format(new Date(d.expectedCloseDate), "yyyy-MM-dd")
      : "",
    (d.notes || "").replace(/"/g, '""'),
    format(new Date(d.createdAt), "yyyy-MM-dd"),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `deals-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.click();
  URL.revokeObjectURL(url);
}
