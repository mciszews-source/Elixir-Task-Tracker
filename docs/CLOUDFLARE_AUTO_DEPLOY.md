# Cloudflare auto-deploy — one-time browser setup (no local terminal)

After this 15-minute setup, **every push to `main` automatically deploys** to Cloudflare. You never need `npm run dev` unless you want to.

---

## What happens automatically

```
You (or an agent) push code to GitHub main
        ↓
GitHub Actions runs `.github/workflows/deploy-cloudflare.yml`
        ↓
Builds Next.js + OpenNext → deploys to Cloudflare Workers
        ↓
Live at your URL (workers.dev or custom domain)
```

Steps 3–5 from before (run locally, manual deploy) are **replaced** by this pipeline.

---

## One-time setup (browser only)

### 1. Cloudflare API token (5 min)

1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click your profile (top right) → **My Profile** → **API Tokens**
3. **Create Token** → use template **Edit Cloudflare Workers**
4. Permissions needed:
   - Account → Cloudflare Workers Scripts → **Edit**
   - Account → Account Settings → **Read** (for account ID)
5. Create token → **copy it** (shown once)

### 2. Cloudflare Account ID (1 min)

1. Cloudflare Dashboard → **Workers & Pages** (any page)
2. Right sidebar → **Account ID** → copy

### 3. GitHub secrets (5 min)

1. Open [github.com/mciszews-source/Elixir-Task-Tracker](https://github.com/mciszews-source/Elixir-Task-Tracker)
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add **each** of these:

| Secret name | Value |
|-------------|--------|
| `CLOUDFLARE_API_TOKEN` | Token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from step 2 |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → service_role key (Reveal) |
| `NEXT_PUBLIC_APP_URL` | Your live URL — see step 4 |
| `NEXT_PUBLIC_TIMEZONE` | `America/New_York` |

### 4. Choose your live URL

**Option A — workers.dev (fastest, no DNS)**

Use this for `NEXT_PUBLIC_APP_URL` until you add a custom domain:

```
https://elixir-task-tracker.<your-subdomain>.workers.dev
```

After the **first** deploy finishes, Cloudflare shows the exact URL in **Workers & Pages** → **elixir-task-tracker**. Update the GitHub secret `NEXT_PUBLIC_APP_URL` to match, then re-run the deploy workflow (Actions → Deploy to Cloudflare → Run workflow).

**Option B — custom domain (e.g. tasks.elixir.com)**

1. Cloudflare → **Workers & Pages** → **elixir-task-tracker** → **Settings** → **Domains**
2. **Add Custom Domain** → e.g. `tasks.elixir.com`
3. Set `NEXT_PUBLIC_APP_URL` to `https://tasks.elixir.com`

### 5. Supabase auth URLs (5 min)

Supabase Dashboard → **Authentication** → **URL Configuration**

| Field | Value |
|-------|--------|
| Site URL | Same as `NEXT_PUBLIC_APP_URL` |
| Redirect URLs | `https://YOUR-URL/auth/callback` |

Example:

```
https://elixir-task-tracker.yourname.workers.dev/auth/callback
```

### 6. Supabase database (one time)

SQL Editor → run these files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_executive_flag_and_admin_policies.sql`
3. `supabase/seed.sql`

### 7. Trigger first deploy

Either:

- **Actions** tab → **Deploy to Cloudflare** → **Run workflow** → **Run workflow**

or push any commit to `main` (merging a PR counts).

Watch the run — green check = live.

**Required GitHub secrets (all 7 must be set or deploy fails immediately with a clear error):**

`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TIMEZONE`

---

## Instant sign-in (no email — use when magic link is broken)

1. GitHub → **Settings → Secrets → Actions** → add `AUTH_BOOTSTRAP_SECRET` (any long password you choose, e.g. `ElixirSetup2026!`)
2. Merge latest `main` or re-run **Deploy to Cloudflare** workflow
3. Open `https://YOUR-APP-URL/login/instant`
4. Enter your Gmail + the bootstrap code → **Sign in now** (no email sent)

Remove or rotate `AUTH_BOOTSTRAP_SECRET` after everyone can use normal email login.

---

## Using the live app (no terminal)

1. Open your `NEXT_PUBLIC_APP_URL` in a browser
2. **Login** → magic link to your invited email
3. Pick a **department** in the left sidebar
4. **Team Access** (sidebar) → invite Marek/Ivan as **Admin**

---

## Custom domain on Elixir DNS (when ready)

1. Cloudflare Dashboard → Workers → **elixir-task-tracker** → **Domains** → Add `tasks.elixir.com`
2. Update GitHub secret `NEXT_PUBLIC_APP_URL`
3. Update Supabase Site URL + Redirect URLs
4. Re-run deploy workflow (or push to main)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Deploy workflow fails | GitHub → Actions → click failed run → read error log |
| Missing secrets | Confirm all 7 GitHub secrets exist (names exact) |
| Login redirect error | Supabase Redirect URLs must include `/auth/callback` on live URL |
| Invite user fails | Run migration `002` in Supabase SQL Editor |
| Old UI showing | Confirm latest `main` deployed (check Actions run time) |

---

## What you do NOT need anymore

- `npm run dev` on your Mac
- `npx wrangler login` locally
- `npm run deploy` locally
- Editing `.env.local` for production (secrets live in GitHub)

Local dev is optional. Production updates = merge to `main`.
