"use client";

import { Suspense, useState } from "react";
import Link from "next/link";

function InstantLoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/instant-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }),
      });

      const payload = (await res.json()) as {
        ok?: boolean;
        actionLink?: string;
        error?: string;
        code?: string;
      };

      if (!res.ok || !payload.actionLink) {
        setStatus("error");
        setMessage(payload.error ?? "Could not create sign-in link.");
        return;
      }

      window.location.href = payload.actionLink;
    } catch {
      setStatus("error");
      setMessage("Request failed. Try again.");
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[18px] border border-white/18 bg-[rgba(18,24,62,0.98)] p-10 shadow-2xl backdrop-blur-xl">
        <p className="font-display text-[11px] font-light tracking-[0.25em] text-white/95">
          ELIXIR MD INC
        </p>
        <h1 className="mt-3 font-display text-2xl font-light tracking-wide text-white">
          Instant sign-in
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Skip email. Uses a one-time link generated on the server (bootstrap
          access for setup).
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="font-display text-[10px] tracking-widest text-white/50 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourgmail@gmail.com"
              className="glass-input mt-2 w-full rounded-[10px] px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="font-display text-[10px] tracking-widest text-white/50 uppercase"
            >
              Bootstrap code
            </label>
            <input
              id="code"
              type="password"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="From GitHub secret AUTH_BOOTSTRAP_SECRET"
              className="glass-input mt-2 w-full rounded-[10px] px-4 py-3 text-sm"
            />
          </div>

          {message && (
            <p className="rounded-[10px] border border-[#FF8F9A]/40 bg-[#FF8F9A]/10 px-4 py-3 text-sm text-[#FF8F9A]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="font-display w-full rounded-[10px] border border-white/35 bg-white/18 py-3 text-xs font-semibold tracking-wider text-white transition hover:bg-white/28 disabled:opacity-50"
          >
            {status === "loading" ? "Creating link…" : "Sign in now"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          <Link href="/login" className="underline-offset-2 hover:underline">
            Back to email magic link
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function InstantLoginPage() {
  return (
    <Suspense fallback={null}>
      <InstantLoginForm />
    </Suspense>
  );
}
