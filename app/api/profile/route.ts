import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { onError, sanitizeUser, verifyUser } from "@/lib/helper";
import { apiError, apiSuccess } from "@/lib/api-response";
import { setAuthUserCookie } from "@/lib/auth-cookies";
import { validatePasswordPolicy } from "@/lib/password";
import { parseJsonBody } from "@/lib/validation";
import { profileUpdateBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { user } = await verifyUser(request);

    await setAuthUserCookie(sanitizeUser(user));

    return apiSuccess(sanitizeUser(user));
  } catch (error) {
    return onError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await verifyUser(request);

    const { name, password, workspace_active_id, workspace_id } = await parseJsonBody(request, profileUpdateBodySchema,);
    // const normalizedEmail = email || undefined;
    const nextWorkspaceActiveId = workspace_active_id ?? workspace_id;

    let workspaceActiveData: { workspace_active_id?: number | null } = {};
    if (nextWorkspaceActiveId !== undefined) {
      if (nextWorkspaceActiveId === null) {
        workspaceActiveData = { workspace_active_id: null };
      } else {
        const parsedWorkspaceId = Number(nextWorkspaceActiveId);
        if (!Number.isInteger(parsedWorkspaceId) || parsedWorkspaceId <= 0) {
          return apiError("Invalid workspace id", 400);
        }

        const membership = await prisma.workspace_user.findUnique({
          where: {
            workspace_id_user_id: {
              workspace_id: parsedWorkspaceId,
              user_id: user.id,
            },
          },
        });

        if (!membership) {
          return apiError("User is not a member of this workspace", 403);
        }

        workspaceActiveData = { workspace_active_id: parsedWorkspaceId };
      }
    }

    if (password) {
      const passwordError = validatePasswordPolicy(password);
      if (passwordError) {
        return apiError(passwordError, 400);
      }
    }

    // if (normalizedEmail && user.email !== normalizedEmail && (await prisma.user.findUnique({ where: { email: normalizedEmail } }))) {
    //   return apiError("Email already exists", 409);
    // }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        ...(name ? { name } : {}),
        // ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...workspaceActiveData,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });

    await setAuthUserCookie(sanitizeUser(updatedUser));

    return apiSuccess(sanitizeUser(updatedUser));
  } catch (error) {
    return onError(error);
  }
}


