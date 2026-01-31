// Health score weights and thresholds

export const HEALTH_WEIGHTS = {
  aiUsage: 25,
  propertySetup: 25,
  guestEngagement: 25,
  supportHealth: 15,
  accountActivity: 10,
} as const;

export const HEALTH_CATEGORIES = {
  healthy: { min: 70, max: 100, label: "Healthy", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", dotColor: "bg-green-500" },
  atRisk: { min: 40, max: 69, label: "At Risk", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dotColor: "bg-amber-500" },
  critical: { min: 0, max: 39, label: "Critical", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dotColor: "bg-red-500" },
} as const;

export type HealthCategory = keyof typeof HEALTH_CATEGORIES;

export function getHealthCategory(score: number): HealthCategory {
  if (score >= 70) return "healthy";
  if (score >= 40) return "atRisk";
  return "critical";
}

export function getHealthCategoryInfo(score: number) {
  return HEALTH_CATEGORIES[getHealthCategory(score)];
}
