"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminOrgMember } from "@/lib/admin/types";

interface Props {
  members: AdminOrgMember[];
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export function CustomerMembersTab({ members }: Props) {
  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <Card key={member.id} className="p-4 flex items-center gap-4">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {member.user.image ? (
              <img
                src={member.user.image}
                alt={member.user.name || ""}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium">
                {(member.user.name || member.user.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {member.user.name || "—"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {member.user.email}
            </p>
            {member.jobTitle && (
              <p className="text-xs text-muted-foreground">{member.jobTitle}</p>
            )}
          </div>

          {/* Role badge */}
          <Badge
            variant="secondary"
            className={cn("text-xs capitalize", ROLE_COLORS[member.role] || ROLE_COLORS.member)}
          >
            {member.role}
          </Badge>
        </Card>
      ))}
    </div>
  );
}
