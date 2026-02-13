import { role } from "@/prisma/generated/enums";

export function canManageMembers(userRole?: role | null) {
  return userRole === "owner" || userRole === "admin";
}

export function canManageWorkspace(userRole?: role | null) {
  return canManageMembers(userRole);
}

export function canInviteRole(actorRole: role | null | undefined, targetRole: role) {
  if (!canManageMembers(actorRole)) return false;
  if (targetRole === "owner") return false;
  return true;
}

export function canRemoveMember(
  actorRole: role | null | undefined,
  targetRole: role,
  isSelf: boolean,
) {
  if (!canManageMembers(actorRole)) return false;
  if (isSelf) return false;
  if (targetRole === "owner") return false;
  return true;
}
