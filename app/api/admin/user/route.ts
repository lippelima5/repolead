import { NextRequest } from "next/server";
import { onError, verifyUser } from "@/lib/helper";
import { apiSuccess } from "@/lib/api-response";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    await verifyUser(request, true);

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();
    const limitParam = Number(searchParams.get("limit") || DEFAULT_LIMIT);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, MAX_LIMIT)) : DEFAULT_LIMIT;

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        verified_at: true,
        suspended_at: true,
        suspended_reason: true,
        workspace_active_id: true,
        created_at: true,
        updated_at: true,
        workspaces: {
          select: {
            role: true,
            workspace_id: true,
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    const uniqueEmails = [...new Set(users.map((item) => item.email.toLowerCase()))];

    const pendingInvitesByEmail = uniqueEmails.length
      ? await prisma.workspace_invite.groupBy({
          by: ["email"],
          where: {
            status: "pending",
            expires_at: {
              gt: new Date(),
            },
            email: {
              in: uniqueEmails,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

    const pendingInviteMap = new Map<string, number>(
      pendingInvitesByEmail.map((item) => [item.email.toLowerCase(), item._count._all]),
    );

    return apiSuccess(
      users.map((item) => ({
        ...item,
        memberships_count: item.workspaces.length,
        pending_invites_count: pendingInviteMap.get(item.email.toLowerCase()) ?? 0,
      })),
    );
  } catch (error) {
    return onError(error);
  }
}


