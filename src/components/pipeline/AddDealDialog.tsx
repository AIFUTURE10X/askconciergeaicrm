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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TIERS,
  PROPERTY_COUNT_RANGES,
  CURRENT_SYSTEMS,
  PAIN_POINTS,
  SOURCES,
} from "@/lib/constants/pipeline";
import { Loader2 } from "lucide-react";
import type { Contact } from "@/lib/db/schema";

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
}

export function AddDealDialog({
  open,
  onOpenChange,
  onSubmit,
  contacts,
}: AddDealDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  // Calculate value based on tier
  const selectedTier = TIERS.find((t) => t.id === formData.tier);
  const value = selectedTier
    ? formData.billingPeriod === "annual"
      ? selectedTier.annual * formData.propertyCount
      : selectedTier.monthly * formData.propertyCount
    : 0;

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
      // Reset form
      setFormData({
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
      });
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
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Select
              value={formData.contactId}
              onValueChange={(value) =>
                setFormData({ ...formData, contactId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                    {contact.company && ` (${contact.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) =>
                  setFormData({ ...formData, tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.label} (${tier.monthly}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing">Billing</Label>
              <Select
                value={formData.billingPeriod}
                onValueChange={(value) =>
                  setFormData({ ...formData, billingPeriod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="properties">Properties</Label>
              <Input
                id="properties"
                type="number"
                min={1}
                value={formData.propertyCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    propertyCount: parseInt(e.target.value) || 1,
                  })
                }
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

          {/* Qualification Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead Source</Label>
              <Select
                value={formData.leadSource}
                onValueChange={(value) =>
                  setFormData({ ...formData, leadSource: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did they find us?" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyCountRange">Property Count</Label>
              <Select
                value={formData.propertyCountRange}
                onValueChange={(value) =>
                  setFormData({ ...formData, propertyCountRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How many properties?" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_COUNT_RANGES.map((range) => (
                    <SelectItem key={range.id} value={range.id}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentSystem">Current System</Label>
              <Select
                value={formData.currentSystem}
                onValueChange={(value) =>
                  setFormData({ ...formData, currentSystem: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="What are they using?" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENT_SYSTEMS.map((sys) => (
                    <SelectItem key={sys.id} value={sys.id}>
                      {sys.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="painPoint">Pain Point</Label>
              <Select
                value={formData.painPoint}
                onValueChange={(value) =>
                  setFormData({ ...formData, painPoint: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Why talking to us?" />
                </SelectTrigger>
                <SelectContent>
                  {PAIN_POINTS.map((pain) => (
                    <SelectItem key={pain.id} value={pain.id}>
                      {pain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closeDate">Expected Close Date</Label>
            <Input
              id="closeDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) =>
                setFormData({ ...formData, expectedCloseDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
