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

export async function findInvitedUserByEmail(
  email: string,
): Promise<{ invited: boolean; adminError?: string }> {
  const normalized = normalizeAuthEmail(email);

  try {
    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();

    if (profile) return { invited: true };

    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) {
      const message = formatAuthErrorMessage(error, "Could not verify invited users.");
      console.error("[auth/magic-link] listUsers failed:", message);
      return { invited: false, adminError: message };
    }

    const invited = (data.users ?? []).some(
      (user) => user.email?.toLowerCase() === normalized,
    );
    return { invited };
  } catch (err) {
    const message = formatAuthErrorMessage(
      err,
      "Server cannot verify invited users. Ensure SUPABASE_SERVICE_ROLE_KEY is set in Cloudflare secrets.",
    );
    console.error("[auth/magic-link] admin client failed:", message);
    return { invited: false, adminError: message };
  }
}

export function formatAuthErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error || fallback;

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = record.message;
    if (typeof message === "string" && message.trim()) return message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (typeof record.error_description === "string" && record.error_description.trim()) {
      return record.error_description;
    }
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") return serialized;
  }

  return fallback;
}

export function classifySupabaseAuthError(error: {
  message?: string;
  status?: number;
  code?: string;
}): { code: string; message: string; status: number } {
  const raw = formatAuthErrorMessage(error, "Authentication request failed.");
  const lower = raw.toLowerCase();
  const status = error.status ?? 400;

  if (lower.includes("rate") || status === 429) {
    return {
      code: "rate_limited",
      message: "Too many sign-in attempts. Wait a few minutes, then try again.",
      status: 429,
    };
  }

  if (lower.includes("redirect") || lower.includes("url")) {
    return {
      code: "redirect_misconfigured",
      message: raw,
      status: 400,
    };
  }

  const isSmtp =
    lower.includes("smtp") ||
    lower.includes("sending") ||
    lower.includes("mail") ||
    lower.includes("email") ||
    error.code === "unexpected_failure";

  if (isSmtp) {
    return {
      code: "smtp_error",
      message:
        raw === "Authentication request failed." || raw === "{}"
          ? "Supabase could not send email via SMTP. In Supabase → Auth → SMTP: confirm Enable custom SMTP is on, Host smtp.sendgrid.net, Port 587, Username apikey, Password = SendGrid API key, and Sender email exactly matches your verified SendGrid single sender."
          : `${raw} — Check Supabase → Auth → SMTP and SendGrid single sender verification.`,
      status: 502,
    };
  }

  return {
    code: "supabase_error",
    message: raw === "{}" ? "Supabase rejected the sign-in request. Check Auth logs in the Supabase dashboard." : raw,
    status,
  };
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

  const inviteCheck = await findInvitedUserByEmail(normalized);
  if (inviteCheck.adminError) {
    logMagicLinkAttempt({
      email: normalized,
      redirectTo,
      outcome: "error",
      code: "admin_misconfigured",
      detail: inviteCheck.adminError,
    });
    return {
      ok: false,
      code: "admin_misconfigured",
      message: inviteCheck.adminError,
      status: 503,
    };
  }

  if (!inviteCheck.invited) {
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
    const classified = classifySupabaseAuthError(error);

    logMagicLinkAttempt({
      email: normalized,
      redirectTo,
      outcome: "error",
      code: classified.code,
      detail: classified.message,
    });

    if (classified.code === "redirect_misconfigured") {
      return {
        ok: false,
        code: "redirect_misconfigured",
        message: `Redirect URL not allowed in Supabase. Add this exact URL under Authentication → URL Configuration → Redirect URLs: ${redirectTo}`,
        status: 400,
      };
    }

    return {
      ok: false,
      code: classified.code,
      message: classified.message,
      status: classified.status,
    };
  }

  logMagicLinkAttempt({
    email: normalized,
    redirectTo,
    outcome: "sent",
  });

  return { ok: true, redirectTo };
}
