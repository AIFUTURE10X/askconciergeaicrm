/**
 * Manual Gmail Sync Endpoint
 *
 * Allows triggering a Gmail sync from the settings page.
 * This endpoint wraps the cron logic but doesn't require CRON_SECRET.
 */

import { NextResponse } from "next/server";
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
  fetchEmails,
  markAsRead,
  addLabel,
} from "@/lib/gmail/client";
import { generateEmailDraft } from "@/lib/ai/email-drafter";

export async function POST() {
  console.log("[Gmail Manual Sync] Starting sync...");

  // Check if Gmail is connected
  const connected = await isGmailConnected();
  if (!connected) {
    console.log("[Gmail Manual Sync] Gmail not connected");
    return NextResponse.json({
      success: false,
      message: "Gmail not connected",
    });
  }

  try {
    // Fetch recent emails (including read ones) from last 7 days
    const labelFilter = process.env.GMAIL_LABEL_FILTER || undefined;
    const emails = await fetchEmails({
      labelFilter,
      maxResults: 50,
      onlyUnread: false,
      newerThanDays: 7,
    });

    console.log(`[Gmail Manual Sync] Found ${emails.length} emails from last 7 days`);

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

      // Skip no-reply emails
      if (isNoReplyEmail(email.fromEmail)) {
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
        console.log(`[Gmail Manual Sync] Created contact: ${contact.email}`);
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
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          notes: `Subject: ${email.subject}\n\n${email.body.substring(0, 1000)}`,
        })
        .returning();

      console.log(`[Gmail Manual Sync] Created deal: ${deal.id}`);

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

      // Generate AI draft
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

        console.log(`[Gmail Manual Sync] AI draft created for: ${email.subject}`);
      } catch (aiError) {
        console.error("[Gmail Manual Sync] AI draft failed:", aiError);
      }

      // Mark as read and label
      await markAsRead(email.id);
      try {
        await addLabel(email.id, "CRM-Imported");
      } catch {
        // Label might fail, not critical
      }

      processed++;
    }

    console.log(`[Gmail Manual Sync] Complete: ${processed} processed, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      total: emails.length,
    });
  } catch (error) {
    console.error("[Gmail Manual Sync] Error:", error);
    return NextResponse.json(
      { success: false, error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}

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
