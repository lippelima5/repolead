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
  description: z.string().trim().max(400).optional().nullable(),
});

export const workspaceUpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).optional().nullable(),
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



