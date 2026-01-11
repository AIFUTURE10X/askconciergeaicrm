export const DRAFT_STATUSES = [
  { id: "pending", label: "Pending Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { id: "approved", label: "Approved", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "sent", label: "Sent", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { id: "rejected", label: "Rejected", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  { id: "failed", label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { id: "generating", label: "Generating...", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
] as const;

export type DraftStatus = (typeof DRAFT_STATUSES)[number]["id"];

export const DRAFT_TONES = [
  { id: "professional", label: "Professional", description: "Formal and business-appropriate" },
  { id: "friendly", label: "Friendly", description: "Warm and personable" },
  { id: "concise", label: "Concise", description: "Brief and to-the-point" },
  { id: "follow_up", label: "Follow-up", description: "Gentle follow-up tone" },
] as const;

export type DraftTone = (typeof DRAFT_TONES)[number]["id"];

export function getDraftStatus(id: string) {
  return DRAFT_STATUSES.find((s) => s.id === id);
}

export function getDraftTone(id: string) {
  return DRAFT_TONES.find((t) => t.id === id);
}
