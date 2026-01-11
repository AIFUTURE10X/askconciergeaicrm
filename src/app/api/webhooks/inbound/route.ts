import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, deals, activities } from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import { requireApiKey } from "@/lib/auth/api-key";

// Webhook payload types
type WebhookSource =
  | "signup"
  | "stripe"
  | "contact_form"
  | "gmail"
  | "ticket"
  | "guest_contact";

interface WebhookPayload {
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

// Map account types to property types
const ACCOUNT_TYPE_MAP: Record<string, string> = {
  hotel: "hotel",
  vacation_rental: "vacation_rental",
  property_manager: "property_manager",
  individual_host: "vacation_rental",
};

// Stage and probability by source
const SOURCE_CONFIG: Record<
  WebhookSource,
  { stage: string; probability: number; nextStep: string; createDeal: boolean }
> = {
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

export async function POST(request: Request) {
  // Validate API key
  const { error, source: apiKeySource } = requireApiKey(request);
  if (error) return error;

  try {
    const body: WebhookPayload = await request.json();

    // Validate required fields
    if (!body.source || !body.event || !body.data?.email) {
      return NextResponse.json(
        { error: "Missing required fields: source, event, data.email" },
        { status: 400 }
      );
    }

    const { source, event, data } = body;
    const normalizedEmail = data.email.toLowerCase().trim();

    console.log(`[Webhook] ${source}:${event} from ${apiKeySource} - ${normalizedEmail}`);

    // Find or create contact
    let contact = await db.query.contacts.findFirst({
      where: ilike(contacts.email, normalizedEmail),
    });

    if (!contact) {
      // Create new contact
      const [newContact] = await db
        .insert(contacts)
        .values({
          name: data.name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          phone: data.phone || null,
          company: data.company || null,
          propertyType: data.accountType
            ? ACCOUNT_TYPE_MAP[data.accountType] || null
            : null,
          source: mapSourceToContactSource(source),
          notes: data.message || null,
        })
        .returning();

      contact = newContact;
      console.log(`[Webhook] Created new contact: ${contact.id}`);
    } else {
      // Update existing contact with new info
      const updateData: Partial<typeof contacts.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.name && !contact.name) updateData.name = data.name;
      if (data.phone && !contact.phone) updateData.phone = data.phone;
      if (data.company && !contact.company) updateData.company = data.company;

      await db.update(contacts).set(updateData).where(eq(contacts.id, contact.id));
      console.log(`[Webhook] Updated existing contact: ${contact.id}`);
    }

    const config = SOURCE_CONFIG[source];
    let deal = null;

    if (config.createDeal) {
      // Check for existing active deal
      const existingDeal = await db.query.deals.findFirst({
        where: eq(deals.contactId, contact.id),
      });

      if (existingDeal) {
        // Update existing deal based on event
        if (source === "stripe" && event === "subscription_created") {
          // Upgrade - mark as won
          await db
            .update(deals)
            .set({
              stage: "closed_won",
              probability: 100,
              tier: data.tier || existingDeal.tier,
              billingPeriod: data.billingPeriod || existingDeal.billingPeriod,
              closedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(deals.id, existingDeal.id));

          deal = existingDeal;
          console.log(`[Webhook] Marked deal as won: ${deal.id}`);
        } else if (source === "stripe" && event === "subscription_cancelled") {
          // Churn - mark as lost
          await db
            .update(deals)
            .set({
              stage: "closed_lost",
              probability: 0,
              lostReason: "Customer cancelled subscription",
              closedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(deals.id, existingDeal.id));

          deal = existingDeal;
          console.log(`[Webhook] Marked deal as lost: ${deal.id}`);
        } else {
          deal = existingDeal;
          console.log(`[Webhook] Using existing deal: ${deal.id}`);
        }
      } else {
        // Create new deal
        const dealTitle = generateDealTitle(source, data);
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 1); // Follow up tomorrow

        const [newDeal] = await db
          .insert(deals)
          .values({
            contactId: contact.id,
            title: dealTitle,
            stage: config.stage,
            probability: config.probability,
            tier: data.tier || null,
            billingPeriod: data.billingPeriod || "monthly",
            leadSource: mapSourceToLeadSource(source),
            nextStep: config.nextStep || null,
            followUpDate: config.nextStep ? followUpDate : null,
            notes: data.message || null,
            closedAt: config.stage === "closed_won" ? new Date() : null,
          })
          .returning();

        deal = newDeal;
        console.log(`[Webhook] Created new deal: ${deal.id}`);
      }
    }

    // Log activity
    const [activity] = await db
      .insert(activities)
      .values({
        dealId: deal?.id || null,
        contactId: contact.id,
        type: "note",
        subject: `[Auto] ${formatSourceName(source)}: ${event}`,
        description: formatActivityDescription(source, event, data),
        outcome: "completed",
        completedAt: new Date(),
      })
      .returning();

    console.log(`[Webhook] Created activity: ${activity.id}`);

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      dealId: deal?.id || null,
      activityId: activity.id,
      message: `Processed ${source}:${event}`,
    });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook", details: String(error) },
      { status: 500 }
    );
  }
}

// Helper functions

function mapSourceToContactSource(source: WebhookSource): string {
  const map: Record<WebhookSource, string> = {
    signup: "inbound",
    stripe: "inbound",
    contact_form: "inbound",
    gmail: "inbound",
    ticket: "inbound",
    guest_contact: "inbound",
  };
  return map[source];
}

function mapSourceToLeadSource(source: WebhookSource): string {
  const map: Record<WebhookSource, string> = {
    signup: "inbound",
    stripe: "inbound",
    contact_form: "inbound",
    gmail: "cold_email",
    ticket: "inbound",
    guest_contact: "referral",
  };
  return map[source];
}

function formatSourceName(source: WebhookSource): string {
  const map: Record<WebhookSource, string> = {
    signup: "Trial Signup",
    stripe: "Stripe",
    contact_form: "Contact Form",
    gmail: "Email",
    ticket: "Support Ticket",
    guest_contact: "Guest Contact",
  };
  return map[source];
}

function generateDealTitle(
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

function formatActivityDescription(
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
