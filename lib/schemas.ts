import { z } from "zod";

export const roleSchema = z.enum(["owner", "admin", "user", "viewer"]);
export const workspaceInviteRoleSchema = z.enum(["admin", "user", "viewer"]);

export const loginBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const registerBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(1),
});

export const consumeMagicBodySchema = z.object({
  token: z.string().trim().min(1),
});

export const workspaceCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional().nullable(),
  description: z.string().trim().max(400).optional().nullable(),
  retention_days: z.number().int().min(1).max(3650).optional(),
  idempotency_window_hours: z.number().int().min(1).max(720).optional(),
  daily_lead_summary_enabled: z.boolean().optional().default(true),
});

export const workspaceUpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional().nullable(),
  description: z.string().trim().max(400).optional().nullable(),
  retention_days: z.number().int().min(1).max(3650).optional(),
  idempotency_window_hours: z.number().int().min(1).max(720).optional(),
  daily_lead_summary_enabled: z.boolean().optional(),
});

export const profileUpdateBodySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  password: z.string().min(1).optional(),
  workspace_active_id: z.number().int().positive().nullable().optional(),
  workspace_id: z.number().int().positive().nullable().optional(),
});

export const workspaceInviteCreateBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: workspaceInviteRoleSchema.optional(),
});

export const stripeCheckoutBodySchema = z.object({
  workspace_id: z.number().int().positive(),
  planKey: z.string().trim().min(2).max(60).regex(/^[A-Z0-9_]+$/),
});

export const stripePortalBodySchema = z.object({
  workspace_id: z.number().int().positive(),
});

export const adminUserActionBodySchema = z.object({
  action: z.enum(["suspend", "reactivate"]),
  reason: z.string().trim().max(300).optional().nullable(),
});

const billingPlanBaseSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Z0-9_]+$/),
  stripe_price_id: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^price_[a-zA-Z0-9]+$/),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const adminBillingPlanCreateBodySchema = billingPlanBaseSchema;
export const adminBillingPlanUpdateBodySchema = billingPlanBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field must be provided" },
);

export const workspaceMemberCreateBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: roleSchema.exclude(["owner"]).default("user"),
});

export const workspaceMemberUpdateBodySchema = z.object({
  role: roleSchema.exclude(["owner"]),
});

export const sourceEnvironmentSchema = z.enum(["production", "staging", "development"]);
export const sourceStatusSchema = z.enum(["active", "inactive"]);
export const sourceCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.string().trim().min(2).max(80).optional(),
  integration_id: z.string().trim().min(2).max(80).optional(),
  integration_config_json: z.record(z.string(), z.unknown()).optional().default({}),
  environment: sourceEnvironmentSchema.optional().default("production"),
  rate_limit_per_min: z.number().int().min(1).max(20000).optional().default(60),
  status: sourceStatusSchema.optional().default("active"),
});
export const sourceUpdateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    type: z.string().trim().min(2).max(80).optional(),
    integration_id: z.string().trim().min(2).max(80).optional(),
    integration_config_json: z.record(z.string(), z.unknown()).optional(),
    environment: sourceEnvironmentSchema.optional(),
    rate_limit_per_min: z.number().int().min(1).max(20000).optional(),
    status: sourceStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const sourceKeyCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional().default("Default key"),
});

export const workspaceReadKeyCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional().default("Read API key"),
});

export const destinationMethodSchema = z.enum(["post", "put", "patch"]);
export const destinationCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().url(),
  method: destinationMethodSchema.optional().default("post"),
  integration_id: z.string().trim().min(2).max(80).optional(),
  integration_config_json: z.record(z.string(), z.unknown()).optional().default({}),
  headers_json: z.record(z.string(), z.string()).optional().default({}),
  signing_secret: z.string().trim().min(8).max(200).optional(),
  enabled: z.boolean().optional().default(true),
  subscribed_events_json: z.array(z.string().trim().min(1).max(120)).optional().default([]),
});

export const destinationUpdateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    url: z.string().trim().url().optional(),
    method: destinationMethodSchema.optional(),
    integration_id: z.string().trim().min(2).max(80).optional(),
    integration_config_json: z.record(z.string(), z.unknown()).optional(),
    headers_json: z.record(z.string(), z.string()).optional(),
    enabled: z.boolean().optional(),
    subscribed_events_json: z.array(z.string().trim().min(1).max(120)).optional(),
    signing_secret: z.string().trim().min(8).max(200).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const destinationTestBodySchema = z.object({
  event_type: z.string().trim().min(1).max(120).optional().default("test_event"),
  payload: z.record(z.string(), z.unknown()).optional().default({ test: true }),
});

export const leadStatusSchema = z.enum(["new", "contacted", "qualified", "won", "lost", "needs_identity"]);
export const leadQueryFiltersSchema = z.object({
  query: z.string().trim().max(120).optional(),
  status: leadStatusSchema.optional(),
  source: z.string().trim().min(1).max(120).optional(),
  sourceId: z.string().trim().min(1).max(120).optional(),
  tag: z.string().trim().min(1).max(40).optional(),
});

export const leadExportEmailBodySchema = leadQueryFiltersSchema;

export const leadUpdateBodySchema = z
  .object({
    status: leadStatusSchema.optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  })
  .refine((value) => value.status !== undefined || value.tags !== undefined, {
    message: "At least one field must be provided",
  });

export const deliveryReplayBulkBodySchema = z.object({
  status: z.enum(["pending", "success", "failed", "dead_letter"]).optional(),
  destination_id: z.string().trim().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
});

export const alertRuleTypeSchema = z.enum(["error_spike", "silent_source"]);
export const alertRuleCreateBodySchema = z.object({
  type: alertRuleTypeSchema,
  config_json: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional().default(true),
});

export const alertRuleUpdateBodySchema = z
  .object({
    type: alertRuleTypeSchema.optional(),
    config_json: z.record(z.string(), z.unknown()).optional(),
    enabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });
