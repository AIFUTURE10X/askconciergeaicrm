import type { WebhookSource, SourceConfig, EnquiryType } from "./types";

// Enquiry types with display configuration
export const ENQUIRY_TYPES: {
  id: EnquiryType;
  label: string;
  color: string;
}[] = [
  {
    id: "sales",
    label: "Sales",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "support",
    label: "Support",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    id: "general",
    label: "General",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
];

export function getEnquiryTypeConfig(id: string | null | undefined) {
  return ENQUIRY_TYPES.find((t) => t.id === id) || null;
}

// Map account types to property types
export const ACCOUNT_TYPE_MAP: Record<string, string> = {
  hotel: "hotel",
  vacation_rental: "vacation_rental",
  property_manager: "property_manager",
  individual_host: "vacation_rental",
};

// Stage and probability by source
export const SOURCE_CONFIG: Record<WebhookSource, SourceConfig> = {
  signup: {
    stage: "lead",
    probability: 10,
    nextStep: "Send welcome email and schedule intro call",
    createDeal: true,
  },
  stripe: {
    stage: "closed_won",
    probability: 100,
    nextStep: "",
    createDeal: true,
  },
  contact_form: {
    stage: "qualified",
    probability: 25,
    nextStep: "Respond within 24 hours",
    createDeal: true,
  },
  gmail: {
    stage: "lead",
    probability: 10,
    nextStep: "Qualify lead - determine needs",
    createDeal: true,
  },
  ticket: {
    stage: "lead",
    probability: 10,
    nextStep: "",
    createDeal: false, // Just log activity
  },
  guest_contact: {
    stage: "lead",
    probability: 5,
    nextStep: "Follow up if marketing consent given",
    createDeal: true,
  },
};

// Source name display mapping
export const SOURCE_NAMES: Record<WebhookSource, string> = {
  signup: "Trial Signup",
  stripe: "Stripe",
  contact_form: "Contact Form",
  gmail: "Email",
  ticket: "Support Ticket",
  guest_contact: "Guest Contact",
};

// Contact source mapping
export const CONTACT_SOURCE_MAP: Record<WebhookSource, string> = {
  signup: "inbound",
  stripe: "inbound",
  contact_form: "inbound",
  gmail: "inbound",
  ticket: "inbound",
  guest_contact: "inbound",
};

// Lead source mapping
export const LEAD_SOURCE_MAP: Record<WebhookSource, string> = {
  signup: "inbound",
  stripe: "inbound",
  contact_form: "inbound",
  gmail: "cold_email",
  ticket: "inbound",
  guest_contact: "referral",
};
