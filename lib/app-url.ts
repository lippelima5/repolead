export function getAppBaseUrl(originFallback?: string) {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    originFallback ||
    "http://localhost:3000"
  );
}