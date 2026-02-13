import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="text-muted-foreground">This page is a placeholder for your legal terms.</p>
        <Link href="/" className="underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </main>
  );
}

