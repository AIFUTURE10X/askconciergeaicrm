"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox as InboxIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DraftCard, type DraftWithRelations } from "@/components/inbox/DraftCard";
import { DraftDetailSheet } from "@/components/inbox/DraftDetailSheet";
import { DRAFT_STATUSES } from "@/lib/constants/email-drafts";

type StatusFilter = "pending" | "sent" | "all";

export default function InboxPage() {
  const [drafts, setDrafts] = useState<DraftWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [selectedDraft, setSelectedDraft] = useState<DraftWithRelations | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, [filter]);

  async function fetchDrafts() {
    try {
      const statuses =
        filter === "all"
          ? undefined
          : filter === "pending"
          ? "pending,generating"
          : "sent";
      const url = statuses ? `/api/drafts?statuses=${statuses}` : "/api/drafts";
      const res = await fetch(url);
      if (res.ok) {
        const { drafts: data } = await res.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchDrafts();
    setIsRefreshing(false);
    toast.success("Inbox refreshed");
  }

  async function handleSend(id: string) {
    setSendingId(id);
    try {
      const res = await fetch(`/api/drafts/${id}/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send");
      }
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "sent", sentAt: new Date() } : d
        )
      );
      if (filter === "pending") {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
      toast.success("Email sent successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setSendingId(null);
    }
  }

  async function handleRegenerate(id: string, tone?: string, feedback?: string) {
    try {
      const res = await fetch(`/api/drafts/${id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone, feedback }),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
      const { draft } = await res.json();
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...draft } : d)));
      if (selectedDraft?.id === id) {
        setSelectedDraft({ ...selectedDraft, ...draft });
      }
      toast.success("Draft regenerated");
    } catch (error) {
      toast.error("Failed to regenerate draft");
    }
  }

  async function handleSave(id: string, data: { draftSubject: string; draftBody: string }) {
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      const { draft } = await res.json();
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...draft } : d)));
      if (selectedDraft?.id === id) {
        setSelectedDraft({ ...selectedDraft, ...draft });
      }
      toast.success("Draft saved");
    } catch (error) {
      toast.error("Failed to save draft");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (selectedDraft?.id === id) {
        setSelectedDraft(null);
      }
      toast.success("Draft deleted");
    } catch (error) {
      toast.error("Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  }

  const pendingCount = drafts.filter(
    (d) => d.status === "pending" || d.status === "generating"
  ).length;

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
        title="Inbox"
        description={`${pendingCount} pending drafts to review`}
      />

      <div className="p-6 space-y-4">
        {/* Filters and Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("sent")}
            >
              Sent
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <InboxIcon className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No drafts</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                {filter === "pending"
                  ? "All caught up! No pending drafts to review."
                  : filter === "sent"
                  ? "No emails have been sent yet."
                  : "Drafts will appear here when emails are received."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onSelect={setSelectedDraft}
                onSend={handleSend}
                onRegenerate={(id) => handleRegenerate(id)}
                onDelete={handleDelete}
                isDeleting={deletingId === draft.id}
                isSending={sendingId === draft.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Draft Detail Sheet */}
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
