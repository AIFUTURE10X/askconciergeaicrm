"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Plus,
  ExternalLink,
} from "lucide-react";
import { PROPERTY_TYPES, SOURCES } from "@/lib/constants/pipeline";
import type { Contact } from "@/lib/db/schema";

interface ContactInfoCardProps {
  contact: Contact;
  onEmailClick: () => void;
  onLogActivity: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ContactInfoCard({ contact, onEmailClick, onLogActivity }: ContactInfoCardProps) {
  const propertyType = PROPERTY_TYPES.find((t) => t.id === contact.propertyType);
  const source = SOURCES.find((s) => s.id === contact.source);

  return (
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
              <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
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
              <span className="text-sm text-muted-foreground">Source: {source.label}</span>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {contact.email && (
            <Button variant="outline" size="sm" onClick={onEmailClick}>
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
          <Button variant="outline" size="sm" className="col-span-2" onClick={onLogActivity}>
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
          <div>Created: {format(new Date(contact.createdAt), "MMM d, yyyy")}</div>
          <div>Updated: {format(new Date(contact.updatedAt), "MMM d, yyyy")}</div>
        </div>
      </CardContent>
    </Card>
  );
}
