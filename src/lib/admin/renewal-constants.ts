export const CHURN_REASON_LABELS: Record<string, string> = {
  pricing: "Too expensive",
  not_using: "Not using the product",
  competitor: "Switched to competitor",
  missing_features: "Missing features",
  support: "Support issues",
  other: "Other",
};

export const CHURN_REASONS = Object.keys(CHURN_REASON_LABELS);
