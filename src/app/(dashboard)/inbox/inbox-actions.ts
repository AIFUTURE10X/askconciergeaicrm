import { toast } from "sonner";
import type { DraftWithRelations } from "@/components/inbox/DraftCard";

type StatusFilter = "pending" | "sent" | "all";

export async function fetchDrafts(filter: StatusFilter): Promise<DraftWithRelations[]> {
  const statuses =
    filter === "all"
      ? undefined
      : filter === "pending"
      ? "pending,generating"
      : "sent";
  const url = statuses ? `/api/drafts?statuses=${statuses}` : "/api/drafts";
  const res = await fetch(url);
  if (res.ok) {
    const { drafts } = await res.json();
    return drafts;
  }
  return [];
}

export async function syncGmail(): Promise<{ success: boolean; processed: number }> {
  const res = await fetch("/api/gmail/sync", { method: "POST" });
  const data = await res.json();

  if (data.success) {
    if (data.processed > 0) {
      toast.success(`Synced ${data.processed} new email(s)`);
    } else {
      toast.info("No new emails to sync");
    }
    return { success: true, processed: data.processed || 0 };
  } else if (data.message === "Gmail not connected") {
    toast.error("Gmail not connected - go to Settings to connect");
  } else {
    toast.error(data.error || "Sync failed");
  }
  return { success: false, processed: 0 };
}

export async function sendDraft(id: string): Promise<boolean> {
  const res = await fetch(`/api/drafts/${id}/send`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to send");
  }
  toast.success("Email sent successfully");
  return true;
}

export async function regenerateDraft(
  id: string,
  tone?: string,
  feedback?: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/drafts/${id}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tone, feedback }),
  });
  if (!res.ok) throw new Error("Failed to regenerate");
  const { draft } = await res.json();
  toast.success("Draft regenerated");
  return draft;
}

export async function saveDraft(
  id: string,
  data: { draftSubject: string; draftBody: string }
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save");
  const { draft } = await res.json();
  toast.success("Draft saved");
  return draft;
}

export async function deleteDraft(id: string): Promise<boolean> {
  const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
  toast.success("Draft deleted");
  return true;
}

export async function bulkDeleteDrafts(ids: string[]): Promise<boolean> {
  const res = await fetch("/api/drafts/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  toast.success(`${ids.length} draft(s) deleted`);
  return true;
}
