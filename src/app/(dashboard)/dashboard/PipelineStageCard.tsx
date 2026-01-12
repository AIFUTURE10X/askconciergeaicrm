"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import type { DealWithContact } from "./types";

interface PipelineStageCardProps {
  deals: DealWithContact[];
}

export function PipelineStageCard({ deals }: PipelineStageCardProps) {
  return (
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
  );
}
