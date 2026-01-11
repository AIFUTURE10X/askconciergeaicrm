"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ActivityLogDialog } from "@/components/activities/ActivityLogDialog";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { EmailComposeDialog } from "@/components/email/EmailComposeDialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Globe,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Edit,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { PROPERTY_TYPES, SOURCES, getStage, getTier } from "@/lib/constants/pipeline";
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
      body: JSON.stringify({
        ...data,
        contactId,
      }),
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
      body: JSON.stringify({
        ...data,
        contactId,
        outcome: "completed",
      }),
    });

    if (!res.ok) throw new Error("Failed to log email activity");

    const { activity } = await res.json();
    setContact((prev) =>
      prev ? { ...prev, activities: [activity, ...prev.activities] } : null
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact) return null;

  const propertyType = PROPERTY_TYPES.find((t) => t.id === contact.propertyType);
  const source = SOURCES.find((s) => s.id === contact.source);

  // Calculate deal stats
  const activeDeals = contact.deals.filter(
    (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
  );
  const wonDeals = contact.deals.filter((d) => d.stage === "closed_won");
  const totalDealValue = contact.deals.reduce(
    (sum, d) => sum + (d.value ? parseFloat(d.value) : 0),
    0
  );

  return (
    <>
      <Header
        title={contact.name}
        description={contact.company || undefined}
      />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/contacts">
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-xl font-semibold">{contact.name}</h2>
                  {contact.title && contact.company && (
                    <p className="text-muted-foreground">
                      {contact.title} at {contact.company}
                    </p>
                  )}
                  {propertyType && (
                    <Badge variant="secondary" className="mt-2">
                      {propertyType.label}
                    </Badge>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Contact Details */}
                <div className="space-y-4">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm hover:underline"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.linkedinUrl && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline flex items-center gap-1"
                      >
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline flex items-center gap-1"
                      >
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {source && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Source: {source.label}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {contact.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEmailDialogOpen(true)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                  )}
                  {contact.phone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${contact.phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-2"
                    onClick={() => setIsActivityDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Log Activity
                  </Button>
                </div>

                {/* Notes */}
                {contact.notes && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {contact.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Metadata */}
                <div className="mt-6 pt-4 border-t text-xs text-muted-foreground space-y-1">
                  <div>
                    Created: {format(new Date(contact.createdAt), "MMM d, yyyy")}
                  </div>
                  <div>
                    Updated: {format(new Date(contact.updatedAt), "MMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Deal Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {contact.deals.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Deals</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{activeDeals.length}</div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{wonDeals.length}</div>
                    <p className="text-xs text-muted-foreground">Won</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold flex items-center">
                      <DollarSign className="h-5 w-5" />
                      {totalDealValue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Deals & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Deals</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/pipeline?contactId=${contactId}`}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Deal
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {contact.deals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No deals yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contact.deals.map((deal) => {
                      const stage = getStage(deal.stage);
                      const tier = deal.tier ? getTier(deal.tier) : null;
                      return (
                        <div
                          key={deal.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {deal.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {stage && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${stage.color}`}
                                >
                                  {stage.label}
                                </Badge>
                              )}
                              {tier && (
                                <span className="text-xs text-muted-foreground">
                                  {tier.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {deal.value && (
                              <div className="font-medium">
                                ${parseFloat(deal.value).toLocaleString()}
                              </div>
                            )}
                            {deal.expectedCloseDate && (
                              <div className="text-xs text-muted-foreground">
                                Close:{" "}
                                {format(
                                  new Date(deal.expectedCloseDate),
                                  "MMM d"
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
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
                <ActivityTimeline
                  activities={contact.activities}
                  showDealLink
                />
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
