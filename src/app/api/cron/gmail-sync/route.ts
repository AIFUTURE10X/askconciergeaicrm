/**
 * Gmail Sync Cron Job
 *
 * Runs every 5 minutes to fetch new emails and create leads in the CRM.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  contacts,
  deals,
  activities,
  processedEmails,
  emailDrafts,
} from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import {
  isGmailConnected,
  fetchUnreadEmails,
  markAsRead,
  addLabel,
} from "@/lib/gmail/client";
import { generateEmailDraft } from "@/lib/ai/email-drafter";

// Verify cron secret for Vercel Cron
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");

  // Vercel Cron sends the secret as Bearer token
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Gmail Sync] Starting sync...");

  // Check if Gmail is connected
  const connected = await isGmailConnected();
  if (!connected) {
    console.log("[Gmail Sync] Gmail not connected, skipping");
    return NextResponse.json({
      success: false,
      message: "Gmail not connected",
    });
  }

  try {
    // Fetch unread emails
    // Optional: filter by label (e.g., "Sales" or "Leads")
    const labelFilter = process.env.GMAIL_LABEL_FILTER || undefined;
    const emails = await fetchUnreadEmails(labelFilter, 20);

    console.log(`[Gmail Sync] Found ${emails.length} unread emails`);

    let processed = 0;
    let skipped = 0;

    for (const email of emails) {
      // Check if already processed
      const existing = await db.query.processedEmails.findFirst({
        where: eq(processedEmails.gmailMessageId, email.id),
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Skip emails from common no-reply addresses
      if (isNoReplyEmail(email.fromEmail)) {
        // Mark as read and skip
        await markAsRead(email.id);
        await db.insert(processedEmails).values({
          gmailMessageId: email.id,
          fromEmail: email.fromEmail,
          subject: email.subject,
        });
        skipped++;
        continue;
      }

      // Find or create contact
      let contact = await db.query.contacts.findFirst({
        where: ilike(contacts.email, email.fromEmail.toLowerCase()),
      });

      if (!contact) {
        const [newContact] = await db
          .insert(contacts)
          .values({
            name: email.fromName || email.fromEmail.split("@")[0],
            email: email.fromEmail.toLowerCase(),
            source: "inbound",
            notes: `First contact via email: ${email.subject}`,
          })
          .returning();

        contact = newContact;
        console.log(`[Gmail Sync] Created contact: ${contact.email}`);
      }

      // Create deal
      const [deal] = await db
        .insert(deals)
        .values({
          contactId: contact.id,
          title: `${email.fromName || email.fromEmail} - Email Inquiry`,
          stage: "lead",
          probability: 10,
          leadSource: "cold_email",
          nextStep: "Qualify lead - respond to email",
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          notes: `Subject: ${email.subject}\n\n${email.body.substring(0, 1000)}`,
        })
        .returning();

      console.log(`[Gmail Sync] Created deal: ${deal.id}`);

      // Log activity
      await db.insert(activities).values({
        dealId: deal.id,
        contactId: contact.id,
        type: "email",
        subject: `Inbound Email: ${email.subject}`,
        description: email.body.substring(0, 2000),
        outcome: "completed",
        completedAt: email.date,
      });

      // Record as processed
      const [processedEmail] = await db
        .insert(processedEmails)
        .values({
          gmailMessageId: email.id,
          fromEmail: email.fromEmail,
          subject: email.subject,
          contactId: contact.id,
          dealId: deal.id,
        })
        .returning();

      // Generate AI draft response
      try {
        const draftResult = await generateEmailDraft({
          fromName: email.fromName || email.fromEmail.split("@")[0],
          fromEmail: email.fromEmail,
          subject: email.subject || "",
          body: email.body,
          contactName: contact.name,
          companyName: contact.company || undefined,
          dealTitle: deal.title,
          dealStage: deal.stage,
        });

        await db.insert(emailDrafts).values({
          processedEmailId: processedEmail.id,
          originalFromEmail: email.fromEmail,
          originalFromName: email.fromName,
          originalSubject: email.subject,
          originalBody: email.body,
          originalReceivedAt: email.date,
          gmailThreadId: email.threadId,
          gmailMessageId: email.id,
          draftSubject: draftResult.subject,
          draftBody: draftResult.body,
          tone: "professional",
          status: "pending",
          contactId: contact.id,
          dealId: deal.id,
        });

        console.log(`[Gmail Sync] AI draft created for: ${email.subject}`);
      } catch (aiError) {
        console.error("[Gmail Sync] AI draft generation failed:", aiError);
        // Continue processing - don't fail the whole sync for AI errors
      }

      // Mark as read and add label
      await markAsRead(email.id);
      try {
        await addLabel(email.id, "CRM-Imported");
      } catch {
        // Label creation might fail, not critical
      }

      processed++;
    }

    console.log(`[Gmail Sync] Complete: ${processed} processed, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      total: emails.length,
    });
  } catch (error) {
    console.error("[Gmail Sync] Error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Check if an email is from a no-reply address
 */
function isNoReplyEmail(email: string): boolean {
  const noReplyPatterns = [
    "noreply",
    "no-reply",
    "donotreply",
    "do-not-reply",
    "mailer-daemon",
    "postmaster",
    "notifications",
    "alert",
    "system",
    "automated",
  ];

  const lowerEmail = email.toLowerCase();
  return noReplyPatterns.some((pattern) => lowerEmail.includes(pattern));
}
