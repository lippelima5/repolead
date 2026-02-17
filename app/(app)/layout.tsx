import { requireServerSession } from "@/lib/session.server";
import { AppProviders } from "@/components/app-providers";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  await requireServerSession({ loginRedirectTo: "/dashboard" });

  return <AppProviders>{children}</AppProviders>;
}
