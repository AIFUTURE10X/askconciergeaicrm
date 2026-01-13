"use client";

import { useState } from "react";
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
  Pencil,
} from "lucide-react";
import { PROPERTY_TYPES, SOURCES } from "@/lib/constants/pipeline";
import { EditContactDialog } from "./EditContactDialog";
import type { Contact } from "@/lib/db/schema";

interface ContactInfoCardProps {
  contact: Contact;
  onEmailClick: () => void;
  onLogActivity: () => void;
  onContactUpdate?: (updatedContact: Contact) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ContactInfoCard({
  contact,
  onEmailClick,
  onLogActivity,
  onContactUpdate,
}: ContactInfoCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const propertyType = PROPERTY_TYPES.find((t) => t.id === contact.propertyType);
  const source = SOURCES.find((s) => s.id === contact.source);

  const handleSave = (updatedContact: Contact) => {
    if (onContactUpdate) {
      onContactUpdate(updatedContact);
    }
  };

  return (
    <>
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="text-sm bg-primary/10 text-primary">
              {getInitials(contact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{contact.name}</h2>
            {contact.title && contact.company && (
              <p className="text-xs text-muted-foreground truncate">
                {contact.title} at {contact.company}
              </p>
            )}
            {propertyType && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5">
                {propertyType.label}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Separator className="my-2" />

        {/* Contact Details */}
        <div className="space-y-1.5">
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <a href={`mailto:${contact.email}`} className="text-xs hover:underline truncate">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <a href={`tel:${contact.phone}`} className="text-xs hover:underline">
                {contact.phone}
              </a>
            </div>
          )}
          {contact.linkedinUrl && (
            <div className="flex items-center gap-2">
              <Linkedin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline flex items-center gap-1"
              >
                LinkedIn
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
          {contact.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline flex items-center gap-1"
              >
                Website
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
          {source && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Source: {source.label}</span>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-1.5">
          {contact.email && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEmailClick}>
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
          )}
          {contact.phone && (
            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
              <a href={`tel:${contact.phone}`}>
                <Phone className="h-3 w-3 mr-1" />
                Call
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onLogActivity}>
            <Plus className="h-3 w-3 mr-1" />
            Log
          </Button>
        </div>

        {/* Notes */}
        {contact.notes && (
          <>
            <Separator className="my-2" />
            <div>
              <h4 className="text-xs font-medium mb-1">Notes</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                {contact.notes}
              </p>
            </div>
          </>
        )}

        {/* Metadata */}
        <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground flex gap-3">
          <span>Created: {format(new Date(contact.createdAt), "MMM d, yyyy")}</span>
          <span>Updated: {format(new Date(contact.updatedAt), "MMM d, yyyy")}</span>
        </div>
      </CardContent>
    </Card>

    <EditContactDialog
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
      contact={contact}
      onSave={handleSave}
    />
    </>
  );
}
