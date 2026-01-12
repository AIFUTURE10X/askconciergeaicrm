import type { DealWithContact, DashboardMetrics } from "./types";

export function calculateMetrics(deals: DealWithContact[]): DashboardMetrics {
  const activeDeals = deals.filter(
    (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
  );
  const wonDeals = deals.filter((d) => d.stage === "closed_won");
  const lostDeals = deals.filter((d) => d.stage === "closed_lost");

  const totalPipelineValue = activeDeals.reduce(
    (sum, d) => sum + (d.value ? parseFloat(d.value) : 0),
    0
  );

  const weightedPipelineValue = activeDeals.reduce(
    (sum, d) =>
      sum + (d.value ? (parseFloat(d.value) * (d.probability || 0)) / 100 : 0),
    0
  );

  const wonValue = wonDeals.reduce(
    (sum, d) => sum + (d.value ? parseFloat(d.value) : 0),
    0
  );

  const winRate =
    wonDeals.length + lostDeals.length > 0
      ? Math.round(
          (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
        )
      : 0;

  // Demo-to-Close ratio (all deals in demo_scheduled or later that closed)
  const demoDeals = deals.filter(
    (d) =>
      d.stage === "demo_scheduled" ||
      d.stage === "proposal" ||
      d.stage === "negotiation" ||
      d.stage === "closed_won" ||
      d.stage === "closed_lost"
  );
  const demoToCloseRate =
    demoDeals.length > 0
      ? Math.round((wonDeals.length / demoDeals.length) * 100)
      : 0;

  // Average deal value for won deals
  const avgDealValue = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;

  // Lost reason breakdown
  const lostReasonCounts = lostDeals.reduce(
    (acc, deal) => {
      const reason = deal.lostReason || "unknown";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    activeDeals,
    wonDeals,
    lostDeals,
    totalPipelineValue,
    weightedPipelineValue,
    wonValue,
    winRate,
    demoToCloseRate,
    demoDeals,
    avgDealValue,
    lostReasonCounts,
  };
}
