"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Loader2 } from "lucide-react";
import { DRAFT_TONES } from "@/lib/constants/email-drafts";

interface RegenerateSectionProps {
  draftId: string;
  currentTone: string;
  onRegenerate: (id: string, tone: string, feedback?: string) => Promise<void>;
}

export function RegenerateSection({
  draftId,
  currentTone,
  onRegenerate,
}: RegenerateSectionProps) {
  const [selectedTone, setSelectedTone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(draftId, selectedTone || currentTone, feedback);
      setFeedback("");
      setOpen(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <RefreshCw className="mr-1 h-3 w-3" />
          Regenerate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <Select
            value={selectedTone || currentTone}
            onValueChange={setSelectedTone}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tone" />
            </SelectTrigger>
            <SelectContent>
              {DRAFT_TONES.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            className="text-xs resize-none"
          />
          <Button
            size="sm"
            className="w-full h-7"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            Regenerate
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
