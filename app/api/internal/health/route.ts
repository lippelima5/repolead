import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return apiSuccess({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return onError(error);
  }
}
