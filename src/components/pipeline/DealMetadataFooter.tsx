import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import type { Deal } from "@/lib/db/schema";

interface DealMetadataFooterProps {
  deal: Deal;
  isDeleting: boolean;
  onDelete: () => void;
}

export function DealMetadataFooter({ deal, isDeleting, onDelete }: DealMetadataFooterProps) {
  return (
    <>
      <div className="text-xs text-muted-foreground space-y-1 pb-2">
        <div>Created: {format(new Date(deal.createdAt), "MMM d, yyyy h:mm a")}</div>
        <div>Updated: {format(new Date(deal.updatedAt), "MMM d, yyyy h:mm a")}</div>
        {deal.closedAt && (
          <div>Closed: {format(new Date(deal.closedAt), "MMM d, yyyy h:mm a")}</div>
        )}
      </div>

      <Button
        variant="ghost"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        Delete Deal
      </Button>
    </>
  );
}
