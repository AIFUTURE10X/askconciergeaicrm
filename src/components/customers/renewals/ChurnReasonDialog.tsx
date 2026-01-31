"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { CHURN_REASON_LABELS } from "@/lib/admin/renewal-queries";

interface Props {
  orgId: string;
  orgName: string;
  onClose: () => void;
  onLogged?: () => void;
}

export function ChurnReasonDialog({ orgId, orgName, onClose, onLogged }: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${orgId}/churn-reason`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to log churn reason");
      }
      toast.success("Churn reason logged");
      onLogged?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-5 space-y-4 m-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Log Churn Reason</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Why did <strong>{orgName}</strong> cancel?</p>

        <div className="space-y-2">
          {Object.entries(CHURN_REASON_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                reason === key ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="churn-reason"
                value={key}
                checked={reason === key}
                onChange={(e) => setReason(e.target.value)}
                className="accent-primary"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <textarea
          placeholder="Additional details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full h-20 rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Log Reason
          </Button>
        </div>
      </Card>
    </div>
  );
}
