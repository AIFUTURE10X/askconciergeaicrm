"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, Trash2 } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/constants/pipeline";
import { TagBadge } from "@/components/contacts/TagBadge";
import { cn } from "@/lib/utils";
import type { Contact, Deal, Tag } from "@/lib/db/schema";

type ContactWithDeals = Contact & { deals: Deal[] };

interface ContactCardProps {
  contact: ContactWithDeals;
  tags?: Tag[];
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
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

export function ContactCard({
  contact,
  tags = [],
  isSelected = false,
  onSelectChange,
  onDelete,
}: ContactCardProps) {
  // Get tags for this contact
  const contactTagIds = (contact.tags as string[]) || [];
  const contactTags = (tags || []).filter((t) => contactTagIds.includes(t.id));

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectChange?.(!isSelected);
  };

  return (
    <Link href={`/contacts/${contact.id}`}>
      <Card
        className={cn(
          "hover:bg-muted/50 transition-colors cursor-pointer h-full",
          isSelected && "ring-2 ring-primary bg-primary/5"
        )}
      >
        <CardContent className="p-2">
          {/* Header: Checkbox + Avatar + Name + Delete */}
          <div className="flex items-center gap-2 mb-1.5">
            {onSelectChange && (
              <div onClick={handleCheckboxClick} className="flex-shrink-0">
                <Checkbox checked={isSelected} />
              </div>
            )}
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium truncate flex-1">{contact.name}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => onDelete(contact.id, e)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Company */}
          {contact.company && (
            <p className="text-[10px] text-muted-foreground truncate mb-1">
              {contact.title && `${contact.title} · `}
              {contact.company}
            </p>
          )}

          {/* Contact Info */}
          <div className="space-y-0.5 mb-1.5">
            {contact.email && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Mail className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">{contact.phone}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {contactTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {contactTags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {contactTags.length > 3 && (
                <span className="text-[9px] text-muted-foreground">
                  +{contactTags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer: Badge + Deal count */}
          <div className="flex items-center justify-between">
            {contact.propertyType ? (
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                {PROPERTY_TYPES.find((t) => t.id === contact.propertyType)?.label ||
                  contact.propertyType}
              </Badge>
            ) : (
              <span />
            )}
            {contact.deals.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {contact.deals.length} deal{contact.deals.length !== 1 && "s"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
