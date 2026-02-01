import type { AdminOrganization } from "@/lib/admin/types";

export function ExpansionBadges({ org }: { org: AdminOrganization }) {
  const extraProps = org.extraPropertiesCount || 0;
  const extraUnits = org.extraUnitsCount || 0;
  const hasCrm = org.hasCrmAddon;

  if (!extraProps && !extraUnits && !hasCrm) {
    return <span className="text-xs text-muted-foreground">&mdash;</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {extraProps > 0 && (
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
          +{extraProps} props
        </span>
      )}
      {extraUnits > 0 && (
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          +{extraUnits} units
        </span>
      )}
      {hasCrm && (
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          CRM
        </span>
      )}
    </div>
  );
}
