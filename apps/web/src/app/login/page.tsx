import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center font-serif text-2xl">
        CohortQuiz
      </Link>
      <h1 className="mb-2 text-center font-serif text-3xl">Sign in</h1>
      <p className="mb-8 text-center text-ink/70">Open your workspace to create this week’s tryout.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink/60">
        New tutor?{" "}
        <Link className="underline" href="/register">
          Create an account
        </Link>
      </p>
    </main>
  );
}
