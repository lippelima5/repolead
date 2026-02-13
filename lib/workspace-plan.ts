import { plan_status, workspace } from "@/prisma/generated/client";
import { CustomError } from "@/lib/errors";

const ACTIVE_STATUSES = new Set<plan_status>(["active", "trialing"]);

export function isWorkspacePlanActive(status?: plan_status | null) {
  if (!status) return false;
  return ACTIVE_STATUSES.has(status);
}

export function hasWorkspacePaidPlan(
  data?: Pick<workspace, "plan_status" | "stripe_subscription_id"> | null,
) {
  if (!data) return false;
  return data.plan_status === "active" && Boolean(data.stripe_subscription_id);
}

export function ensureWorkspaceHasPaidPlan(
  data?: Pick<workspace, "plan_status" | "stripe_subscription_id"> | null,
) {
  if (!hasWorkspacePaidPlan(data)) {
    throw new CustomError("Active paid plan required", 402);
  }
}
