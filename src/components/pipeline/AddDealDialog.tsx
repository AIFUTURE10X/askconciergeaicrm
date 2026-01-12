"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TIERS } from "@/lib/constants/pipeline";
import { Loader2 } from "lucide-react";
import type { Contact } from "@/lib/db/schema";
import {
  ContactSelect,
  TierBillingFields,
  QualificationFields,
} from "./DealFormFields";

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    contactId?: string;
    tier?: string;
    value?: number;
    billingPeriod?: string;
    propertyCount?: number;
    propertyCountRange?: string;
    leadSource?: string;
    currentSystem?: string;
    painPoint?: string;
    expectedCloseDate?: string;
    notes?: string;
  }) => Promise<void>;
  contacts: Contact[];
  defaultContactId?: string;
}

const INITIAL_FORM_DATA = {
  title: "",
  contactId: "",
  tier: "",
  billingPeriod: "monthly",
  propertyCount: 1,
  propertyCountRange: "",
  leadSource: "",
  currentSystem: "",
  painPoint: "",
  expectedCloseDate: "",
  notes: "",
};

export function AddDealDialog({
  open,
  onOpenChange,
  onSubmit,
  contacts,
  defaultContactId,
}: AddDealDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ...INITIAL_FORM_DATA,
    contactId: defaultContactId || "",
  });

  // Reset form when dialog opens with default contact
  useEffect(() => {
    if (open) {
      setFormData({
        ...INITIAL_FORM_DATA,
        contactId: defaultContactId || "",
      });
    }
  }, [open, defaultContactId]);

  const selectedTier = TIERS.find((t) => t.id === formData.tier);
  const value = selectedTier
    ? formData.billingPeriod === "annual"
      ? selectedTier.annual * formData.propertyCount
      : selectedTier.monthly * formData.propertyCount
    : 0;

  const updateField = (field: string) => (value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        contactId: formData.contactId || undefined,
        tier: formData.tier || undefined,
        value: value || undefined,
        billingPeriod: formData.billingPeriod,
        propertyCount: formData.propertyCount,
        propertyCountRange: formData.propertyCountRange || undefined,
        leadSource: formData.leadSource || undefined,
        currentSystem: formData.currentSystem || undefined,
        painPoint: formData.painPoint || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        notes: formData.notes || undefined,
      });
      setFormData(INITIAL_FORM_DATA);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Sunset Resort - Emerald Plan"
              value={formData.title}
              onChange={(e) => updateField("title")(e.target.value)}
              required
            />
          </div>

          <ContactSelect
            value={formData.contactId}
            onValueChange={updateField("contactId")}
            contacts={contacts}
          />

          <TierBillingFields
            tier={formData.tier}
            billingPeriod={formData.billingPeriod}
            onTierChange={updateField("tier")}
            onBillingChange={updateField("billingPeriod")}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="properties">Properties</Label>
              <Input
                id="properties"
                type="number"
                min={1}
                value={formData.propertyCount}
                onChange={(e) => updateField("propertyCount")(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deal Value</Label>
              <div className="h-9 px-3 flex items-center rounded-md border bg-muted text-sm">
                ${value.toLocaleString()}
                {formData.billingPeriod === "annual" ? "/yr" : "/mo"}
              </div>
            </div>
          </div>

          <QualificationFields
            leadSource={formData.leadSource}
            propertyCountRange={formData.propertyCountRange}
            currentSystem={formData.currentSystem}
            painPoint={formData.painPoint}
            onLeadSourceChange={updateField("leadSource")}
            onPropertyCountRangeChange={updateField("propertyCountRange")}
            onCurrentSystemChange={updateField("currentSystem")}
            onPainPointChange={updateField("painPoint")}
          />

          <div className="space-y-2">
            <Label htmlFor="closeDate">Expected Close Date</Label>
            <Input
              id="closeDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => updateField("expectedCloseDate")(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => updateField("notes")(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Deal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
