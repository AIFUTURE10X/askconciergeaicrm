"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Calendar,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { PIPELINE_STAGES, TIERS, getTier, getStage, LOST_REASONS } from "@/lib/constants/pipeline";
import type { Deal, Contact, Reminder } from "@/lib/db/schema";

type DealWithContact = Deal & { contact: Contact | null };
type ReminderWithRelations = Reminder & {
  deal: (Deal & { contact: Contact | null }) | null;
  contact: Contact | null;
};

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

  // Calculate metrics
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
    (sum, d) => sum + (d.value ? parseFloat(d.value) * (d.probability || 0) / 100 : 0),
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
  const demoDeals = deals.filter((d) =>
    d.stage === "demo_scheduled" ||
    d.stage === "proposal" ||
    d.stage === "negotiation" ||
    d.stage === "closed_won" ||
    d.stage === "closed_lost"
  );
  const demoToCloseRate = demoDeals.length > 0
    ? Math.round((wonDeals.length / demoDeals.length) * 100)
    : 0;

  // Average deal value for won deals
  const avgDealValue = wonDeals.length > 0
    ? wonValue / wonDeals.length
    : 0;

  // Lost reason breakdown
  const lostReasonCounts = lostDeals.reduce((acc, deal) => {
    const reason = deal.lostReason || "unknown";
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Complete reminder
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

  return (
    <>
      <Header title="Dashboard" description="Your sales overview" />

      <div className="p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pipeline Value
              </CardTitle>
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
              <p className="text-xs text-muted-foreground">
                in pipeline
              </p>
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
              <p className="text-xs text-muted-foreground">
                closed deals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demo → Close Rate</CardTitle>
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
                ${avgDealValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                {Object.keys(lostReasonCounts).length > 0 && (
                  <>Top: {LOST_REASONS.find((r) => r.id === Object.entries(lostReasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0])?.label || "Unknown"}</>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Stage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PIPELINE_STAGES.filter(
                  (s) => s.id !== "closed_won" && s.id !== "closed_lost"
                ).map((stage) => {
                  const stageDeals = deals.filter((d) => d.stage === stage.id);
                  const stageValue = stageDeals.reduce(
                    (sum, d) => sum + (d.value ? parseFloat(d.value) : 0),
                    0
                  );
                  return (
                    <div key={stage.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={stage.color}>{stage.label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {stageDeals.length} deals
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        ${stageValue.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href="/pipeline">
                <Button variant="ghost" className="w-full mt-4">
                  View Pipeline
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.slice(0, 5).map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {reminder.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(reminder.dueAt), "MMM d, h:mm a")}
                          {reminder.deal && ` • ${reminder.deal.title}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-green-600"
                        onClick={() => handleCompleteReminder(reminder.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/reminders">
                <Button variant="ghost" className="w-full mt-4">
                  View All Tasks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
