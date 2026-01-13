import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deals, emailDrafts, processedEmails } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateEmailDraft, generateOutreachDraft } from "@/lib/ai/email-drafter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Fetch deal with contact and gmailAccount
    const deal = await db.query.deals.findFirst({
      where: eq(deals.id, id),
      with: {
        contact: true,
        gmailAccount: true,
      },
    });

    if (!deal) {
      return NextResponse.json({ message: "Deal not found" }, { status: 404 });
    }

    if (!deal.contact?.email) {
      return NextResponse.json(
        { message: "Deal has no contact with email address" },
        { status: 400 }
      );
    }

    // Check for existing original email context (Gmail-sourced deals)
    const originalEmail = await db.query.processedEmails.findFirst({
      where: eq(processedEmails.dealId, id),
    });

    let generatedDraft;

    if (originalEmail?.subject && originalEmail?.fromEmail) {
      // Gmail-sourced deal: generate reply to original email
      generatedDraft = await generateEmailDraft({
        fromName: originalEmail.fromEmail.split("@")[0] || "Contact",
        fromEmail: originalEmail.fromEmail,
        subject: originalEmail.subject,
        body: "", // We don't have the body stored in processedEmails
        contactName: deal.contact.name,
        companyName: deal.contact.company || undefined,
        dealTitle: deal.title,
        dealStage: deal.stage,
      });
    } else {
      // Non-Gmail deal: generate outreach email
      generatedDraft = await generateOutreachDraft({
        contactName: deal.contact.name,
        contactEmail: deal.contact.email,
        contactCompany: deal.contact.company || undefined,
        dealTitle: deal.title,
        dealStage: deal.stage,
        dealTier: deal.tier || undefined,
        enquiryType: deal.enquiryType || undefined,
        nextStep: deal.nextStep || undefined,
      });
    }

    // Create emailDraft record
    const [newDraft] = await db
      .insert(emailDrafts)
      .values({
        originalFromEmail: deal.contact.email,
        originalFromName: deal.contact.name,
        originalSubject: originalEmail?.subject || null,
        draftSubject: generatedDraft.subject,
        draftBody: generatedDraft.body,
        tone: "professional",
        status: "pending",
        contactId: deal.contact.id,
        dealId: deal.id,
        gmailAccountId: deal.gmailAccountId,
        gmailThreadId: originalEmail?.gmailMessageId || null,
      })
      .returning();

    return NextResponse.json({
      draftId: newDraft.id,
      message: "Draft generated successfully",
    });
  } catch (error) {
    console.error("Error generating draft:", error);
    return NextResponse.json(
      { message: "Failed to generate draft" },
      { status: 500 }
    );
  }
}
