import Link from "next/link";

export default function InviteIndexPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-semibold">Invite</h1>
        <p className="text-muted-foreground">Use a valid invite URL to join a workspace.</p>
        <Link href="/" className="underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </main>
  );
}



