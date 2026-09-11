import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Link href="/app" className="font-serif text-xl">
            CohortQuiz
          </Link>
          <p className="text-sm text-ink/60">{session.user.name}</p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/app" className="rounded-full border border-line px-3 py-1.5">
            Workspace
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="rounded-full px-3 py-1.5 text-ink/70" type="submit">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
