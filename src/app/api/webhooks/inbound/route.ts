import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, deals, activities } from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import { requireApiKey } from "@/lib/auth/api-key";
import type { WebhookPayload } from "./types";
import { ACCOUNT_TYPE_MAP, SOURCE_CONFIG } from "./constants";
import {
  mapSourceToContactSource,
  mapSourceToLeadSource,
  formatSourceName,
  generateDealTitle,
  formatActivityDescription,
} from "./utils";

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
        deal = await handleExistingDeal(existingDeal, source, event, data);
      } else {
        deal = await createNewDeal(contact.id, source, data, config);
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

async function handleExistingDeal(
  existingDeal: typeof deals.$inferSelect,
  source: WebhookPayload["source"],
  event: string,
  data: WebhookPayload["data"]
) {
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

    console.log(`[Webhook] Marked deal as won: ${existingDeal.id}`);
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

    console.log(`[Webhook] Marked deal as lost: ${existingDeal.id}`);
  } else {
    console.log(`[Webhook] Using existing deal: ${existingDeal.id}`);
  }

  return existingDeal;
}

async function createNewDeal(
  contactId: string,
  source: WebhookPayload["source"],
  data: WebhookPayload["data"],
  config: typeof SOURCE_CONFIG[keyof typeof SOURCE_CONFIG]
) {
  // Extract enquiry type from metadata (for contact_form source)
  const enquiryType = (data.metadata?.enquiryType as string) || null;

  const dealTitle = generateDealTitle(source, data, enquiryType);
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 1); // Follow up tomorrow

  const [newDeal] = await db
    .insert(deals)
    .values({
      contactId,
      title: dealTitle,
      stage: config.stage,
      probability: config.probability,
      tier: data.tier || null,
      billingPeriod: data.billingPeriod || "monthly",
      leadSource: mapSourceToLeadSource(source),
      enquiryType: enquiryType,
      nextStep: config.nextStep || null,
      followUpDate: config.nextStep ? followUpDate : null,
      notes: data.message || null,
      closedAt: config.stage === "closed_won" ? new Date() : null,
    })
    .returning();

  console.log(`[Webhook] Created new deal: ${newDeal.id} (enquiryType: ${enquiryType || 'none'})`);
  return newDeal;
}
