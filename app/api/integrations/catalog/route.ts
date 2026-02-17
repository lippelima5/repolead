import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { integrationsCatalog } from "@/content/integrations-catalog";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest) {
  try {
    await requireWorkspace(request);
    return apiSuccess(integrationsCatalog);
  } catch (error) {
    return onError(error);
  }
}
