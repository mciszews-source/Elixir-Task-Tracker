import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type MagicLinkResult =
  | { ok: true; redirectTo: string }
  | { ok: false; code: string; message: string; status: number };

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resolveAuthCallbackUrl(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}/auth/callback`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/auth/callback`;
  }

  return `${requestUrl.origin}/auth/callback`;
}

export async function findInvitedUserByEmail(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const normalized = normalizeAuthEmail(email);

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (profile) return true;

  // Fallback: scan auth users (small invite-only orgs).
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error("[auth/magic-link] listUsers failed:", error.message);
    return false;
  }

  return (data.users ?? []).some(
    (user) => user.email?.toLowerCase() === normalized,
  );
}

export function logMagicLinkAttempt(payload: {
  email: string;
  redirectTo: string;
  outcome: "sent" | "rejected" | "error";
  code?: string;
  detail?: string;
}) {
  const redacted = payload.email.replace(/(^.).*(@.*$)/, "$1***$2");
  console.info(
    JSON.stringify({
      event: "magic_link_attempt",
      at: new Date().toISOString(),
      email: redacted,
      redirectTo: payload.redirectTo,
      outcome: payload.outcome,
      code: payload.code,
      detail: payload.detail,
    }),
  );
}

export async function sendMagicLink(
  email: string,
  redirectTo: string,
): Promise<MagicLinkResult> {
  const normalized = normalizeAuthEmail(email);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      ok: false,
      code: "supabase_not_configured",
      message:
        "Authentication is not configured. Set Supabase environment variables and redeploy.",
      status: 503,
    };
  }

  const invited = await findInvitedUserByEmail(normalized);
  if (!invited) {
    logMagicLinkAttempt({
      email: normalized,
      redirectTo,
      outcome: "rejected",
      code: "user_not_invited",
      detail: "No auth user or profile for email",
    });
    return {
      ok: false,
      code: "user_not_invited",
      message:
        "No account exists for this email. An admin must invite you first (Team Access → Send invite), then try again.",
      status: 404,
    };
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    const isRateLimit =
      error.message.toLowerCase().includes("rate") ||
      error.status === 429;
    const isRedirect =
      error.message.toLowerCase().includes("redirect") ||
      error.message.toLowerCase().includes("url");

    logMagicLinkAttempt({
      email: normalized,
      redirectTo,
      outcome: "error",
      code: isRateLimit ? "rate_limited" : isRedirect ? "redirect_misconfigured" : "supabase_error",
      detail: error.message,
    });

    if (isRateLimit) {
      return {
        ok: false,
        code: "rate_limited",
        message:
          "Too many sign-in attempts. Wait a few minutes, then try again.",
        status: 429,
      };
    }

    if (isRedirect) {
      return {
        ok: false,
        code: "redirect_misconfigured",
        message: `Redirect URL not allowed in Supabase. Add this exact URL under Authentication → URL Configuration → Redirect URLs: ${redirectTo}`,
        status: 400,
      };
    }

    return {
      ok: false,
      code: "supabase_error",
      message: error.message,
      status: error.status ?? 400,
    };
  }

  logMagicLinkAttempt({
    email: normalized,
    redirectTo,
    outcome: "sent",
  });

  return { ok: true, redirectTo };
}
