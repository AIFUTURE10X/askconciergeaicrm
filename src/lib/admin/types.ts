export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  type: string;
  pricingTier: string | null;
  subscriptionStatus: string | null;
  billingPeriod: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  trialExtendedCount: number | null;
  extraPropertiesCount: number | null;
  extraUnitsCount: number | null;
  phoneNumber: string | null;
  defaultLanguage: string | null;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  // Computed fields
  propertyCount: number;
  unitCount: number;
  memberCount: number;
  owner: { email: string; name: string | null } | null;
}

export interface AdminOrgDetail extends AdminOrganization {
  customDomain: string | null;
  logoUrl: string | null;
}

export interface AdminOrgFilters {
  search?: string;
  tier?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminStats {
  total: number;
  active: number;
  trialing: number;
  pastDue: number;
  canceled: number;
  newThisMonth: number;
  estimatedMrr: number;
  baseMrr: number;
  expansionMrr: number;
  crmAddonMrr: number;
  crmAddonCount: number;
  totalUnitsManaged: number;
  byTier: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface AdminOrgMember {
  id: string;
  userId: string;
  role: string;
  jobTitle: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface AdminOrgUsage {
  month: string;
  messagesUsed: number;
  messagesCached: number;
  messagesFaqMatched: number;
  messagesDirectLookup: number;
  tokensInput: number;
  tokensOutput: number;
}
