"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AUTH_DELIVERY_ADMIN_NOTE } from "@/lib/auth/constants";

type Status = "idle" | "loading" | "sent" | "error";

function displayApiError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    const serialized = JSON.stringify(error, null, 2);
    if (serialized && serialized !== "{}") return serialized;
  }
  return fallback;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(
    callbackError === "auth" ? "error" : "idle",
  );
  const [message, setMessage] = useState(
    callbackError === "auth"
      ? "Sign-in link expired or invalid. Request a new magic link."
      : "",
  );
  const [errorCode, setErrorCode] = useState<string | null>(
    callbackError === "auth" ? "callback_failed" : null,
  );
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setErrorCode(null);
    setAdminNote(null);
    setRedirectTo(null);

    const normalizedEmail = email.trim().toLowerCase();
    console.info("[login] magic link request", { email: normalizedEmail });

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: unknown;
        code?: string;
        adminNote?: string;
        redirectTo?: string;
      };

      if (payload.redirectTo) {
        setRedirectTo(payload.redirectTo);
      }

      if (!res.ok) {
        console.error("[login] magic link failed", {
          status: res.status,
          code: payload.code,
          error: payload.error,
          redirectTo: payload.redirectTo,
        });
        setStatus("error");
        setMessage(
          displayApiError(payload.error, "Could not send magic link."),
        );
        setErrorCode(payload.code ?? "unknown");
        setAdminNote(
          payload.adminNote ??
            (payload.code === "smtp_error" || payload.code === "supabase_error"
              ? AUTH_DELIVERY_ADMIN_NOTE
              : null),
        );
        return;
      }

      console.info("[login] magic link accepted by Supabase", {
        redirectTo: payload.redirectTo,
      });
      setStatus("sent");
      setMessage(payload.message ?? "Check your email for the sign-in link.");
      setAdminNote(payload.adminNote ?? null);
    } catch (err) {
      console.error("[login] magic link network error", err);
      setStatus("error");
      setMessage("Network error. Check your connection and try again.");
      setErrorCode("network_error");
      setAdminNote(AUTH_DELIVERY_ADMIN_NOTE);
    }
  }

  const showAdminNote =
    adminNote && (status === "error" || status === "sent");

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
          Sign in with your <strong className="text-white/70">invited</strong>{" "}
          email. We&apos;ll send a magic link.
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

          {message && (
            <div
              role="alert"
              className={`rounded-[10px] border px-4 py-3 text-sm ${
                status === "error"
                  ? "border-[#FF8F9A]/40 bg-[#FF8F9A]/10 text-[#FF8F9A]"
                  : "border-[#7DDFAD]/40 bg-[#7DDFAD]/10 text-[#7DDFAD]"
              }`}
            >
              <p>{message}</p>
              {errorCode && status === "error" && (
                <p className="mt-1 text-xs opacity-80">Code: {errorCode}</p>
              )}
            </div>
          )}

          {showAdminNote && (
            <p className="rounded-[10px] border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-white/50">
              <span className="font-semibold text-white/70">Admin note: </span>
              {adminNote}
            </p>
          )}

          {redirectTo && status === "error" && errorCode === "redirect_misconfigured" && (
            <p className="text-xs break-all text-white/40">
              Required redirect: {redirectTo}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "sent"}
            className="font-display w-full rounded-[10px] border border-white/35 bg-white/18 py-3 text-xs font-semibold tracking-wider text-white transition hover:bg-white/28 disabled:opacity-50"
          >
            {status === "loading" ? "Sending…" : "Send magic link"}
          </button>

          {status === "sent" && (
            <button
              type="button"
              className="w-full text-xs text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
              onClick={() => {
                setStatus("idle");
                setMessage("");
                setAdminNote(null);
              }}
            >
              Didn&apos;t get it? Try again
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
