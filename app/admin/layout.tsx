import { AuthProvider } from "@/contexts/auth-context";
import { requireServerSession } from "@/lib/session.server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireServerSession({ requireAdmin: true, loginRedirectTo: "/admin" });

  return <AuthProvider>{children}</AuthProvider>;
}


