import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Supabase may redirect to Site URL root with ?code= instead of /auth/callback.
  if (
    pathname !== "/auth/callback" &&
    (searchParams.has("code") || searchParams.has("token_hash"))
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  const response = await updateSession(request);

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (isPublic) return response;

  // In MVP dev without Supabase configured, allow dashboard access
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return response;
  }

  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasSession && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
