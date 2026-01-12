"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Linkedin, Trash2, ChevronRight } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/constants/pipeline";
import type { Contact, Deal } from "@/lib/db/schema";

type ContactWithDeals = Contact & { deals: Deal[] };

interface ContactCardProps {
  contact: ContactWithDeals;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ContactCard({ contact, onDelete }: ContactCardProps) {
  return (
    <Link href={`/contacts/${contact.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{contact.name}</h3>
              {contact.company && (
                <p className="text-sm text-muted-foreground truncate">
                  {contact.title && `${contact.title} at `}
                  {contact.company}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => onDelete(contact.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.linkedinUrl && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Linkedin className="h-3.5 w-3.5" />
                <span>LinkedIn</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              {contact.propertyType && (
                <Badge variant="secondary" className="text-xs">
                  {PROPERTY_TYPES.find((t) => t.id === contact.propertyType)?.label ||
                    contact.propertyType}
                </Badge>
              )}
            </div>
            {contact.deals.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {contact.deals.length} deal{contact.deals.length !== 1 && "s"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
