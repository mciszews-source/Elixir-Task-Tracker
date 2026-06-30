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

  const { response, user } = await updateSession(request);

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (isPublic) return response;

  // API routes return JSON errors — never redirect them to the HTML login page.
  if (pathname.startsWith("/api/")) return response;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return response;
  }

  if (!user) {
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
