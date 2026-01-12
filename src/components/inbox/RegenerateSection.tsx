"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(draftId, selectedTone || currentTone, feedback);
      setFeedback("");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Regenerate with AI
        </h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select
              value={selectedTone || currentTone}
              onValueChange={setSelectedTone}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRAFT_TONES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label} - {t.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Feedback (optional)</Label>
            <Textarea
              placeholder="e.g., Make it shorter, mention our discount..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Regenerate
          </Button>
        </div>
      </div>
    </>
  );
}
