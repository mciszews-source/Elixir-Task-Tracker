# Design Audit — Current Build vs Elixir Source Materials

## A. What was wrong with the previous design

| Area | Previous build | Source (`elixir-task-tracker_4.html` + brand) |
|------|----------------|------------------------------------------------|
| **Background** | Flat `slate-50` / white | Navy-to-sky **gradient** with noise texture |
| **Typography** | Geist Sans, generic weights | **Montserrat** (display) + **Inter** (body), wide letter-spacing |
| **Chrome** | White sidebar, light borders | **Glass panels** — `rgba` blur, white/12 borders |
| **Task layout** | Multi-column team lanes (Kanban-style) | **Single vertical priority list** per department |
| **Task cards** | White cards, team color pills | Glass cards, **left priority stripe**, rank number, inline priority select |
| **Interactions** | Basic DnD only | DnD + ▲▼ move, inline edit, complete checkbox, EWAN tag |
| **Add task** | Not in UI | **Glass add row** — name, date, priority, risk, Ewan checkbox |
| **Stats** | Missing | Priority count pills + overdue indicator |
| **EOD** | Separate report page only | **EOD strip** on every department panel + copy brief |
| **Completed** | Missing | Collapsible completed section with strikethrough |
| **Header** | Generic date + subtitle | DEPARTMENTS / PROJECTS toggle, DAILY REPORT button |
| **Brand** | "Elixir Task Tracker" gray text | **ELIXIR MD INC** wordmark, uppercase tracking |
| **Admin workflow** | Manual SQL for users/roles | Required **in-app Team Access** UI |

The previous UI read as a generic internal SaaS template. The prototype is a **branded executive command surface** — dark, compact, glass, high information density.

---

## B. Specific UI changes implemented

1. **Design tokens** — `--elixir-navy`, red/amber/green/blue priority colors from prototype CSS
2. **Gradient body** + noise overlay in `globals.css`
3. **Montserrat + Inter** via `next/font`
4. **Sidebar retained** — restyled as navy glass department nav (user-requested)
5. **Elixir header** — date center, dept/project pill toggle, daily report CTA
6. **`ElixirTaskRow`** — matches prototype card anatomy (stripe, rank, priority pill, EWAN tag, overdue)
7. **`TeamTracker`** — add row, stats bar, sortable list, completed divider, EOD strip
8. **Login** — dark glass modal matching brand
9. **Reports / Projects** — glass panels, white-on-navy typography
10. **Admin `/admin/users`** — invite, role select, team assignment (no SQL)

---

## C. Revised architecture — Cloudflare + Supabase

```
User → Cloudflare Workers (OpenNext) → Next.js App Router
              ↓
        Supabase Auth (magic link / invite)
              ↓
        Supabase Postgres + RLS
              ↓
        Realtime (tasks) — optional Phase 1.5
```

| Layer | Production choice |
|-------|-------------------|
| Hosting | **Cloudflare Workers** via `@opennextjs/cloudflare` |
| Config | `wrangler.jsonc`, `open-next.config.ts`, `npm run deploy` |
| Env | `NEXT_PUBLIC_APP_URL=https://tasks.elixir.com` (not localhost) |
| Auth | Supabase Auth; redirect to `/auth/callback` on production domain |
| Admin ops | Server routes use `SUPABASE_SERVICE_ROLE_KEY` (Wrangler secret) |
| Data | Supabase RLS; admin policies in migration `002` |

**Not localhost-first:** `.env.example` defaults `NEXT_PUBLIC_APP_URL` to production domain. Local dev overrides in `.env.local` only.

---

## D. In-app user/role management (no manual SQL)

| Action | UI | API |
|--------|-----|-----|
| List users + teams | `/admin/users` | `GET /api/admin/users` |
| Invite user | Form on admin page | `POST /api/admin/users/invite` |
| Change role | Dropdown per user | `PATCH /api/admin/users/[id]` |
| Add to team | Dropdown per user | `PATCH /api/admin/users/[id]` with `team_id` |

**Access:** `admin` role only (Marek, Ivan, delegated admins).

**Under the hood:** `createAdminClient()` + `auth.admin.inviteUserByEmail` — admins never touch SQL.

Run migration `002_executive_flag_and_admin_policies.sql` for RLS policies that allow admins to manage `team_members` and `profiles`.

---

## E. Remaining gaps (Phase 1.5)

- [ ] Project board phases (prototype `proj-panel`) — stub projects page exists
- [ ] Inline edit drawer (prototype uses expand-in-row edit mode)
- [ ] Calendar portal date picker (prototype custom calendar)
- [ ] Cross-team drag for admins only (Marek/Ivan)
- [ ] Supabase Realtime live sync
- [ ] Brand guide PDF color audit line-by-line (PDF in `docs/`)
