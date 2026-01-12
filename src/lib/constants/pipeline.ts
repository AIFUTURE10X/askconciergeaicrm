// Pipeline stages with colors and default probabilities
export const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", color: "bg-slate-100 text-slate-700 border-slate-200", probability: 10 },
  { id: "qualified", label: "Qualified", color: "bg-blue-100 text-blue-700 border-blue-200", probability: 25 },
  { id: "demo_scheduled", label: "Demo Scheduled", color: "bg-purple-100 text-purple-700 border-purple-200", probability: 50 },
  { id: "proposal", label: "Proposal Sent", color: "bg-amber-100 text-amber-700 border-amber-200", probability: 65 },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-700 border-orange-200", probability: 80 },
  { id: "closed_won", label: "Closed Won", color: "bg-green-100 text-green-700 border-green-200", probability: 100 },
  { id: "closed_lost", label: "Closed Lost", color: "bg-red-100 text-red-700 border-red-200", probability: 0 },
] as const;

export type StageId = (typeof PIPELINE_STAGES)[number]["id"];

// Active stages (shown in Kanban) - excludes closed stages
export const ACTIVE_STAGES = PIPELINE_STAGES.filter(
  (s) => s.id !== "closed_won" && s.id !== "closed_lost"
);

// All stages including closed (for full Kanban view)
export const ALL_KANBAN_STAGES = PIPELINE_STAGES;

// Closed stages only
export const CLOSED_STAGES = PIPELINE_STAGES.filter(
  (s) => s.id === "closed_won" || s.id === "closed_lost"
);

// AskConciergeAI pricing tiers
export const TIERS = [
  { id: "ruby", label: "Ruby Studio", monthly: 24.9, annual: 249 },
  { id: "sapphire", label: "Sapphire Suite", monthly: 59, annual: 590 },
  { id: "emerald", label: "Emerald Boutique", monthly: 199, annual: 1990 },
  { id: "diamond", label: "Diamond Presidential", monthly: 499, annual: 4990 },
] as const;

export type TierId = (typeof TIERS)[number]["id"];

// Get tier value based on billing period
export function getTierValue(tierId: TierId, billingPeriod: "monthly" | "annual"): number {
  const tier = TIERS.find((t) => t.id === tierId);
  if (!tier) return 0;
  return billingPeriod === "annual" ? tier.annual : tier.monthly;
}

// Property types you're selling to
export const PROPERTY_TYPES = [
  { id: "hotel", label: "Hotel/Resort" },
  { id: "vacation_rental", label: "Vacation Rental Manager" },
  { id: "property_manager", label: "Property Manager" },
  { id: "individual_host", label: "Individual Host" },
] as const;

// Lead sources
export const SOURCES = [
  { id: "cold_outreach", label: "Cold Outreach" },
  { id: "cold_email", label: "Cold Email" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "inbound", label: "Inbound" },
  { id: "referral", label: "Referral" },
  { id: "facebook", label: "Facebook Group" },
] as const;

// Property count ranges (for deal qualification)
export const PROPERTY_COUNT_RANGES = [
  { id: "1-5", label: "1-5 properties" },
  { id: "6-20", label: "6-20 properties" },
  { id: "21-50", label: "21-50 properties" },
  { id: "50+", label: "50+ properties" },
] as const;

// Current systems (what they're using now)
export const CURRENT_SYSTEMS = [
  { id: "manual", label: "Manual/Paper" },
  { id: "spreadsheet", label: "Spreadsheets" },
  { id: "nothing", label: "Nothing" },
  { id: "competitor", label: "Competitor" },
  { id: "custom", label: "Custom Solution" },
  { id: "other", label: "Other" },
] as const;

// Pain points (why they're talking to us)
export const PAIN_POINTS = [
  { id: "guest_calls", label: "Too many guest calls" },
  { id: "upsells", label: "Want to increase upsells" },
  { id: "efficiency", label: "Staff efficiency" },
  { id: "guest_experience", label: "Improve guest experience" },
  { id: "response_time", label: "Slow response times" },
  { id: "scaling", label: "Need to scale operations" },
  { id: "other", label: "Other" },
] as const;

// Lost reasons (why we lost the deal) - simplified to 4 core options
export const LOST_REASONS = [
  { id: "price", label: "Price" },
  { id: "competitor", label: "Competitor" },
  { id: "feature_missing", label: "Missing Feature" },
  { id: "no_response", label: "No Response" },
] as const;

// Activity types with icons
export const ACTIVITY_TYPES = [
  { id: "call", label: "Phone Call", icon: "Phone" },
  { id: "email", label: "Email", icon: "Mail" },
  { id: "demo", label: "Demo", icon: "Presentation" },
  { id: "meeting", label: "Meeting", icon: "Users" },
  { id: "linkedin_message", label: "LinkedIn", icon: "Linkedin" },
  { id: "note", label: "Note", icon: "StickyNote" },
] as const;

// Priority levels
export const PRIORITIES = [
  { id: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { id: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { id: "high", label: "High", color: "bg-red-100 text-red-700" },
] as const;

// Helper to get stage by ID
export function getStage(id: string) {
  return PIPELINE_STAGES.find((s) => s.id === id);
}

// Helper to get tier by ID
export function getTier(id: string) {
  return TIERS.find((t) => t.id === id);
}
