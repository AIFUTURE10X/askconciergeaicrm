import {
  TIER_PRICING,
  EXTRA_PROPERTY_PRICING,
  EXTRA_UNIT_PRICING,
  CRM_ADDON_PRICING,
} from "./constants";

export interface MrrBreakdown {
  baseMrr: number;
  extraPropertiesMrr: number;
  extraUnitsMrr: number;
  crmAddonMrr: number;
  totalMrr: number;
}

/**
 * Calculate the full monthly revenue for a single organization.
 * Pure function — no DB access.
 */
export function calculateAccountMonthlyTotal(
  org: {
    pricingTier: string | null;
    billingPeriod: string | null;
    extraPropertiesCount: number | null;
    extraUnitsCount: number | null;
  },
  hasCrmAddon: boolean,
  crmBillingPeriod: string | null = "monthly"
): MrrBreakdown {
  const tier = org.pricingTier || "ruby";
  const pricing = TIER_PRICING[tier];
  if (!pricing) {
    return { baseMrr: 0, extraPropertiesMrr: 0, extraUnitsMrr: 0, crmAddonMrr: 0, totalMrr: 0 };
  }

  // Base tier MRR (annual spread to monthly)
  const baseMrr =
    org.billingPeriod === "annual" ? pricing.annual / 12 : pricing.monthly;

  // Extra properties
  const extraProps = org.extraPropertiesCount || 0;
  const propRate = EXTRA_PROPERTY_PRICING[tier] || 0;
  const extraPropertiesMrr = extraProps * propRate;

  // Extra units
  const extraUnits = org.extraUnitsCount || 0;
  const unitRate = EXTRA_UNIT_PRICING[tier] || 0;
  const extraUnitsMrr = extraUnits * unitRate;

  // CRM add-on
  let crmAddonMrr = 0;
  if (hasCrmAddon) {
    crmAddonMrr =
      crmBillingPeriod === "annual"
        ? CRM_ADDON_PRICING.annual / 12
        : CRM_ADDON_PRICING.monthly;
  }

  return {
    baseMrr,
    extraPropertiesMrr,
    extraUnitsMrr,
    crmAddonMrr,
    totalMrr: baseMrr + extraPropertiesMrr + extraUnitsMrr + crmAddonMrr,
  };
}
