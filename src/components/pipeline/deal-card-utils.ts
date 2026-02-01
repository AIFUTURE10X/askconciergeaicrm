import { differenceInDays, isToday, isPast, isTomorrow } from "date-fns";
import type { Deal } from "@/lib/db/schema";

export interface DealStatus {
  isStale: boolean;
  isWon: boolean;
  isLost: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  hasFollowUp: boolean;
  daysSinceUpdate: number;
  followUpDate: Date | null;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getDealStatus(deal: Deal & { followUpDate?: Date | string | null }): DealStatus {
  const daysSinceUpdate = differenceInDays(new Date(), new Date(deal.updatedAt));
  const isStale = deal.stage === "proposal" && daysSinceUpdate >= 3;
  const isWon = deal.stage === "closed_won";
  const isLost = deal.stage === "closed_lost";

  const followUpDate = deal.followUpDate ? new Date(deal.followUpDate) : null;
  const isOverdue = !!followUpDate && isPast(followUpDate) && !isToday(followUpDate);
  const isDueToday = !!followUpDate && isToday(followUpDate);
  const isDueTomorrow = !!followUpDate && isTomorrow(followUpDate);
  const hasFollowUp = !!followUpDate && !isWon && !isLost;

  return { isStale, isWon, isLost, isOverdue, isDueToday, isDueTomorrow, hasFollowUp, daysSinceUpdate, followUpDate };
}
