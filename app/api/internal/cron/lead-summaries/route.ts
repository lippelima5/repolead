import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { runDailyLeadSummaryCron } from "@/lib/repolead/lead-summary";

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${expected}`;
}

async function handleRequest(request: NextRequest) {
  if (!isAuthorized(request)) {
    return apiError("Unauthorized", 401);
  }

  const result = await runDailyLeadSummaryCron();
  return apiSuccess(result);
}

export async function GET(request: NextRequest) {
  try {
    return await handleRequest(request);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handleRequest(request);
  } catch (error) {
    return onError(error);
  }
}
