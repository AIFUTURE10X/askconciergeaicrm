"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Mail, Sparkles, Loader2 } from "lucide-react";
import type { Contact } from "@/lib/db/schema";

interface DealContactCardProps {
  contact: Contact;
  onEmailClick: () => void;
  onAIResponseClick?: () => void;
  isGeneratingAI?: boolean;
}

export function DealContactCard({
  contact,
  onEmailClick,
  onAIResponseClick,
  isGeneratingAI,
}: DealContactCardProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">Contact</Label>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{contact.name}</div>
          {contact.company && (
            <div className="text-sm text-muted-foreground truncate">{contact.company}</div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {contact.email && onAIResponseClick && (
            <Button
              variant="default"
              size="sm"
              onClick={onAIResponseClick}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              {isGeneratingAI ? "Generating..." : "AI Response"}
            </Button>
          )}
          {contact.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEmailClick}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
