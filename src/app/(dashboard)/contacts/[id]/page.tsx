"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityLogDialog } from "@/components/activities/ActivityLogDialog";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { EmailComposeDialog } from "@/components/email/EmailComposeDialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { ContactInfoCard } from "./ContactInfoCard";
import { DealSummaryCard } from "./DealSummaryCard";
import { ContactDealsCard } from "./ContactDealsCard";
import type { Contact, Deal, Activity, Reminder } from "@/lib/db/schema";

type ContactWithRelations = Contact & {
  deals: Deal[];
  activities: Activity[];
  reminders: Reminder[];
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<ContactWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (res.ok) {
        const { contact: data } = await res.json();
        setContact(data);
      } else {
        toast.error("Contact not found");
        router.push("/contacts");
      }
    } catch (error) {
      console.error("Error fetching contact:", error);
      toast.error("Failed to load contact");
    } finally {
      setIsLoading(false);
    }
  }, [contactId, router]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const handleLogActivity = async (data: {
    type: string;
    subject?: string;
    description?: string;
    outcome?: string;
  }) => {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, contactId }),
    });

    if (!res.ok) throw new Error("Failed to log activity");

    const { activity } = await res.json();
    setContact((prev) =>
      prev ? { ...prev, activities: [activity, ...prev.activities] } : null
    );
    toast.success("Activity logged");
  };

  const handleEmailSent = async (data: {
    type: string;
    subject?: string;
    description?: string;
  }) => {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, contactId, outcome: "completed" }),
    });

    if (!res.ok) throw new Error("Failed to log email activity");

    const { activity } = await res.json();
    setContact((prev) =>
      prev ? { ...prev, activities: [activity, ...prev.activities] } : null
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact) return null;

  return (
    <>
      <Header title={contact.name} description={contact.company || undefined} />

      <div className="p-6 space-y-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/contacts">
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <ContactInfoCard
              contact={contact}
              onEmailClick={() => setIsEmailDialogOpen(true)}
              onLogActivity={() => setIsActivityDialogOpen(true)}
            />
            <DealSummaryCard deals={contact.deals} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <ContactDealsCard deals={contact.deals} contactId={contactId} />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Activity Timeline</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsActivityDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Log Activity
                </Button>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={contact.activities} showDealLink />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ActivityLogDialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
        contactId={contactId}
        onSubmit={handleLogActivity}
      />

      {contact.email && (
        <EmailComposeDialog
          open={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
          recipientEmail={contact.email}
          recipientName={contact.name}
          contactId={contactId}
          onEmailSent={handleEmailSent}
        />
      )}
    </>
  );
}
