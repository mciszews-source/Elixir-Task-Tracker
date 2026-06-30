# Magic-Link Login — Full Root-Cause Audit & Coherent Fix

**App:** Elixir Task Tracker — Next.js 16 (App Router) on Cloudflare Workers (OpenNext) + Supabase Auth
**Audit date:** 2026-06-30
**Scope:** Every layer of the magic-link flow — Supabase config, callback, session/cookies, middleware, client, email/SendGrid, and a safe instant-access fallback.

---

## 0. TL;DR — the single root cause

All five "different" symptoms are **one bug wearing five hats**:

> **The magic link is finalized through Supabase/GoTrue's own `/auth/v1/verify` endpoint, which — for the flow this app actually uses — returns the session in the URL *fragment* (`#access_token=…`). Our `/auth/callback` is a server route handler, and a server can *never* read a URL fragment. So the session token is delivered to a place our server code cannot see, the cookie is never written, and the user lands back on `/login`. Every other symptom is a different point along that same broken path or a config mismatch feeding into it.**

The only path that worked was an accidental one: the browser-side PKCE fallback in `login/page.tsx` (it runs only when the API `fetch` throws). That path stores a PKCE verifier cookie in the browser and produces a `?code=` query param the server *can* read — which is why login "sometimes" worked and "sometimes" didn't. That inconsistency is exactly why it felt like "broken in multiple different ways."

**The fix is to funnel *every* sign-in path through the one mechanism a server route handler can read: the OTP `token_hash` query param verified with `verifyOtp()`** — no fragments, no browser-only PKCE verifier, email-delivery-independent for the bootstrap path.

---

## 1. One coherent chain that explains ALL observed failures

| # | What you saw | Where in the chain | Why it happened (same root) |
|---|--------------|--------------------|------------------------------|
| 1 | "Failed to send magic link" / "Error sending magic link email" | Supabase → SMTP (SendGrid) | GoTrue couldn't hand the mail to an SMTP relay. Real SMTP/sender-verification issue — now partially resolved with SendGrid. This is the *only* symptom that is genuinely a separate (email) problem; the rest are app-flow. |
| 2 | `{"error":"requested path is invalid"}` | Supabase → URL Configuration | This is a **GoTrue** response, not your app. GoTrue's `/verify` rejects the `redirect_to` because the exact callback URL isn't on the **Redirect URLs allowlist** (and/or **Site URL** is wrong / a stale `NEXT_PUBLIC_APP_URL` placeholder like `https://tasks.elixir.com` is baked in). The generated link points somewhere not allowed → "requested path is invalid." |
| 3 | Link verifies but you stay on `/login` | `/auth/callback` (server) ← GoTrue redirect | **The core bug.** GoTrue verifies, then redirects to your callback with the session in the `#fragment` (implicit flow) — unreadable by a server route handler. Callback finds no `code`/`token_hash` in the *query*, falls into the "missing params" branch, and bounces to `/login`. No cookie is ever set. |
| 4 | "Network error … Code: network_error" | Middleware / API routing | Historically, middleware protected `/api/*` and **redirected the API POST to the HTML `/login` page**. The browser `fetch()` then received an opaque redirect / HTML, `JSON.parse` threw, and the catch block reported `network_error`. (Current middleware already excludes `/api/*` — see §5 — so this is mitigated, but verify it's deployed.) |
| 5 | Email is slow / links expire | SendGrid free tier + retries | Delivery latency on free/testing SMTP. Compounds #2/#3 because a slow link is more likely to be expired by the time you click it, making the real flow bug look intermittent. Separate from the app bug. |

**The unifying statement:** Sign-ins were being completed by *GoTrue* (server-side verify → fragment) instead of by *your server callback* (query param → `verifyOtp`). The session therefore materialized somewhere your Cloudflare worker can't read, so the cookie was never written, so middleware saw "no user," so you were redirected to `/login`. URL-config and SMTP issues sit on top of that and make it look like several unrelated bugs.

---

## 2. Exact files / routes responsible

| Layer | File | Verdict |
|-------|------|---------|
| Email send (server) | `src/lib/auth/magic-link.ts` → `sendMagicLink()` | Correct mechanics, but the **emailed link content is controlled by the Supabase email template**, which must emit `token_hash` (see §4). Uses `@supabase/supabase-js` (implicit flow) — fine *once the template is token_hash-based*. |
| Magic-link API | `src/app/api/auth/magic-link/route.ts` | Correct. Returns JSON error codes. No change needed. |
| **Instant access** | `src/app/api/auth/instant-link/route.ts` | **Was broken** — returned `properties.action_link` (GoTrue verify → fragment). **Fixed in this change** to return a direct `…/auth/callback?token_hash=…&type=magiclink` URL. |
| **Callback** | `src/app/auth/callback/route.ts` | Logic was right but **required `type` to be present** alongside `token_hash`. **Hardened** to default `type=email` and to run `verifyOtp` whenever a `token_hash` is present. |
| Route-handler client | `src/lib/supabase/route-handler.ts` | Correct — writes cookies onto the redirect `response`. No change. |
| Middleware | `src/middleware.ts` + `src/lib/supabase/middleware.ts` | Correct now: excludes `/login`, `/auth/callback`, `/api/*`; forwards stray `?code=`/`?token_hash=` to the callback. No change needed (verify deployed). |
| Client login | `src/app/(auth)/login/page.tsx` | Good error rendering; browser PKCE fallback is the accidental "working" path. Keep — it now also works because the template is token_hash-based. |
| Server session read | `src/lib/supabase/server.ts`, `src/lib/auth/session.ts` | Correct. |

---

## 3. Exact code changes (made in this change)

### 3.1 `src/app/api/auth/instant-link/route.ts` — stop using GoTrue's fragment link

```ts
// BEFORE: const actionLink = data.properties?.action_link;   // → /auth/v1/verify → #fragment (server can't read)

// AFTER:
const tokenHash = data.properties?.hashed_token;
if (!tokenHash) {
  return NextResponse.json({ error: "Could not generate sign-in link.", code: "no_link" }, { status: 500 });
}
const callbackUrl = new URL(redirectTo);            // redirectTo === https://<live>/auth/callback
callbackUrl.searchParams.set("token_hash", tokenHash);
callbackUrl.searchParams.set("type", "magiclink");
callbackUrl.searchParams.set("next", "/");
const actionLink = callbackUrl.toString();          // → server-readable, verifyOtp succeeds
```

### 3.2 `src/app/auth/callback/route.ts` — run verifyOtp on any token_hash

```ts
// type now defaults to "email" if the template omits it:
const type = searchParams.get("type") ?? "email";

// branch no longer requires `type` to be explicitly present:
if (tokenHash) {                 // was: if (tokenHash && type)
  response = NextResponse.redirect(successUrl);
  const otpSupabase = createRouteHandlerClient(request, response);
  const { error } = await otpSupabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
  ...
}
```

> The existing `?code=` → `exchangeCodeForSession` branch is kept for the browser-PKCE fallback path; it works because the verifier cookie exists in that case.

**No other code changes are required.** The remaining fixes are Supabase dashboard settings (§4) and verifying middleware is deployed (§5).

---

## 4. Exact Supabase dashboard settings (REQUIRED — this is what makes emailed links work)

### 4.1 Authentication → URL Configuration
- **Site URL:** your exact live host, no trailing slash. One of:
  - `https://elixir-task-tracker.<account>.workers.dev`, or
  - your custom domain, e.g. `https://tasks.elixir-md.com`
- **Redirect URLs (allowlist) — add the exact callback for every host you use:**
  ```
  https://elixir-task-tracker.<account>.workers.dev/auth/callback
  https://tasks.elixir-md.com/auth/callback      ← if/when custom domain is live
  http://localhost:3000/auth/callback            ← local dev
  ```
  Fixes symptom #2 (`requested path is invalid`).

### 4.2 Authentication → Email Templates → **Magic Link** (THE key change)
Replace the default `{{ .ConfirmationURL }}` body with a link that targets **your** callback with a **query** `token_hash` (server-readable), not GoTrue's verify endpoint:

```html
<h2>Sign in to Elixir Task Tracker</h2>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/">
  Click here to sign in
</a></p>
```

This is what fixes symptom #3 for *emailed* links: the token arrives as a query param, your callback runs `verifyOtp`, cookies are written, redirect to `/` succeeds.

> Do the same for **Invite user** and **Confirm signup** templates if you use them: `…/auth/callback?token_hash={{ .TokenHash }}&type=invite` and `type=signup` respectively.

### 4.3 Authentication → Providers → Email
- **Allow new users to sign up: OFF** (invite-only — matches product design).
- Confirm the invited user exists under **Authentication → Users**.

### 4.4 Project Settings → Authentication → SMTP (SendGrid) — symptom #1 / #5
- Enable custom SMTP: **ON**
- Host `smtp.sendgrid.net` · Port `587` · Username **literally** `apikey` · Password = SendGrid API key
- **Sender email must exactly equal your verified SendGrid Single Sender** (or a verified domain sender). A mismatch here is the #1 cause of "Error sending email."
- Long-term (see §8): verify a *domain* sender with SPF/DKIM/DMARC, not just a single sender.

### 4.5 GitHub secret `NEXT_PUBLIC_APP_URL`
- Must equal the live host **exactly** (no trailing slash), and match Site URL (§4.1).
- It is **baked in at build time** (DefinePlugin) — changing it requires a re-deploy. A stale placeholder (`https://tasks.elixir.com`) is a classic source of wrong generated links.

---

## 5. Exact middleware matcher / exclusion rules (verify deployed)

Current `src/middleware.ts` is already correct — confirm this exact behavior is live:

```ts
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

// 1) Forward stray GoTrue redirects that land on "/" with ?code/?token_hash
if (pathname !== "/auth/callback" && (searchParams.has("code") || searchParams.has("token_hash"))) {
  const callbackUrl = request.nextUrl.clone();
  callbackUrl.pathname = "/auth/callback";
  return NextResponse.redirect(callbackUrl);
}

const { response, user } = await updateSession(request);

if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return response;  // /login, /auth/callback
if (pathname.startsWith("/api/")) return response;                      // ← never redirect APIs to HTML (fixes #4)

if (!user) { /* redirect to /login with ?redirect= */ }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

Rules that must hold (all satisfied above):
- `/login` and `/auth/callback` are **public** (never gated).
- `/api/*` (including `/api/auth/*`) returns `response` — **JSON, never an HTML redirect** → kills the `network_error` symptom.
- `?code=` / `?token_hash=` on any non-callback path is forwarded to `/auth/callback`.

---

## 6. Exact callback / session / cookie implementation for Cloudflare

The shape that works on Cloudflare Workers (already implemented):

1. **Create the redirect response first, then the Supabase client bound to it.** Cookies set by `verifyOtp`/`exchangeCodeForSession` are written onto the *same response object that carries the 302*, so they survive the redirect:
   ```ts
   let response = NextResponse.redirect(successUrl);
   const supabase = createRouteHandlerClient(request, response); // setAll writes to `response.cookies`
   await supabase.auth.verifyOtp({ token_hash, type });          // cookies now on the redirect response
   return response;                                              // 302 + Set-Cookie together
   ```
2. **Do not redirect before the session is persisted.** The `await verifyOtp(...)` completes (and thus `setAll` fires) before `return response`. ✔
3. **Cookie attributes** are handled by `@supabase/ssr` and are correct for Cloudflare/HTTPS: `Path=/`, `SameSite=Lax` (required so the cookie is sent on the top-level GET navigation coming from the email), `HttpOnly` on server-written cookies, `Secure` on HTTPS. **Leave `Domain` unset** (host-only) so the cookie binds to whichever live host served it — don't pin a domain that won't match the worker host.
4. **Middleware must re-read and refresh** those cookies on the next request — `updateSession()` calls `getUser()` and re-issues refreshed cookies onto its own `NextResponse`. ✔

The classic "redirect drops the cookie" bug is avoided specifically because the cookies and the 302 are on one response object. The reason it *looked* broken before was not dropped cookies — it was that the implicit/fragment flow never gave the server a token to set a cookie from in the first place.

---

## 7. Smoke-test checklist (proves the whole flow)

Run top-to-bottom on the live URL after applying §3 (deployed) + §4 (dashboard):

**A. Instant access (email-independent — do this FIRST to prove the app half):**
- [ ] `AUTH_BOOTSTRAP_SECRET` is set (GitHub secret + synced as a `wrangler secret`).
- [ ] Go to `/login/instant`, enter an **invited** email + the bootstrap code → "Sign in now".
- [ ] Browser navigates to `…/auth/callback?token_hash=…&type=magiclink&next=/`.
- [ ] You land on the dashboard `/`, **not** back on `/login`.
- [ ] DevTools → Application → Cookies shows `sb-…-auth-token` cookies set on the live host.
- [ ] Reload — you stay signed in (middleware reads the cookie).

**B. Config sanity:**
- [ ] Supabase **Redirect URLs** contains the exact `https://<live>/auth/callback`.
- [ ] **Site URL** equals the live host; GitHub `NEXT_PUBLIC_APP_URL` matches it; re-deployed.
- [ ] Magic Link email template uses `…/auth/callback?token_hash={{ .TokenHash }}&type=email`.

**C. Real magic link (email):**
- [ ] `/login` → enter invited email → "Send magic link" → success message (no `network_error`).
- [ ] Cloudflare logs show `magic_link_attempt … outcome:"sent"`.
- [ ] Supabase → Auth → Logs shows the send event (no "requested path is invalid").
- [ ] Email arrives (allow for SendGrid delay); the link is `…/auth/callback?token_hash=…` (NOT a `supabase.co/auth/v1/verify` link with a `#`).
- [ ] Click it → land on dashboard; Cloudflare logs show `auth_callback_success … method:"verifyOtp"`.

**D. Negative / guard checks:**
- [ ] Uninvited email → clear "No account exists — admin must invite you" (not fake success).
- [ ] Hitting `/` while signed out → redirected to `/login?redirect=/`.
- [ ] `curl -i https://<live>/api/dashboard` while signed out → **JSON 401**, not an HTML 302 to `/login`.

---

## 8. SendGrid / email: short-term vs long-term

- **Short term (now):** SendGrid single-sender is fine for testing. Verify sender == the exact From in Supabase SMTP. Expect minutes of delay on free tier — that is *delivery latency*, not an app bug. Always click the newest link (older ones expire).
- **Long term (recommended, do AFTER login architecture is verified green):**
  - Verify a **domain** sender (`noreply@elixir-md.com`) in SendGrid, add **SPF + DKIM + DMARC** DNS records. Single-sender mail from a corporate domain is frequently quarantined.
  - Raise the magic-link OTP expiry in Supabase (Auth → Email) to absorb delivery latency (e.g. 10–30 min) so slow mail doesn't produce expired links.
  - Keep instant-access (§9) as the admin break-glass path independent of email.

---

## 9. Instant / fallback access (safe, temporary, removable)

You already have the right primitive — it's now fixed to be reliable:

**How it works (post-fix):**
- `POST /api/auth/instant-link` requires `AUTH_BOOTSTRAP_SECRET` (constant-time compared).
- It uses the **service-role** admin client to `generateLink({ type: "magiclink" })` and returns a link straight to **your** callback with the OTP `token_hash` → `verifyOtp` → session. No email, no delivery delay, no fragment.
- It only mints links for **already-invited** users (the user must exist in Supabase Auth), so it cannot create accounts.

**Why it's safe:**
- Gated by a long random secret held only in GitHub Secrets / `wrangler secret` (never in client code or the repo).
- Constant-time comparison resists timing attacks.
- Disabled by default — returns `503 bootstrap_disabled` if `AUTH_BOOTSTRAP_SECRET` is unset.
- Issues a normal short-lived Supabase session; it does not elevate roles.

**How to enable (bootstrap):**
1. `AUTH_BOOTSTRAP_SECRET = <32+ random chars>` as a GitHub secret (the deploy workflow syncs it as a `wrangler secret`).
2. Re-deploy. Use `/login/instant` to get the first admin in.

**How to remove cleanly when email is solid:**
1. Delete the `AUTH_BOOTSTRAP_SECRET` GitHub secret **and** run `npx wrangler secret delete AUTH_BOOTSTRAP_SECRET`.
2. Re-deploy → the endpoint returns `503` and `/login/instant` is inert.
3. (Optional, permanent) delete `src/app/api/auth/instant-link/route.ts` and `src/app/(auth)/login/instant/page.tsx`, remove the secret-sync step from `.github/workflows/deploy-cloudflare.yml`, and drop the `/login/instant` link from `login/page.tsx`.

---

## 10. Why this is one fix, not five patches

Switching the **email template** + **instant-link** + **callback** to a single, server-readable `token_hash → verifyOtp` mechanism collapses every symptom:
- #3 (stuck on login) disappears because the token now arrives as a query param the server can read and turn into a cookie.
- #2 (`requested path is invalid`) disappears once the callback URL is allowlisted and the link points at your host, not GoTrue's verify endpoint.
- #4 (`network_error`) is gone because middleware returns JSON for `/api/*`.
- #1/#5 (SMTP/delay) are isolated as a pure email-deliverability concern with a clear SendGrid checklist and an email-independent bootstrap path to unblock you immediately.
