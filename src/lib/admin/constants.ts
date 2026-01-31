export const TIER_PRICING: Record<string, { monthly: number; annual: number }> = {
  ruby: { monthly: 18, annual: 180 },
  sapphire: { monthly: 59, annual: 590 },
  emerald: { monthly: 199, annual: 1990 },
  diamond: { monthly: 349, annual: 3490 },
};

export const TIER_LIMITS: Record<string, { properties: number; messages: number; units: number }> = {
  ruby: { properties: 2, messages: 1000, units: 10 },
  sapphire: { properties: 10, messages: 5000, units: 50 },
  emerald: { properties: 50, messages: 20000, units: 250 },
  diamond: { properties: 100, messages: 50000, units: 500 },
};

export const TIER_LABELS: Record<string, string> = {
  ruby: "Ruby Studio",
  sapphire: "Sapphire Suite",
  emerald: "Emerald Boutique",
  diamond: "Diamond Presidential",
};

export const TIER_COLORS: Record<string, string> = {
  ruby: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  sapphire: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  diamond: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

export const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past Due",
  canceled: "Canceled",
  expired: "Expired",
};

export const STATUS_COLORS: Record<string, string> = {
  trialing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  past_due: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  canceled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  expired: "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500",
};

export const VALID_TIERS = ["ruby", "sapphire", "emerald", "diamond"];
export const VALID_STATUSES = ["trialing", "active", "past_due", "canceled", "expired"];

// Per-unit/property monthly prices by tier (matches main app stripe.ts)
export const EXTRA_PROPERTY_PRICING: Record<string, number> = {
  sapphire: 1.5,
  emerald: 1.2,
  diamond: 1.0,
};

export const EXTRA_UNIT_PRICING: Record<string, number> = {
  sapphire: 1.5,
  emerald: 1.2,
  diamond: 1.0,
};

export const CRM_ADDON_PRICING = {
  monthly: 29,
  annual: 290,
};
