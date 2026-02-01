import { cn } from "@/lib/utils";
import { TagBadge } from "@/components/contacts/TagBadge";
import type { Tag } from "@/lib/db/schema";

interface TagFilterRowProps {
  tags: Tag[];
  tagFilter: string | null;
  onTagFilter: (id: string | null) => void;
}

export function TagFilterRow({ tags, tagFilter, onTagFilter }: TagFilterRowProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">Tags:</span>
      <button
        type="button"
        onClick={() => onTagFilter(null)}
        className={cn(
          "px-2 py-1 text-xs rounded-md transition-colors",
          tagFilter === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        )}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onTagFilter(tag.id)}
          className={cn(
            "transition-opacity",
            tagFilter === tag.id ? "ring-2 ring-primary ring-offset-2" : ""
          )}
        >
          <TagBadge tag={tag} size="md" />
        </button>
      ))}
    </div>
  );
}
