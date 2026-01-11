"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  recipientName: string;
  contactId?: string;
  dealId?: string;
  onEmailSent?: (data: {
    type: string;
    subject?: string;
    description?: string;
  }) => Promise<void>;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  recipientEmail,
  recipientName,
  contactId,
  dealId,
  onEmailSent,
}: EmailComposeDialogProps) {
  const [isLogging, setIsLogging] = useState(false);
  const [logActivity, setLogActivity] = useState(true);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
  });

  const handleSendEmail = async () => {
    // Build mailto URL
    const mailtoUrl = buildMailtoUrl(
      recipientEmail,
      formData.subject,
      formData.body
    );

    // Open email client
    window.open(mailtoUrl, "_blank");

    // Log activity if checkbox is checked
    if (logActivity && onEmailSent) {
      setIsLogging(true);
      try {
        await onEmailSent({
          type: "email",
          subject: formData.subject || `Email to ${recipientName}`,
          description: formData.body || undefined,
        });
        toast.success("Email opened and activity logged");
      } catch (error) {
        toast.error("Failed to log email activity");
      } finally {
        setIsLogging(false);
      }
    } else {
      toast.success("Email client opened");
    }

    // Reset and close
    setFormData({ subject: "", body: "" });
    onOpenChange(false);
  };

  const handleQuickSend = () => {
    // Just open mailto without logging
    const mailtoUrl = buildMailtoUrl(recipientEmail, "", "");
    window.open(mailtoUrl, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {recipientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient (read-only) */}
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              value={`${recipientName} <${recipientEmail}>`}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject..."
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Compose your message..."
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              rows={6}
            />
          </div>

          {/* Log activity checkbox */}
          {onEmailSent && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="logActivity"
                checked={logActivity}
                onCheckedChange={(checked) => setLogActivity(checked === true)}
              />
              <Label
                htmlFor="logActivity"
                className="text-sm font-normal cursor-pointer"
              >
                Log this email as an activity
              </Label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleQuickSend}
              className="text-muted-foreground"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Quick Send (no logging)
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isLogging}
              >
                {isLogging && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Mail className="mr-2 h-4 w-4" />
                Open Email Client
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildMailtoUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  if (subject) params.append("subject", subject);
  if (body) params.append("body", body);

  const queryString = params.toString();
  return `mailto:${encodeURIComponent(to)}${queryString ? `?${queryString}` : ""}`;
}
