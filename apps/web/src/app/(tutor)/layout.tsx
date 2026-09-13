import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      <header className="mb-8 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/dashboard" className="font-serif text-xl">
              CohortQuiz
            </Link>
            <p className="truncate text-sm text-ink/60">{session.user.name}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="shrink-0 rounded-full px-3 py-1.5 text-sm text-ink/70" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <nav className="nav-scroll -mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-0.5 text-sm sm:mx-0 sm:px-0">
          <Link href="/dashboard" className="shrink-0 rounded-full border border-line px-3 py-1.5">
            Workspace
          </Link>
          <Link href="/materials" className="shrink-0 whitespace-nowrap text-ink/70 underline-offset-4 hover:underline">
            Materials
          </Link>
          <Link href="/quizzes" className="shrink-0 whitespace-nowrap text-ink/70 underline-offset-4 hover:underline">
            Quizzes
          </Link>
          <Link href="/tryouts/new" className="shrink-0 whitespace-nowrap rounded-full bg-clay px-3 py-1.5 text-white">
            Create tryout
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
