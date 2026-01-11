/**
 * Send Draft API
 *
 * POST - Send the draft email via Gmail
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailDrafts, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/gmail/send";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const draft = await db.query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, id),
      with: { contact: true, deal: true },
    });

    if (!draft) {
      return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    }

    if (draft.status === "sent") {
      return NextResponse.json(
        { message: "Draft already sent" },
        { status: 400 }
      );
    }

    // Send via Gmail
    const result = await sendEmail({
      to: draft.originalFromEmail,
      subject: draft.draftSubject || `Re: ${draft.originalSubject}`,
      body: draft.draftBody,
      threadId: draft.gmailThreadId || undefined,
      inReplyTo: draft.gmailMessageId || undefined,
    });

    if (!result.success) {
      // Mark as failed
      await db
        .update(emailDrafts)
        .set({
          status: "failed",
          errorMessage: result.error,
          updatedAt: new Date(),
        })
        .where(eq(emailDrafts.id, id));

      return NextResponse.json(
        { message: "Failed to send email", error: result.error },
        { status: 500 }
      );
    }

    // Mark as sent
    await db
      .update(emailDrafts)
      .set({
        status: "sent",
        sentAt: new Date(),
        sentGmailMessageId: result.messageId,
        updatedAt: new Date(),
      })
      .where(eq(emailDrafts.id, id));

    // Log activity
    if (draft.dealId || draft.contactId) {
      await db.insert(activities).values({
        dealId: draft.dealId,
        contactId: draft.contactId,
        type: "email",
        subject: `Sent: ${draft.draftSubject || `Re: ${draft.originalSubject}`}`,
        description: draft.draftBody.substring(0, 2000),
        outcome: "completed",
        completedAt: new Date(),
      });
    }

    return NextResponse.json({
      message: "Email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("[Drafts API] Error sending draft:", error);
    return NextResponse.json(
      { message: "Failed to send email" },
      { status: 500 }
    );
  }
}
