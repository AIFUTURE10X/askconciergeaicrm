// Webhook payload types
export type WebhookSource =
  | "signup"
  | "stripe"
  | "contact_form"
  | "gmail"
  | "ticket"
  | "guest_contact";

export interface WebhookPayload {
  source: WebhookSource;
  event: string;
  data: {
    email: string;
    name?: string;
    phone?: string;
    company?: string;
    accountType?: string;
    tier?: string;
    billingPeriod?: string;
    message?: string;
    subject?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface SourceConfig {
  stage: string;
  probability: number;
  nextStep: string;
  createDeal: boolean;
}
