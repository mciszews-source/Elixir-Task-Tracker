# Setup Guide — Supabase + Cloudflare (Steps 2–5)

This guide walks through connecting the Elixir Task Tracker to **Supabase** (cloud database + auth) and deploying to **Cloudflare Workers** via OpenNext.

**Time estimate:** ~45–60 minutes for first-time setup.

---

## Prerequisites

- GitHub repo cloned locally (`mciszews-source/Elixir-Task-Tracker`)
- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier works for dev)
- A [Cloudflare](https://cloudflare.com) account with access to Elixir DNS (for custom domain later)

---

## Step 2 — Create Supabase project and run the schema

### 2.1 Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Name: `elixir-task-tracker`
3. Database password: generate and **save in a password manager**
4. Region: **East US** (closest to America/New_York users)
5. Wait ~2 minutes for provisioning

### 2.2 Run the database migration

1. In Supabase → **SQL Editor** → **New query**
2. Open `supabase/migrations/001_initial_schema.sql` from this repo
3. Paste the entire file → **Run**
4. Confirm success (no red errors). You should see tables: `profiles`, `teams`, `team_members`, `tasks`, `projects`, `activity_log`

### 2.3 Seed teams

1. Still in SQL Editor, run `supabase/seed.sql`
2. Verify: **Table Editor** → `teams` should show CEO Office, Operations, Finance, Engineering

### 2.4 Enable Realtime (for live updates)

1. **Database** → **Replication** (or Publications)
2. Confirm `tasks` is in the `supabase_realtime` publication (migration adds this)
3. If missing, run:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
   ```

### 2.5 Copy API keys

1. **Project Settings** → **API**
2. Copy these three values:

| Key | Where it goes |
|-----|---------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose to browser) |

### 2.6 Create local env file

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TIMEZONE=America/New_York
```

### 2.7 Invite Marek and Ivan (admin users)

**Option A — Dashboard invite (recommended)**

1. **Authentication** → **Users** → **Invite user**
2. Invite `marek@...` and `ivan@...` (use real emails)
3. After they accept, run in SQL Editor:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email IN ('marek@elixir.com', 'ivan@elixir.com');
```

Replace emails with the actual addresses you invited.

**Option B — Pre-create via SQL** (advanced; skip unless needed)

### 2.8 Add sample tasks (optional, for demo)

```sql
INSERT INTO tasks (team_id, title, status, priority, sort_order, is_on_board)
SELECT id, 'Finalize board deck', 'in_progress', 'critical', 1000, true
FROM teams WHERE slug = 'ceo-office';

INSERT INTO tasks (team_id, title, status, priority, sort_order, is_on_board)
SELECT id, 'Schedule Q3 planning offsite', 'open', 'medium', 1000, false
FROM teams WHERE slug = 'ceo-office';
```

### 2.9 Verify

```bash
npm install
npm run dev
```

With `.env.local` set, visiting `/` should redirect to `/login`. Without valid session you'll need to complete Step 3 first.

---

## Step 3 — Wire authentication (magic link)

### 3.1 Configure Supabase Auth

1. **Authentication** → **Providers** → **Email**
   - Enable Email provider
   - **Confirm email**: ON (recommended)
   - **Secure email change**: ON

2. **Authentication** → **URL Configuration**

| Field | Value (local dev) | Value (production) |
|-------|-------------------|---------------------|
| Site URL | `http://localhost:3000` | `https://tasks.elixir.com` (or your Cloudflare URL) |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://tasks.elixir.com/auth/callback` |

Add **both** local and production URLs to Redirect URLs during setup.

3. **Authentication** → **Settings** → disable public signups:
   - Turn **OFF** "Allow new users to sign up" (invite-only)
   - Users must be invited via dashboard (Step 2.7)

### 3.2 How auth works in this app

```
User enters email on /login
    → Supabase sends magic link
    → User clicks link → /auth/callback?code=...
    → App exchanges code for session cookie
    → Redirect to dashboard
```

Relevant code:
- `src/app/(auth)/login/page.tsx` — magic link form
- `src/app/auth/callback/route.ts` — session exchange
- `src/middleware.ts` — protects routes, refreshes session

### 3.3 Test auth locally

1. Invite your own email in Supabase dashboard
2. `npm run dev`
3. Go to `http://localhost:3000/login`
4. Enter your email → click magic link in inbox
5. You should land on the dashboard

### 3.4 Assign team membership

New users get `member` role by default. Add them to a team:

```sql
-- Replace UUIDs with real values from Table Editor
INSERT INTO team_members (team_id, user_id, is_lead)
VALUES (
  (SELECT id FROM teams WHERE slug = 'ceo-office'),
  (SELECT id FROM profiles WHERE email = 'your@email.com'),
  true
);

UPDATE profiles SET role = 'team_lead'
WHERE email = 'your@email.com';
```

---

## Step 4 — Replace mock data with live Supabase queries

This is **already wired** in the codebase when env vars are set.

### 4.1 What happens automatically

| Component | Behavior |
|-----------|----------|
| `src/lib/queries/dashboard.ts` | Fetches teams + board/open tasks from Supabase |
| `GET /api/dashboard` | Returns live data (falls back to mock if no env) |
| `GET /api/reports/daily` | Returns completed today + top tomorrow from DB |
| `DashboardClient` | Uses TanStack Query → `/api/dashboard` |

### 4.2 Enable Realtime (optional but recommended)

Add to `DashboardClient` or a dedicated hook:

```typescript
// src/hooks/use-realtime-tasks.ts (pattern)
const supabase = createClient();
supabase
  .channel("tasks")
  .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  })
  .subscribe();
```

For MVP, manual refresh or page reload is fine until you add this hook.

### 4.3 Verify live data

1. Ensure `.env.local` has Supabase keys
2. Add tasks via SQL (Step 2.8) or Supabase Table Editor
3. `npm run dev` → dashboard should show real tasks, not mock "Finalize board deck" unless that's in your DB

### 4.4 Troubleshooting

| Symptom | Fix |
|---------|-----|
| Still shows mock data | Check `NEXT_PUBLIC_SUPABASE_URL` is set; restart dev server |
| Empty dashboard | Run seed SQL; add tasks with `is_on_board = true` |
| 401 on API routes | Log in first; check session cookie |
| RLS blocks reads | Add user to `team_members` or set role to `admin`/`executive` |

---

## Step 5 — Connect drag-and-drop reorder to the database

Also **already wired** in `POST /api/tasks/reorder`.

### 5.1 How reorder works

1. User drags task → `DashboardClient.handleReorder`
2. Computes `neighbor_before` / `neighbor_after` sort orders
3. `POST /api/tasks/reorder` with `{ team_id, task_id, neighbor_before, neighbor_after }`
4. API calculates fractional `sort_order`, updates `tasks`, writes `activity_log`

### 5.2 Permission rules

| Action | Who |
|--------|-----|
| Reorder within own team | `team_lead`, `admin` |
| Move task to another team | `admin` only (Marek, Ivan) |

### 5.3 Test reorder

1. Log in as admin
2. Drag a task on the dashboard
3. Check Supabase **Table Editor** → `tasks` → `sort_order` changed
4. Check `activity_log` → new `reordered` row

### 5.4 Troubleshooting reorder

| Symptom | Fix |
|---------|-----|
| Drag works but reverts | Check browser Network tab for 403/500 on `/api/tasks/reorder` |
| 403 Forbidden | User needs `team_lead` or `admin` role + team membership |
| sort_order not changing | Verify RLS UPDATE policy; check Supabase logs |

---

## Step 6 — Deploy to Cloudflare

Cloudflare's recommended path for Next.js 16 is **OpenNext on Cloudflare Workers** (not legacy Cloudflare Pages).

### 6.1 Install OpenNext + Wrangler

```bash
npm install --save-dev @opennextjs/cloudflare wrangler
```

### 6.2 Add Cloudflare config files

The repo includes:
- `wrangler.jsonc` — Worker config
- `open-next.config.ts` — OpenNext adapter config

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "lint": "eslint"
  }
}
```

### 6.3 Log in to Cloudflare

```bash
npx wrangler login
```

### 6.4 Set secrets / environment variables

**Never commit secrets.** Set them in Cloudflare:

```bash
# Run from project root after wrangler login
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

For `NEXT_PUBLIC_*` vars, also add them as plain **Environment Variables** in the Cloudflare dashboard (Workers & Pages → your worker → Settings → Variables) because they must be available at build time:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | `https://tasks.elixir.com` |
| `NEXT_PUBLIC_TIMEZONE` | `America/New_York` |
| `SUPABASE_SERVICE_ROLE_KEY` | (secret — use wrangler secret put) |

### 6.5 Deploy

```bash
npm run deploy
```

First deploy gives you a `*.workers.dev` URL. Test auth and dashboard there.

### 6.6 Connect custom domain (Elixir DNS)

Since Marek mentioned Elixir already owns the domain on Cloudflare:

1. **Cloudflare Dashboard** → **Workers & Pages** → your worker → **Settings** → **Domains & Routes**
2. **Add Custom Domain**: e.g. `tasks.elixir.com` (or `dashboard.elixir.com`)
3. Cloudflare auto-creates the DNS record if the zone is on Cloudflare
4. Update Supabase **Redirect URLs** and **Site URL** to `https://tasks.elixir.com`
5. Update `NEXT_PUBLIC_APP_URL` in Cloudflare env vars

### 6.7 GitHub auto-deploy (optional)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Connect GitHub**
2. Select `Elixir-Task-Tracker` repo
3. Build command: `npm run deploy` or use OpenNext build pipeline
4. Add environment variables in Cloudflare project settings
5. Every merge to `main` auto-deploys

### 6.8 Cloudflare vs Vercel note

This app uses standard Next.js App Router + Route Handlers + Middleware. OpenNext on Cloudflare Workers supports all of these. If you hit edge-case issues, Vercel is the zero-config fallback — but Cloudflare is fine for this stack.

---

## Quick reference checklist

- [ ] Supabase project created
- [ ] `001_initial_schema.sql` run
- [ ] `seed.sql` run
- [ ] `.env.local` filled with API keys
- [ ] Marek + Ivan invited and set to `admin`
- [ ] Auth redirect URLs configured (local + production)
- [ ] Signups disabled (invite-only)
- [ ] Magic link login works locally
- [ ] Dashboard shows live tasks from DB
- [ ] Drag reorder updates `tasks.sort_order` + `activity_log`
- [ ] `wrangler login` + env vars set in Cloudflare
- [ ] `npm run deploy` succeeds
- [ ] Custom domain `tasks.elixir.com` pointed (when ready)
- [ ] Supabase Site URL updated to production domain

---

## What to send Marek for DNS / access

Ask Marek for:

1. **Cloudflare account access** (or add your email to the Elixir Cloudflare org)
2. **Which subdomain** to use: `tasks.elixir.com` vs `dashboard.elixir.com`
3. **Real emails** for Marek and Ivan admin accounts
4. **Team list** to seed beyond the 4 default teams

No separate domain purchase needed if Elixir DNS is already on Cloudflare.
