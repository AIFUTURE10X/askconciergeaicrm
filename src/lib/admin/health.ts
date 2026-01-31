import { HEALTH_WEIGHTS, getHealthCategory, type HealthCategory } from "./health-constants";

// ============================================
// Types
// ============================================

export interface HealthScoreBreakdown {
  aiUsage: number;        // 0-25
  propertySetup: number;  // 0-25
  guestEngagement: number; // 0-25
  supportHealth: number;  // 0-15
  accountActivity: number; // 0-10
  total: number;          // 0-100
  category: HealthCategory;
}

export interface OrgHealthInput {
  /** Percentage of AI messages used (0-100) */
  usagePercent: number;
  /** Per-property data: has FAQs, has content sections, has access tokens */
  properties: Array<{ hasFaqs: boolean; hasContent: boolean; hasTokens: boolean }>;
  /** Number of chat sessions in last 30 days */
  chatSessionsLast30d: number;
  /** Number of open tickets */
  openTickets: number;
  /** Number of open high-priority tickets */
  openHighPriorityTickets: number;
  /** Total tickets ever */
  totalTickets: number;
  /** Resolved tickets count */
  resolvedTickets: number;
  /** Days since last chat session (null if never) */
  daysSinceLastChat: number | null;
}

export interface CustomerHealthData {
  orgId: string;
  orgName: string;
  slug: string;
  pricingTier: string | null;
  subscriptionStatus: string | null;
  owner: { email: string; name: string | null } | null;
  propertyCount: number;
  breakdown: HealthScoreBreakdown;
  usagePercent: number;
  chatSessionsLast30d: number;
  daysSinceLastChat: number | null;
}

export interface HealthDashboardStats {
  avgScore: number;
  healthyCount: number;
  atRiskCount: number;
  criticalCount: number;
  totalCustomers: number;
}

// ============================================
// Pure scoring functions
// ============================================

function scoreAiUsage(usagePercent: number): number {
  if (usagePercent <= 0) return 0;
  if (usagePercent <= 20) return 10;
  if (usagePercent <= 50) return 18;
  if (usagePercent <= 80) return 25;
  if (usagePercent <= 95) return 20;
  return 12; // Over 95% - might hit limit soon
}

function scorePropertySetup(
  properties: Array<{ hasFaqs: boolean; hasContent: boolean; hasTokens: boolean }>
): number {
  if (properties.length === 0) return 0;

  let totalPropertyScore = 0;
  for (const p of properties) {
    let propScore = 0;
    if (p.hasFaqs) propScore += 8;
    if (p.hasContent) propScore += 9;
    if (p.hasTokens) propScore += 8;
    totalPropertyScore += propScore;
  }

  // Average across all properties, max 25
  const maxPerProperty = 25;
  return Math.min(maxPerProperty, Math.round(totalPropertyScore / properties.length));
}

function scoreGuestEngagement(sessions30d: number): number {
  if (sessions30d === 0) return 0;
  if (sessions30d <= 5) return 8;
  if (sessions30d <= 20) return 16;
  if (sessions30d <= 50) return 22;
  return 25;
}

function scoreSupportHealth(
  openTickets: number,
  openHighPriority: number,
  totalTickets: number,
  resolvedTickets: number,
): number {
  if (totalTickets === 0) return 15; // No tickets = healthy

  let score = 15;
  score -= openTickets * 2;
  score -= openHighPriority * 3;
  if (totalTickets > 0 && (resolvedTickets / totalTickets) > 0.8) {
    score += 5;
  }

  return Math.max(0, Math.min(15, score));
}

function scoreAccountActivity(daysSinceLastChat: number | null): number {
  if (daysSinceLastChat === null) return 2; // Never chatted
  if (daysSinceLastChat < 7) return 10;
  if (daysSinceLastChat < 14) return 7;
  if (daysSinceLastChat < 30) return 4;
  return 1;
}

// ============================================
// Main scoring function
// ============================================

export function calculateHealthScore(input: OrgHealthInput): HealthScoreBreakdown {
  const aiUsage = scoreAiUsage(input.usagePercent);
  const propertySetup = scorePropertySetup(input.properties);
  const guestEngagement = scoreGuestEngagement(input.chatSessionsLast30d);
  const supportHealth = scoreSupportHealth(
    input.openTickets,
    input.openHighPriorityTickets,
    input.totalTickets,
    input.resolvedTickets,
  );
  const accountActivity = scoreAccountActivity(input.daysSinceLastChat);

  const total = aiUsage + propertySetup + guestEngagement + supportHealth + accountActivity;

  return {
    aiUsage,
    propertySetup,
    guestEngagement,
    supportHealth,
    accountActivity,
    total,
    category: getHealthCategory(total),
  };
}
