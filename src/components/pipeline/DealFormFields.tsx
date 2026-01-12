"use client";

import { Label } from "@/components/ui/label";
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
import type { Contact } from "@/lib/db/schema";

interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: readonly { id: string; label: string; monthly?: number }[];
  formatOption?: (option: { id: string; label: string; monthly?: number }) => string;
}

export function SelectField({
  label,
  value,
  onValueChange,
  placeholder,
  options,
  formatOption,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {formatOption ? formatOption(option) : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ContactSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  contacts: Contact[];
}

export function ContactSelect({ value, onValueChange, contacts }: ContactSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="contact">Contact</Label>
      <Select value={value} onValueChange={onValueChange}>
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
  );
}

interface TierBillingFieldsProps {
  tier: string;
  billingPeriod: string;
  onTierChange: (value: string) => void;
  onBillingChange: (value: string) => void;
}

export function TierBillingFields({
  tier,
  billingPeriod,
  onTierChange,
  onBillingChange,
}: TierBillingFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SelectField
        label="Tier"
        value={tier}
        onValueChange={onTierChange}
        placeholder="Select tier"
        options={TIERS}
        formatOption={(t) => `${t.label} ($${t.monthly}/mo)`}
      />
      <div className="space-y-2">
        <Label>Billing</Label>
        <Select value={billingPeriod} onValueChange={onBillingChange}>
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
  );
}

interface QualificationFieldsProps {
  leadSource: string;
  propertyCountRange: string;
  currentSystem: string;
  painPoint: string;
  onLeadSourceChange: (value: string) => void;
  onPropertyCountRangeChange: (value: string) => void;
  onCurrentSystemChange: (value: string) => void;
  onPainPointChange: (value: string) => void;
}

export function QualificationFields({
  leadSource,
  propertyCountRange,
  currentSystem,
  painPoint,
  onLeadSourceChange,
  onPropertyCountRangeChange,
  onCurrentSystemChange,
  onPainPointChange,
}: QualificationFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Lead Source"
          value={leadSource}
          onValueChange={onLeadSourceChange}
          placeholder="How did they find us?"
          options={SOURCES}
        />
        <SelectField
          label="Property Count"
          value={propertyCountRange}
          onValueChange={onPropertyCountRangeChange}
          placeholder="How many properties?"
          options={PROPERTY_COUNT_RANGES}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Current System"
          value={currentSystem}
          onValueChange={onCurrentSystemChange}
          placeholder="What are they using?"
          options={CURRENT_SYSTEMS}
        />
        <SelectField
          label="Pain Point"
          value={painPoint}
          onValueChange={onPainPointChange}
          placeholder="Why talking to us?"
          options={PAIN_POINTS}
        />
      </div>
    </>
  );
}
