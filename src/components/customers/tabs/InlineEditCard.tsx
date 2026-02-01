import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface InlineEditCardProps {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  isSaving: boolean;
  placeholder?: string;
  onEditStart: () => void;
  onEditCancel: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function InlineEditCard({
  label,
  value,
  editValue,
  isEditing,
  isSaving,
  placeholder,
  onEditStart,
  onEditCancel,
  onChange,
  onSave,
}: InlineEditCardProps) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{label}</h3>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={onEditStart}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
            placeholder={placeholder}
          />
          <Button size="icon" variant="ghost" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={onEditCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm">{value || "—"}</p>
      )}
    </Card>
  );
}
