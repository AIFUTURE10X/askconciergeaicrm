"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DraftWithRelations } from "@/components/inbox/DraftCard";
import type { StatusFilter } from "./InboxToolbar";

interface DraftUrlHandlerProps {
  drafts: DraftWithRelations[];
  isLoading: boolean;
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  onSelectDraft: (draft: DraftWithRelations) => void;
}

export function DraftUrlHandler({
  drafts,
  isLoading,
  filter,
  onFilterChange,
  onSelectDraft,
}: DraftUrlHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get("draft");
  const [hasHandledUrlDraft, setHasHandledUrlDraft] = useState(false);

  useEffect(() => {
    if (draftIdFromUrl && !hasHandledUrlDraft && drafts.length > 0) {
      const draftFromUrl = drafts.find((d) => d.id === draftIdFromUrl);
      if (draftFromUrl) {
        onSelectDraft(draftFromUrl);
        setHasHandledUrlDraft(true);
        router.replace("/inbox", { scroll: false });
      } else if (!isLoading) {
        if (filter !== "all") {
          onFilterChange("all");
        } else {
          setHasHandledUrlDraft(true);
          router.replace("/inbox", { scroll: false });
        }
      }
    }
  }, [draftIdFromUrl, drafts, hasHandledUrlDraft, isLoading, filter, router, onFilterChange, onSelectDraft]);

  return null;
}
