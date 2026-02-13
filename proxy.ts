import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth-token";

const publicRoutes = new Set([
  "/",
  "/error",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/magic",
  "/api/auth/magic/consume",
  "/api/stripe/webhook",
]);

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  return response;
}

function shouldSkipOriginCheck(pathname: string) {
  return pathname.startsWith("/api/stripe/webhook") || pathname.startsWith("/api/cron") || pathname.startsWith("/api/worker");
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const parsed = new URL(value.trim());
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return null;
  }
}

function getForwardedOrigins(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (!forwardedHost || !forwardedProto) {
    return [];
  }

  const protocol = forwardedProto.split(",")[0]?.trim();
  if (!protocol) {
    return [];
  }

  return forwardedHost
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((host) => `${protocol}://${host}`);
}

function getAllowedOrigins(request: NextRequest) {
  const allowed = new Set<string>();
  const candidates = [
    request.nextUrl.origin,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    ...getForwardedOrigins(request),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeOrigin(candidate);
    if (normalized) {
      allowed.add(normalized);
    }
  }

  return allowed;
}

function hasInvalidOrigin(request: NextRequest) {
  const origin = normalizeOrigin(request.headers.get("origin"));

  if (!origin) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins(request);
  return !allowedOrigins.has(origin);
}

async function verifyAuthenticatedRequest(request: NextRequest, requireAdmin = false) {
  const token = getAuthTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const decoded = await verifyAuthToken(token);

  if (!decoded || decoded.suspended_at) {
    return null;
  }

  if (requireAdmin && decoded.role !== "admin") {
    return null;
  }

  return decoded;
}

async function handleWorkerRoute(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return withSecurityHeaders(
      NextResponse.json(
        { success: false, message: "Unauthorized: Missing or invalid Authorization header to access cron routes" },
        { status: 401 },
      ),
    );
  }

  return withSecurityHeaders(NextResponse.next());
}

async function handleAdminApiRoute(request: NextRequest): Promise<NextResponse> {
  const decoded = await verifyAuthenticatedRequest(request, true);

  if (!decoded) {
    const res = withSecurityHeaders(
      NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
    );
    res.cookies.delete("auth.token");
    res.cookies.delete("auth.user");
    return res;
  }

  const response = withSecurityHeaders(NextResponse.next());
  response.headers.set("user_id", decoded.id.toString());
  response.headers.set("user_email", decoded.email);
  return response;
}

async function handleAdminWebRoute(request: NextRequest): Promise<NextResponse> {
  const decoded = await verifyAuthenticatedRequest(request, true);

  if (!decoded) {
    const res = withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
    res.cookies.delete("auth.token");
    res.cookies.delete("auth.user");
    return res;
  }

  return withSecurityHeaders(NextResponse.next());
}

async function handleApiRoute(request: NextRequest): Promise<NextResponse> {
  const decoded = await verifyAuthenticatedRequest(request);

  if (!decoded) {
    const res = withSecurityHeaders(
      NextResponse.json({ success: false, message: "Unauthorized: Missing authentication token" }, { status: 401 }),
    );
    res.cookies.delete("auth.token");
    res.cookies.delete("auth.user");
    return res;
  }

  const response = withSecurityHeaders(NextResponse.next());
  response.headers.set("user_id", decoded.id.toString());
  response.headers.set("user_email", decoded.email);
  return response;
}

async function handleWebRoute(request: NextRequest): Promise<NextResponse> {
  const decoded = await verifyAuthenticatedRequest(request);

  if (!decoded) {
    const res = withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
    res.cookies.delete("auth.token");
    res.cookies.delete("auth.user");
    return res;
  }

  return withSecurityHeaders(NextResponse.next());
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isWorkspaceInviteGet =
    pathname.startsWith("/api/workspace/invite/") && (request.method === "GET" || request.method === "HEAD");

  if (pathname.startsWith("/api") && mutatingMethods.has(request.method) && !shouldSkipOriginCheck(pathname)) {
    const hasBearer = request.headers.get("authorization")?.startsWith("Bearer ");

    if (!hasBearer && hasInvalidOrigin(request)) {
      return withSecurityHeaders(
        NextResponse.json({ success: false, message: "Invalid request origin" }, { status: 403 }),
      );
    }
  }

  if (publicRoutes.has(pathname) || isWorkspaceInviteGet) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/cron") || pathname.startsWith("/api/worker")) {
    return handleWorkerRoute(request);
  }

  if (pathname.startsWith("/api/admin")) {
    return handleAdminApiRoute(request);
  }

  if (pathname.startsWith("/admin")) {
    return handleAdminWebRoute(request);
  }

  if (pathname.startsWith("/api")) {
    return handleApiRoute(request);
  }

  return handleWebRoute(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/admin", "/admin/:path*"],
};


