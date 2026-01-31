"use client";

import { getHealthCategoryInfo } from "@/lib/admin/health-constants";

interface Props {
  score: number;
  size?: number;
}

export function HealthScoreRing({ score, size = 120 }: Props) {
  const info = getHealthCategoryInfo(score);
  const strokeWidth = size > 100 ? 10 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  // Map category to stroke color
  const strokeColor =
    score >= 70
      ? "stroke-green-500"
      : score >= 40
      ? "stroke-amber-500"
      : "stroke-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={strokeColor}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-[10px] text-muted-foreground">{info.label}</span>
      </div>
    </div>
  );
}
