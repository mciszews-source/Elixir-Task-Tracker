"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(
        error.message.includes("Signups not allowed")
          ? "This email is not invited yet. Ask Marek or Ivan for access."
          : error.message,
      );
      return;
    }

    setStatus("sent");
    setMessage("Check your email for the sign-in link.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Elixir
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">
          Invite-only access. We will email you a magic link.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@elixir.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                status === "error" ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "sent"}
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {status === "loading" ? "Sending..." : "Send magic link"}
          </button>
        </form>
      </div>
    </div>
  );
}
