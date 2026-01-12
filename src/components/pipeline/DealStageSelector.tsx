"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle } from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";

interface DealStageSelectorProps {
  stage: string;
  onStageChange: (stage: string) => void;
  onMarkWon: () => void;
  onMarkLost: () => void;
  isUpdating: boolean;
}

export function DealStageSelector({
  stage,
  onStageChange,
  onMarkWon,
  onMarkLost,
  isUpdating,
}: DealStageSelectorProps) {
  const isClosed = stage === "closed_won" || stage === "closed_lost";

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Stage</Label>
        <Select value={stage} onValueChange={onStageChange} disabled={isUpdating}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isClosed && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            onClick={onMarkWon}
            disabled={isUpdating}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Won
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={onMarkLost}
            disabled={isUpdating}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark Lost
          </Button>
        </div>
      )}
    </>
  );
}
