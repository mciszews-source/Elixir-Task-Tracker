# Priority Reset — Plan (awaiting confirmation)

> Awaiting Marek's go-ahead before code changes. Order is fixed: **interface → login → domain**.

---

## 1. Interface parity with `elixir-task-tracker_4.html` (TOP PRIORITY)

### Goal
A user opening the live app sees the same boards, the same example tasks, the same controls, and can edit everything inline — indistinguishable from the legacy prototype for the core flows.

### What I'll actually change (code-level, not abstract)

**A. Seed the prototype's real data (so boards aren't empty).**
- `scripts/seed-prototype.mjs` — a one-shot Node script that reads the JS-literal `DEFAULT_TASKS` / `DEFAULT_PROJECTS` straight out of `docs/elixir-task-tracker_4.html` (no manual transcription), maps to current schema, and bulk-inserts via the service-role client. Idempotent — re-running won't duplicate.
- `supabase/migrations/003_prototype_seed.sql` — equivalent SQL fallback you can paste into the Supabase SQL editor if you don't want to run the Node script. Both produce the same rows.
- Mapping (already validated against current schema):
  | Legacy | DB column |
  |---|---|
  | `operations`, `marketing`, `sales`, `ewan`, `max`, `marek_jr_` | rows in `teams` (slug + name) |
  | task `name` | `tasks.title` |
  | task `risk` | `tasks.description` |
  | task `deadline` | `tasks.due_date` |
  | task `priority` | `tasks.priority` |
  | task `fromEwan` | `tasks.is_executive_request` |
  | task `done=true` | `tasks.status='done'` + `completed_at` |
  | task array order | `tasks.sort_order` (gap-spaced 100, 200, 300, …) |
  | `astralx`, `clear`, `eva3d` | rows in `projects` |
  | project `phases` | new table `project_phases` (created by the same migration) |
  | phase `docs` | new table `phase_docs` |
- Total rows being inserted: 6 teams, **~70 tasks** (all the real ones from the prototype), 3 projects, 29 phases.

**B. Working inline edit on every task row (no more `window.prompt`).**
- Add an `editingId` state to `team-tracker.tsx`. When set, the matching `ElixirTaskRow` swaps into edit mode:
  - inputs for **name** and **risk/notes**
  - branded priority `<select>`
  - branded date input (Phase D below upgrades this to the popover calendar)
  - "Ewan's request" checkbox
  - ✓ Save · ✕ Cancel
  - `Enter` saves, `Esc` cancels (same as legacy)
- Drag-handle dims while editing; row stays in place (no auto-resort) until Save.
- All other rows stay in view-mode so context isn't lost.
- The ✎ pencil opens edit; ✕ deletes with a branded confirm dialog (next bullet).

**C. Branded confirm dialog (no native `window.confirm`).**
- Component `<ConfirmDialog>` using the existing `.elixir-popover` token + a portal. Used for delete-task and delete-tab. Matches the legacy `.confirm-box` exactly.

**D. Custom date-picker popover (replaces native `<input type="date">`).**
- Component `<DatePickerPopover>` rendered into a portal. Built on the existing `.elixir-popover` / `.elixir-menuitem` tokens which already mirror the legacy `.cal-box`, `.cal-day`, `.cal-today-btn` (added in the UI refactor). Behavior matches legacy: month nav arrows, weekday header, current-day highlight, selected-day highlight, past-day dim, "TODAY" button.
- Used in the add-task row AND inside every editing task row.

**E. Tabs across the top (instead of vertical sidebar) — toggleable.**
- The legacy view is horizontal tabs across the top with the `+` add-tab button and an inline `×` on the active tab to delete. The current sidebar is functional but feels different. Plan: add a **TabBar** component above the main panel that lists departments horizontally, using the existing `.tab-btn` / `.tab-count` styling already in tokens. The sidebar can stay collapsed by default — it's still useful for long lists, but the primary nav becomes the tab bar, matching the prototype.
- **Add tab** → branded prompt (`<NameDialog>`) → `POST /api/teams` (admin-only) → slugifies, inserts, switches to it.
- **Delete tab** → branded confirm → `DELETE /api/teams/[slug]` (admin-only) → cascades tasks, switches to the next tab.

**F. Stats bar + completed-collapse parity.**
- Stats bar already exists; matches legacy after the UI refactor.
- Completed-collapse already exists; I'll persist the per-tab collapsed state to `localStorage` to match the legacy `meta` behavior so a refresh doesn't expand everything.

**G. The "from Ewan" flag.**
- Already in schema (`is_executive_request`). Already shows on the row as the `EWAN` tag. Add-row checkbox is already there. Edit row gets the same checkbox under (B).

**H. Drag-to-reorder.**
- Already working via `@dnd-kit/sortable` + `sort_order`. Will double-check the persistence path with the new seed in place. No code change expected unless seeding breaks the contiguous gaps.

**I. Daily Report button visible on every screen.**
- Already on the header. Will keep. DOCX export (real `.docx` file) stays scheduled per the previous gap analysis — confirm if you want it inside this priority round or in the follow-up; I'd recommend **after** the interface is solid so Marek can test the boards first.

### Side-by-side acceptance check (what I'll verify)
- Open `docs/elixir-task-tracker_4.html` and the live app at `/teams/ewan` in two tabs.
- Boards show the same tasks in the same order.
- Click ✎ on the first row → inline edit row appears with name/date/priority/risk/Ewan checkbox.
- Change the title, press Enter → row updates without a page reload.
- Click ✕ → branded confirm dialog → confirm → row disappears.
- Type a new task in the add row → press Enter → row appears at the top.
- Click the date in the add row → custom calendar pops up, pick a date → calendar closes, label updates.
- Drag a row up/down → order persists across reload.
- Mark a row done → it collapses into the **COMPLETED** section.
- Click + on the tab bar → name dialog → new tab; click × → confirm → tab gone.
- All controls look like Elixir, none like browser defaults.

### Files I'll touch (no surprises)
- New: `scripts/seed-prototype.mjs`, `supabase/migrations/003_prototype_seed.sql`, `src/components/ui/date-picker-popover.tsx`, `src/components/ui/confirm-dialog.tsx`, `src/components/ui/name-dialog.tsx`, `src/components/layout/tab-bar.tsx`, `src/app/api/teams/route.ts` POST, `src/app/api/teams/[slug]/route.ts` DELETE.
- Modify: `src/components/tracker/team-tracker.tsx`, `src/components/tracker/elixir-task-row.tsx`, `src/components/layout/app-shell.tsx` (add tab bar), `src/types/database.ts` (project_phases / phase_docs types).
- Schema: `supabase/migrations/003_prototype_seed.sql` adds `project_phases`, `phase_docs`, RLS, then seeds — single file you can run in the SQL editor.

### Effort estimate
~1 working session for me to land all of (A)–(H) on this branch and push.

---

## 2. Seamless login

### Two paths, both polished

**Path A — Self-serve "Create user" (pending until admin approves).**
- `/signup` (or `/login` toggle to "Create account") with email + name fields.
- Inserts a row into `auth.users` via a server route using the service-role client, **but** the profile row is created with `role='pending'` (new enum value) and is denied app access by RLS until upgraded.
- After signup the user sees a "Awaiting approval" screen with the Elixir branding — not a generic error.
- Admin sees a **Pending approvals** panel inside `/admin/users` listing pending profiles with `Approve as Member` / `Approve as Team Lead` / `Reject` buttons. Approval flips `role` to the chosen value and (optionally) auto-assigns a team.
- On approval, the user can sign in immediately (no second email). On rejection, the auth user is deleted.

**Path B — Magic link (already working post-PR-#11).**
- Kept as-is. The `/login` page already takes an email; we'll add the toggle between "Sign in" (magic link, existing accounts) and "Create account" (path A).
- The instant-bootstrap path is **removed** from the user-facing UI (the secret-based `/login/instant` page becomes admin-only or is gated behind a CLI flag), so the login flow looks clean to anyone arriving at the URL.

### Files
- Modify: `src/app/(auth)/login/page.tsx` (single page with "Sign in / Create account" toggle), drop user-facing link to `/login/instant`.
- New: `src/app/(auth)/pending/page.tsx`, `src/app/api/auth/signup/route.ts`, `src/app/api/admin/approvals/route.ts`, `src/app/api/admin/approvals/[id]/route.ts`.
- Schema: `supabase/migrations/004_pending_role.sql` — add `pending` to the `user_role` enum + tighten RLS so `pending` profiles can't read anything.
- Admin UI: add a **Pending approvals** section at the top of `/admin/users`.

### Effort estimate
~½ working session after the interface lands.

---

## 3. Domain — what I need from you (precise)

I won't move on this until interface + login are done, but here's the exact list so you can line it up.

**A. Tell me the subdomain.**
- e.g. `tasks.elixir-md.com` or `dash.elixir-md.com` — your call.

**B. Cloudflare side (I can do this from here, just need credentials in GitHub Secrets).**
- Already on Cloudflare Workers via OpenNext.
- You add a **Custom Domain** to the worker in the Cloudflare dashboard: Workers & Pages → `elixir-task-tracker` → Settings → Triggers → Custom Domains → Add. Enter the subdomain.
- Cloudflare will tell you whether the apex domain is already on Cloudflare DNS or still on IONOS. Two paths from there:

**C-1. If the apex domain (`elixir-md.com`) is already managed by Cloudflare DNS:**
- Cloudflare auto-creates the proxied CNAME pointing at the worker. **Done.** TLS provisions in ~1–2 minutes.

**C-2. If the apex domain is still on IONOS DNS (most likely):**
- In IONOS DNS for `elixir-md.com`, create a single **CNAME** record:
  - **Name / Host:** `tasks` (or whatever subdomain you chose in A)
  - **Type:** `CNAME`
  - **Value / Target:** `elixir-task-tracker.<your-cf-account-subdomain>.workers.dev` — exact value Cloudflare gives you in step B
  - **TTL:** 3600 (1h) is fine
- Wait ~5–15 min for DNS to propagate. TLS auto-provisions on the Cloudflare side once the CNAME resolves.

**D. After DNS resolves, I update two things:**
- GitHub Secret `NEXT_PUBLIC_APP_URL` → `https://tasks.elixir-md.com` (or the chosen subdomain).
- Supabase → **Auth → URL Configuration** → set **Site URL** = the new subdomain; **add** `https://tasks.elixir-md.com/auth/callback` to **Redirect URLs**.
- Re-deploy (any push to `main` does it).

**E. Exact answers I need from you to start:**
1. **Subdomain** you want (e.g. `tasks.elixir-md.com`).
2. **Apex domain** (`elixir-md.com`? something else?).
3. **Is the apex on Cloudflare DNS or IONOS DNS today?** (If you're not sure, paste me the registrar — IONOS, GoDaddy, etc. — and I'll tell you which it is by running a `dig` and `whois`.)
4. **Cloudflare account ID + a Custom Domain–scoped API token** in GitHub Secrets if you want me to script the Custom Domain attach instead of you doing it in the dashboard. Optional; manual is faster.

That's everything. No SSL paperwork, no MX changes, no email-domain changes — this is only an HTTPS subdomain pointer.

---

## Order I'll execute, once you confirm

1. Build all of §1 in one focused pass on this branch (PR #11 stays the working PR). I'll push commits incrementally so you can preview each step.
2. Hand off §1 for your side-by-side check against `elixir-task-tracker_4.html`.
3. On your "looks good," start §2.
4. On §2 sign-off, do §3 with your subdomain answers in hand.

**Confirm or adjust this plan and I'll start with §1.**
