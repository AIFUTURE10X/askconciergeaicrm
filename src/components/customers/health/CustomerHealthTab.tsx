"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { HealthScoreRing } from "./HealthScoreRing";
import { HealthBreakdownCard } from "./HealthBreakdownCard";
import type { CustomerHealthData } from "@/lib/admin/health";

interface Props {
  orgId: string;
}

export function CustomerHealthTab({ orgId }: Props) {
  const [health, setHealth] = useState<CustomerHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers/${orgId}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data.health);
      }
    } catch (error) {
      console.error("Error loading health:", error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Health data unavailable for this customer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Score ring */}
        <div className="flex flex-col items-center gap-2">
          <HealthScoreRing score={health.breakdown.total} size={140} />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {health.chatSessionsLast30d} chats (30d)
            </p>
            <p className="text-xs text-muted-foreground">
              {health.usagePercent}% AI usage
            </p>
            <p className="text-xs text-muted-foreground">
              {health.propertyCount} properties
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full">
          <HealthBreakdownCard breakdown={health.breakdown} />
        </div>
      </div>

      {/* Quick insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Last Guest Chat</p>
          <p className="font-medium">
            {health.daysSinceLastChat === null
              ? "Never"
              : health.daysSinceLastChat === 0
              ? "Today"
              : `${health.daysSinceLastChat} days ago`}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">AI Usage This Month</p>
          <p className="font-medium">{health.usagePercent}% of limit</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Guest Sessions (30d)</p>
          <p className="font-medium">{health.chatSessionsLast30d}</p>
        </div>
      </div>
    </div>
  );
}
