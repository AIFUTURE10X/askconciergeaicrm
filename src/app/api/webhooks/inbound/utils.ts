import type { WebhookSource, WebhookPayload } from "./types";
import {
  SOURCE_NAMES,
  CONTACT_SOURCE_MAP,
  LEAD_SOURCE_MAP,
} from "./constants";

export function mapSourceToContactSource(source: WebhookSource): string {
  return CONTACT_SOURCE_MAP[source];
}

export function mapSourceToLeadSource(source: WebhookSource): string {
  return LEAD_SOURCE_MAP[source];
}

export function formatSourceName(source: WebhookSource): string {
  return SOURCE_NAMES[source];
}

export function generateDealTitle(
  source: WebhookSource,
  data: WebhookPayload["data"]
): string {
  const name = data.company || data.name || data.email.split("@")[0];

  switch (source) {
    case "signup":
      return `${name} - Trial Signup`;
    case "stripe":
      return data.tier
        ? `${name} - ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} Plan`
        : `${name} - Subscription`;
    case "contact_form":
      return `${name} - Website Inquiry`;
    case "gmail":
      return `${name} - Email Inquiry`;
    case "guest_contact":
      return `${name} - Guest Lead`;
    default:
      return `${name} - New Lead`;
  }
}

export function formatActivityDescription(
  source: WebhookSource,
  event: string,
  data: WebhookPayload["data"]
): string {
  const lines = [`Source: ${formatSourceName(source)}`, `Event: ${event}`];

  if (data.subject) lines.push(`Subject: ${data.subject}`);
  if (data.message) lines.push(`\nMessage:\n${data.message}`);
  if (data.tier) lines.push(`Tier: ${data.tier}`);
  if (data.billingPeriod) lines.push(`Billing: ${data.billingPeriod}`);
  if (data.accountType) lines.push(`Account Type: ${data.accountType}`);

  if (data.metadata && Object.keys(data.metadata).length > 0) {
    lines.push(`\nMetadata: ${JSON.stringify(data.metadata, null, 2)}`);
  }

  return lines.join("\n");
}
