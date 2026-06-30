import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_DELIVERY_ADMIN_NOTE } from "@/lib/auth/constants";
import {
  normalizeAuthEmail,
  resolveAuthCallbackUrl,
  sendMagicLink,
} from "@/lib/auth/magic-link";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address.", code: "invalid_email" },
        { status: 400 },
      );
    }

    const email = normalizeAuthEmail(parsed.data.email);
    const redirectTo = resolveAuthCallbackUrl(request);

    const result = await sendMagicLink(email, redirectTo);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.message,
          code: result.code,
          redirectTo,
          adminNote:
            result.code === "user_not_invited" ||
            result.code === "supabase_error" ||
            result.code === "smtp_error"
              ? AUTH_DELIVERY_ADMIN_NOTE
              : undefined,
        },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `If ${email} is invited and mail is configured, a sign-in link was sent. Check inbox and spam.`,
      redirectTo,
      adminNote: AUTH_DELIVERY_ADMIN_NOTE,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected auth server error.";
    console.error("[api/auth/magic-link] unhandled:", message);
    return NextResponse.json(
      {
        error: message,
        code: "server_error",
        adminNote: AUTH_DELIVERY_ADMIN_NOTE,
      },
      { status: 500 },
    );
  }
}
