"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import type { DealWithContact, ReminderWithRelations } from "./dashboard/types";
import { calculateMetrics } from "./dashboard/metrics";
import { PrimaryMetricCards, SecondaryMetricCards } from "./dashboard/MetricCards";
import { PipelineStageCard } from "./dashboard/PipelineStageCard";
import { UpcomingTasksCard } from "./dashboard/UpcomingTasksCard";

export default function DashboardPage() {
  const [deals, setDeals] = useState<DealWithContact[]>([]);
  const [reminders, setReminders] = useState<ReminderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dealsRes, remindersRes] = await Promise.all([
          fetch("/api/deals"),
          fetch("/api/reminders?upcoming=true"),
        ]);

        if (dealsRes.ok) {
          const { deals: dealData } = await dealsRes.json();
          setDeals(dealData);
        }

        if (remindersRes.ok) {
          const { reminders: reminderData } = await remindersRes.json();
          setReminders(reminderData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCompleteReminder = async (id: string) => {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: true }),
    });

    if (res.ok) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const metrics = calculateMetrics(deals);

  return (
    <>
      <Header title="Dashboard" description="Your sales overview" />

      <div className="p-6 space-y-6">
        <PrimaryMetricCards metrics={metrics} />
        <SecondaryMetricCards metrics={metrics} />

        <div className="grid gap-6 lg:grid-cols-2">
          <PipelineStageCard deals={deals} />
          <UpcomingTasksCard
            reminders={reminders}
            onCompleteReminder={handleCompleteReminder}
          />
        </div>
      </div>
    </>
  );
}
