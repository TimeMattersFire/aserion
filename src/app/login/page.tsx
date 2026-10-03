"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0B0C] px-6 text-white">
      <section className="w-full max-w-md">
        <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-red-500">
          TIME MATTERS FIRE PROTECTION
        </p>

        <h1 className="text-4xl font-semibold">ASERION</h1>

        <p className="mt-2 text-sm text-neutral-500">
          Information Control & Assurance Infrastructure
        </p>

        <div className="my-8 border-t border-neutral-800" />

        <h2 className="text-xl font-semibold">Sign in</h2>

        <p className="mt-2 text-sm text-neutral-500">
          Access the ASERION operational environment.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm text-neutral-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-neutral-400">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-neutral-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-white px-4 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}