import Link from "next/link";

export default function BlogPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-semibold">Blog</h1>
        <p className="text-muted-foreground">Public updates and articles will be published here.</p>
        <Link href="/" className="underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </main>
  );
}

