import type { Deal, Contact, Reminder } from "@/lib/db/schema";

export type DealWithContact = Deal & { contact: Contact | null };

export type ReminderWithRelations = Reminder & {
  deal: (Deal & { contact: Contact | null }) | null;
  contact: Contact | null;
};

export interface DashboardMetrics {
  activeDeals: DealWithContact[];
  wonDeals: DealWithContact[];
  lostDeals: DealWithContact[];
  totalPipelineValue: number;
  weightedPipelineValue: number;
  wonValue: number;
  winRate: number;
  demoToCloseRate: number;
  demoDeals: DealWithContact[];
  avgDealValue: number;
  lostReasonCounts: Record<string, number>;
}
