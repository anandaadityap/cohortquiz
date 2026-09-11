"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Email or password did not match the demo tutor account.");
      return;
    }
    router.push(params.get("callbackUrl") || "/app");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="paper-card mx-auto w-full max-w-md space-y-4 p-8">
      <div>
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue="tutor@cohortquiz.demo"
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none ring-moss/30 focus:ring-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          defaultValue="demo1234"
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none ring-moss/30 focus:ring-2"
        />
      </div>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs leading-relaxed text-ink/60">
        Seeded demo: <code>tutor@cohortquiz.demo</code> / <code>demo1234</code>
      </p>
    </form>
  );
}
