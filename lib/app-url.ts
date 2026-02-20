function normalizeBaseUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getAppBaseUrl(originFallback?: string) {
  if (typeof window !== "undefined") {
    return normalizeBaseUrl(window.location.origin) || "http://localhost:3000";
  }

  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(originFallback) ||
    "http://localhost:3000"
  );
}
