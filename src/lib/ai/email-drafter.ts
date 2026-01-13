/**
 * AI Email Drafter
 *
 * Uses Gemini 2.5 Flash to generate contextual email draft responses.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type DraftTone = "professional" | "friendly" | "concise" | "follow_up";

interface DraftContext {
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  contactName?: string;
  companyName?: string;
  dealTitle?: string;
  dealStage?: string;
}

interface OutreachContext {
  contactName: string;
  contactEmail: string;
  contactCompany?: string;
  dealTitle: string;
  dealStage: string;
  dealTier?: string;
  enquiryType?: string;
  nextStep?: string;
}

interface GeneratedDraft {
  subject: string;
  body: string;
}

const TONE_INSTRUCTIONS: Record<DraftTone, string> = {
  professional:
    "Use a formal, business-appropriate tone. Be polite and respectful.",
  friendly:
    "Use a warm, personable tone. Be approachable while maintaining professionalism.",
  concise: "Be brief and to-the-point. Focus on essential information only.",
  follow_up:
    "Use a gentle follow-up tone. Acknowledge the previous conversation and move things forward.",
};

export async function generateEmailDraft(
  context: DraftContext,
  tone: DraftTone = "professional"
): Promise<GeneratedDraft> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = `You are an AI assistant helping draft email responses for a sales CRM. Your job is to draft professional, helpful responses to incoming business inquiries.

Guidelines:
- ${TONE_INSTRUCTIONS[tone]}
- Keep responses focused and actionable
- Don't make up specific details about products, pricing, or capabilities
- If the email is asking about services, express interest in learning more about their needs
- Include a clear call-to-action (schedule a call, reply with more info, etc.)
- Sign off as "Best regards," followed by a newline - the user will add their name before sending
- Keep the response between 100-200 words unless the inquiry requires more detail

Context about the sender (if available):
${context.contactName ? `- Contact Name: ${context.contactName}` : ""}
${context.companyName ? `- Company: ${context.companyName}` : ""}
${context.dealTitle ? `- Related Deal: ${context.dealTitle}` : ""}
${context.dealStage ? `- Deal Stage: ${context.dealStage}` : ""}`;

  const userPrompt = `Generate a draft email response to this incoming email:

From: ${context.fromName} <${context.fromEmail}>
Subject: ${context.subject}

---
${context.body.slice(0, 3000)}
---

Generate:
1. A reply subject line (typically "Re: [original subject]" unless a different subject is more appropriate)
2. The email body

Format your response as JSON with this exact structure:
{"subject": "Re: ...", "body": "..."}

Only output the JSON, nothing else.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt,
  });

  const response = result.response;
  const text = response.text();

  try {
    // Clean up response - remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanedText);
    return {
      subject: parsed.subject || `Re: ${context.subject}`,
      body: parsed.body,
    };
  } catch {
    // Fallback: treat entire response as body
    return {
      subject: `Re: ${context.subject}`,
      body: text,
    };
  }
}

export async function regenerateDraft(
  context: DraftContext,
  tone: DraftTone,
  previousDraft: string,
  feedback?: string
): Promise<GeneratedDraft> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = `You are an AI assistant helping regenerate email drafts for a sales CRM.

Tone: ${TONE_INSTRUCTIONS[tone]}
${feedback ? `User feedback: ${feedback}` : "User wants a fresh take on this draft."}

Generate a new, improved draft that addresses the feedback or takes a different approach.`;

  const userPrompt = `Original email received:
From: ${context.fromName} <${context.fromEmail}>
Subject: ${context.subject}
${context.body.slice(0, 2000)}

Previous draft that needs improvement:
${previousDraft}

Generate a new, improved draft response as JSON:
{"subject": "...", "body": "..."}

Only output the JSON, nothing else.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt,
  });

  const response = result.response;
  const text = response.text();

  try {
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanedText);
    return {
      subject: parsed.subject || `Re: ${context.subject}`,
      body: parsed.body,
    };
  } catch {
    return {
      subject: `Re: ${context.subject}`,
      body: text,
    };
  }
}

const STAGE_GUIDANCE: Record<string, string> = {
  lead: "This is a new lead. Introduce yourself and AskConciergeAI briefly. Express interest in learning about their property/business needs. Suggest a quick call to discuss how we can help.",
  qualified: "This lead has been qualified. Follow up on their expressed interest. Highlight relevant features for their property type. Offer to schedule a demo or discovery call.",
  demo_scheduled: "A demo has been scheduled. Confirm the upcoming demo, share what they can expect, and ask if they have any questions before the call.",
  proposal: "A proposal has been sent. Check in to see if they have questions about the proposal. Offer to discuss pricing or features in more detail.",
  negotiation: "We're in negotiation. Address any remaining concerns, discuss next steps for moving forward, and offer flexibility where appropriate.",
};

export async function generateOutreachDraft(
  context: OutreachContext,
  tone: DraftTone = "professional"
): Promise<GeneratedDraft> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const stageGuidance = STAGE_GUIDANCE[context.dealStage] || STAGE_GUIDANCE.lead;

  const systemPrompt = `You are an AI assistant helping draft outreach emails for AskConciergeAI, a guest communication platform for hotels and vacation rentals.

Guidelines:
- ${TONE_INSTRUCTIONS[tone]}
- ${stageGuidance}
- Keep the email focused and actionable
- Include a clear call-to-action (schedule a call, reply to discuss, etc.)
- Sign off as "Best regards," followed by a newline - the user will add their name before sending
- Keep the email between 100-150 words
- Don't make up specific pricing or feature details

Context:
- Contact Name: ${context.contactName}
- Company: ${context.contactCompany || "Not specified"}
- Deal: ${context.dealTitle}
- Current Stage: ${context.dealStage}
${context.dealTier ? `- Tier Interest: ${context.dealTier}` : ""}
${context.enquiryType ? `- Enquiry Type: ${context.enquiryType}` : ""}
${context.nextStep ? `- Suggested Next Step: ${context.nextStep}` : ""}`;

  const userPrompt = `Generate an outreach email to ${context.contactName} at ${context.contactCompany || "their company"}.

This is a ${context.dealStage.replace("_", " ")} stage deal. Create an appropriate email for this stage.

Generate:
1. A compelling subject line
2. The email body

Format your response as JSON with this exact structure:
{"subject": "...", "body": "..."}

Only output the JSON, nothing else.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt,
  });

  const response = result.response;
  const text = response.text();

  try {
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanedText);
    return {
      subject: parsed.subject || `Following up - ${context.dealTitle}`,
      body: parsed.body,
    };
  } catch {
    return {
      subject: `Following up - ${context.dealTitle}`,
      body: text,
    };
  }
}
