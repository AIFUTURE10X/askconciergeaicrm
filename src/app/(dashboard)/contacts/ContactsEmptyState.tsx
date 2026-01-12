import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

interface ContactsEmptyStateProps {
  onAddClick: () => void;
}

export function ContactsEmptyState({ onAddClick }: ContactsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No contacts yet</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Add your first contact to start building your sales pipeline
        </p>
        <Button className="mt-4" onClick={onAddClick}>
          Add Contact
        </Button>
      </CardContent>
    </Card>
  );
}
