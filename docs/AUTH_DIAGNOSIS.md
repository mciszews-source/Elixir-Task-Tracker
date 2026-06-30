# Magic Link Auth — Root Cause Analysis

**Symptom:** Magic link requested for `you@elixir-md.com` on the live app; UI shows success but no email arrives (inbox, spam, or junk).

**Investigation date:** 2026-06-30  
**App:** Elixir Task Tracker (Next.js on Cloudflare + Supabase Auth)

---

## 1. Root cause summary (ranked)

| Rank | Cause | Likelihood | Why |
|------|--------|------------|-----|
| **1** | **Invite-only + UI masked silent non-delivery** | **Very high** | App is designed invite-only (`SETUP_GUIDE.md` disables public signups). `signInWithOtp` for unknown emails returns **HTTP 200 with no error** when signups are disabled — Supabase anti-enumeration. Old login UI always showed “Check your email” on any non-error response. |
| **2** | **Default Supabase email not production-grade** | **High** (if user *was* invited) | Built-in sender `noreply@mail.app.supabase.io` is rate-limited (~2–4/hr per project) and commonly blocked/quarantined by corporate mail (`@elixir-md.com`). |
| **3** | **`NEXT_PUBLIC_APP_URL` / redirect URL mismatch** | **Medium** | Redirect is baked at build time. If GitHub secret ≠ live Cloudflare/custom domain, or Supabase Redirect URLs omit the exact callback URL, Supabase returns an error (usually visible — not silent). Fixed in this PR by deriving callback from request host. |
| **4** | **Invite never completed / user missing in `auth.users`** | **Medium** | Prior “Database error saving new user” on invite suggests `handle_new_user()` / RLS blocked profile creation. User may not exist even after admin tried to invite. |
| **5** | **Rate limiting** | **Low–medium** | Repeated magic-link tests on default SMTP hit Supabase limits quickly. |
| **6** | **Domain suppression / DNS** | **Low** (until SMTP configured) | Relevant after custom SMTP; need SPF/DKIM/DMARC for sending domain. |

**Most likely single root cause for `you@elixir-md.com`:**  
**#1 — email was never invited (or invite failed), and Supabase returned fake success while the old UI hid that fact.**

**If the user *is* in Supabase Auth → Users:**  
**#2 — default Supabase mail is not reaching corporate inboxes; configure custom SMTP.**

---

## 2. Evidence

### A. App code (before this fix)

```20:32:src/app/(auth)/login/page.tsx
// OLD: client-only signInWithOtp — no user-exists check
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: redirectTo },
});
if (error) { /* show error */ }
setStatus("sent"); // ALWAYS on no error — even when no email sent
```

- No server logging
- No check that user exists in `auth.users` / `profiles`
- `emailRedirectTo` used `NEXT_PUBLIC_APP_URL` (build-time) instead of live request origin

### B. Invite-only design (documented + coded)

- `docs/SETUP_GUIDE.md` §3.1: **“Turn OFF Allow new users to sign up”**
- Login copy: *“Sign in with your invited email”*
- User creation path: `POST /api/admin/users/invite` → `auth.admin.inviteUserByEmail` only
- No public signup flow in the app

### C. Supabase behavior (documented by Supabase)

When **“Allow new users to sign up”** is disabled:
- `signInWithOtp({ email })` for an unregistered email → **200 OK, empty user, no email sent**
- This is intentional (prevents email enumeration)

### D. What we could not verify from this environment

No production Supabase credentials in the agent environment. **You must confirm in dashboard:**

| Check | Where | What to look for |
|-------|--------|------------------|
| User exists? | Auth → Users | `you@elixir-md.com` listed? Status invited/confirmed? |
| Auth log | Auth → Logs | Event `user_recovery_requested` or `magic_link` for that email? Error? |
| SMTP | Project Settings → Auth → SMTP | Custom SMTP enabled or default? |
| Site URL | Auth → URL Configuration | Matches live app URL exactly |
| Redirect URLs | Auth → URL Configuration | Includes `https://<live-host>/auth/callback` |
| Signups | Auth → Providers → Email | “Allow new users to sign up” = OFF (expected) |

### E. Prior invite failure pattern

Conversation history: invite failed with **“Database error saving new user”** — fixed in migration `002_executive_flag_and_admin_policies.sql` (`handle_new_user` + profiles insert policy). If invite was attempted **before** that migration, user may not exist.

---

## 3. Fix now (operations — ~15 min)

1. **Supabase → Authentication → Users**  
   - If `you@elixir-md.com` is missing → **Invite user** (or use app Admin → Send invite after first admin exists).

2. **Re-run failed invites** after migration 002 is applied.

3. **Auth → URL Configuration**  
   - Site URL = your live URL (e.g. `https://elixir-task-tracker.<account>.workers.dev` or custom domain)  
   - Redirect URLs must include: `https://<same-host>/auth/callback`

4. **GitHub secret `NEXT_PUBLIC_APP_URL`**  
   - Must match live URL exactly (no trailing slash). Re-run deploy workflow after changing.

5. **Auth → Logs**  
   - Request magic link → look for send event or error. If no log entry, user likely doesn’t exist.

6. **Deploy this PR**  
   - Login will now show **“No account exists — admin must invite you”** instead of fake success.

---

## 4. Fix permanently (production email)

1. **Custom SMTP** in Supabase (required for `@elixir-md.com`):
   - [Resend](https://resend.com) or SendGrid recommended
   - Verify sending domain DNS (SPF, DKIM, DMARC)
   - Set From: e.g. `Elixir Task Tracker <noreply@elixir-md.com>`

2. **Keep invite-only** — matches product requirements.

3. **First admin bootstrap:** invite via Supabase dashboard if no admin can log in yet.

4. **Monitoring:** Cloudflare Workers logs (structured `magic_link_attempt` JSON) + Supabase Auth logs.

---

## 5. Code / config changes (this PR)

| File | Change |
|------|--------|
| `src/lib/auth/magic-link.ts` | Server-side send, user-exists check, redirect from request host, structured logging |
| `src/app/api/auth/magic-link/route.ts` | POST endpoint with explicit error codes |
| `src/app/(auth)/login/page.tsx` | Calls API, visible errors, admin SMTP note, callback error handling |
| `src/lib/auth/constants.ts` | Shared admin note text |
| `src/app/auth/callback/route.ts` | Logs callback failures |

### Error codes exposed to UI

| Code | Meaning |
|------|---------|
| `user_not_invited` | No profile/auth user — invite required |
| `redirect_misconfigured` | Callback URL not in Supabase allowlist |
| `rate_limited` | Too many attempts |
| `supabase_not_configured` | Missing env vars |
| `callback_failed` | Magic link expired or code exchange failed |

---

## 6. Verification checklist after deploy

- [ ] `you@elixir-md.com` exists in Auth → Users  
- [ ] Magic link request shows success **only** when user exists  
- [ ] Uninvited email shows clear error (not “check email”)  
- [ ] Supabase Auth log shows email send attempt  
- [ ] Email arrives (after SMTP configured)  
- [ ] Clicking link lands on dashboard (callback works)  
- [ ] Cloudflare Workers logs show `magic_link_attempt` events  

---

## 7. Diagnosis path used

```
Login form submit
  → POST /api/auth/magic-link
  → normalize email
  → resolve redirect from request host (not stale build URL)
  → check profiles + auth.users for invite
  → if missing: return 404 user_not_invited (no fake success)
  → signInWithOtp via server
  → log outcome to Workers console
  → return explicit error or honest success message
```

If user exists + Supabase accepts + still no mail → **SMTP/deliverability (#2)**, not app code.
