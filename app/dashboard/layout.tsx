import { AuthProvider } from "@/contexts/auth-context";
import { requireServerSession } from "@/lib/session.server";

export default async function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  await requireServerSession({ loginRedirectTo: "/dashboard" });

  return (
    <AuthProvider>{children}</AuthProvider>
  );
}


