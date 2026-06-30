"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const redirectTo = `${appUrl}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for the sign-in link.");
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[18px] border border-white/18 bg-[rgba(18,24,62,0.98)] p-10 shadow-2xl backdrop-blur-xl">
        <p className="font-display text-[11px] font-light tracking-[0.25em] text-white/95">
          ELIXIR MD INC
        </p>
        <h1 className="mt-3 font-display text-2xl font-light tracking-wide text-white">
          Daily Task Tracker
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Sign in with your invited email. We&apos;ll send a magic link.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="font-display text-[10px] tracking-widest text-white/50 uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@elixir.com"
              className="glass-input mt-2 w-full rounded-[10px] px-4 py-3 text-sm"
            />
          </div>

          {message && (
            <p className={`text-sm ${status === "error" ? "text-[#FF8F9A]" : "text-[#7DDFAD]"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "sent"}
            className="font-display w-full rounded-[10px] border border-white/35 bg-white/18 py-3 text-xs font-semibold tracking-wider text-white transition hover:bg-white/28 disabled:opacity-50"
          >
            {status === "loading" ? "Sending…" : "Send magic link"}
          </button>
        </form>
      </div>
    </div>
  );
}
