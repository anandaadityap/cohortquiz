"use client";

import { useActionState } from "react";
import { registerTutor } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(registerTutor, undefined);

  return (
    <form action={action} className="paper-card mx-auto w-full max-w-md space-y-4 p-8">
      <div>
        <label className="text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
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
          minLength={8}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
        />
      </div>
      {state?.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      <SubmitButton className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper disabled:opacity-60">
        Create tutor account
      </SubmitButton>
    </form>
  );
}
