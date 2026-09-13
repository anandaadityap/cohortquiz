import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center font-serif text-2xl">
        CohortQuiz
      </Link>
      <h1 className="mb-2 text-center font-serif text-3xl">Create a tutor account</h1>
      <p className="mb-8 text-center text-ink/70">Email and password. Students will use a tryout link, not an account.</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-ink/60">
        Already registered?{" "}
        <Link className="underline" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
