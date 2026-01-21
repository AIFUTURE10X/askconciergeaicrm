"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";
import { LOST_REASONS } from "@/lib/constants/pipeline";
import type { DashboardMetrics } from "./types";

interface MetricCardsProps {
  metrics: DashboardMetrics;
}

export function PrimaryMetricCards({ metrics }: MetricCardsProps) {
  const {
    totalPipelineValue,
    weightedPipelineValue,
    activeDeals,
    wonDeals,
    wonValue,
    winRate,
  } = metrics;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalPipelineValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            ${weightedPipelineValue.toLocaleString()} weighted
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeDeals.length}</div>
          <p className="text-xs text-muted-foreground">in pipeline</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{wonDeals.length}</div>
          <p className="text-xs text-muted-foreground">
            ${wonValue.toLocaleString()} total value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{winRate}%</div>
          <p className="text-xs text-muted-foreground">closed deals</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function SecondaryMetricCards({ metrics }: MetricCardsProps) {
  const {
    demoToCloseRate,
    wonDeals,
    demoDeals,
    avgDealValue,
    lostDeals,
    lostReasonCounts,
  } = metrics;

  const topLostReason =
    Object.keys(lostReasonCounts).length > 0
      ? LOST_REASONS.find(
          (r) =>
            r.id ===
            Object.entries(lostReasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
        )?.label || "Unknown"
      : null;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Demo → Close Rate
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{demoToCloseRate}%</div>
          <p className="text-xs text-muted-foreground">
            {wonDeals.length} won from {demoDeals.length} demos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $
            {avgDealValue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            from {wonDeals.length} closed deals
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lost Deals</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {lostDeals.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {topLostReason && <>Top: {topLostReason}</>}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
