import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeAuthEmail, resolveAuthCallbackUrl } from "@/lib/auth/magic-link";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(8),
});

function bootstrapEnabled(): boolean {
  return Boolean(process.env.AUTH_BOOTSTRAP_SECRET?.trim());
}

function verifyBootstrapCode(code: string): boolean {
  const secret = process.env.AUTH_BOOTSTRAP_SECRET;
  if (!secret) return false;

  const provided = Buffer.from(code);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  if (!bootstrapEnabled()) {
    return NextResponse.json(
      {
        error:
          "Instant sign-in is not configured. Set AUTH_BOOTSTRAP_SECRET in GitHub secrets and redeploy.",
        code: "bootstrap_disabled",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your email and bootstrap code.", code: "invalid_request" },
      { status: 400 },
    );
  }

  if (!verifyBootstrapCode(parsed.data.code)) {
    return NextResponse.json(
      { error: "Invalid bootstrap code.", code: "forbidden" },
      { status: 403 },
    );
  }

  const email = normalizeAuthEmail(parsed.data.email);
  const redirectTo = resolveAuthCallbackUrl(request);

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error) {
      console.error("[api/auth/instant-link]", error.message);
      return NextResponse.json(
        { error: error.message, code: "supabase_error" },
        { status: 400 },
      );
    }

    const actionLink = data.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: "Could not generate sign-in link.", code: "no_link" },
        { status: 500 },
      );
    }

    console.info(
      JSON.stringify({
        event: "instant_link_created",
        at: new Date().toISOString(),
        email: email.replace(/(^.).*(@.*$)/, "$1***$2"),
        redirectTo,
      }),
    );

    return NextResponse.json({
      ok: true,
      actionLink,
      redirectTo,
      message: "Opening your sign-in link…",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Instant sign-in failed.";
    return NextResponse.json(
      { error: message, code: "server_error" },
      { status: 500 },
    );
  }
}
