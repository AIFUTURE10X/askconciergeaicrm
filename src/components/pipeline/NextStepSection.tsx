"use client";

import { format, isToday, isPast, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Linkify } from "@/components/ui/linkify";
import { Calendar, AlertTriangle, Clock, Edit2, Save, X } from "lucide-react";

interface NextStepSectionProps {
  nextStep: string | null;
  followUpDate: Date | string | null;
  isEditing: boolean;
  nextStepText: string;
  followUpDateText: string;
  isUpdating: boolean;
  onEditStart: () => void;
  onSave: () => void;
  onCancel: () => void;
  onNextStepChange: (value: string) => void;
  onFollowUpDateChange: (value: string) => void;
}

export function NextStepSection({
  nextStep,
  followUpDate,
  isEditing,
  nextStepText,
  followUpDateText,
  isUpdating,
  onEditStart,
  onSave,
  onCancel,
  onNextStepChange,
  onFollowUpDateChange,
}: NextStepSectionProps) {
  const parsedDate = followUpDate ? new Date(followUpDate) : null;
  const isOverdue = parsedDate && isPast(parsedDate) && !isToday(parsedDate);
  const isDueToday = parsedDate && isToday(parsedDate);
  const isDueTomorrow = parsedDate && isTomorrow(parsedDate);

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isOverdue
          ? "border-red-400 bg-red-50 dark:bg-red-950/30"
          : isDueToday
          ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
          : isDueTomorrow
          ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
          : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Next Step
        </Label>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={onEditStart} className="h-7 px-2">
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              disabled={isUpdating}
              className="h-7 px-2 text-green-600 hover:text-green-700"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2">
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              What needs to happen next?
            </Label>
            <Textarea
              value={nextStepText}
              onChange={(e) => onNextStepChange(e.target.value)}
              placeholder="e.g., Follow up on proposal, Schedule demo..."
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Follow-up Date</Label>
            <Input
              type="date"
              value={followUpDateText}
              onChange={(e) => onFollowUpDateChange(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {nextStep ? (
            <p className="text-sm font-medium">
              <Linkify>{nextStep}</Linkify>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No next step defined - click Edit to add one
            </p>
          )}
          {parsedDate && (
            <div
              className={`flex items-center gap-2 text-sm ${
                isOverdue
                  ? "text-red-600 dark:text-red-400 font-semibold"
                  : isDueToday
                  ? "text-orange-600 dark:text-orange-400 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {isOverdue && <AlertTriangle className="h-4 w-4" />}
              <Calendar className="h-4 w-4" />
              <span>
                {isOverdue
                  ? `Overdue: ${format(parsedDate, "MMM d, yyyy")}`
                  : isDueToday
                  ? "Due Today"
                  : isDueTomorrow
                  ? "Due Tomorrow"
                  : format(parsedDate, "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
