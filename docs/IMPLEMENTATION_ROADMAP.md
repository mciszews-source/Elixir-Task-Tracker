# Implementation Roadmap — Elixir Executive Task Tracker

Step-by-step plan to rebuild the HTML prototype into a production Next.js + Supabase app.

---

## Phase 0 — Foundation (Week 1)

### 0.1 Repository and environment
- [x] Next.js + TypeScript + Tailwind scaffold
- [ ] Create Supabase project (dev + staging)
- [ ] Copy `.env.example` → `.env.local` with Supabase keys
- [ ] Run `001_initial_schema.sql` migration
- [ ] Seed teams, Marek/Ivan as `admin`, sample tasks

### 0.2 Auth shell
- [ ] Supabase Auth email invite flow
- [ ] `middleware.ts` session refresh
- [ ] `/login` page
- [ ] `profiles` row created on signup via trigger

### 0.3 Design tokens
- [ ] Extend `globals.css` with executive theme
- [ ] Build `ui/` primitives: Button, Card, Badge, StatusPill

**Exit criteria:** User can log in and see empty dashboard shell.

---

## Phase 1 — Core task board (Week 2)

### 1.1 Data layer
- [ ] TypeScript types from schema (`src/types/database.ts`)
- [ ] `GET /api/teams/[id]/tasks`
- [ ] `POST /api/tasks`, `PATCH /api/tasks/[id]`
- [ ] TanStack Query hooks: `useTasks`, `useCreateTask`

### 1.2 Team view UI
- [ ] `TaskCard`, `SortableTaskList` with `@dnd-kit`
- [ ] `POST /api/tasks/reorder` with fractional indexing
- [ ] Optimistic reorder + error rollback
- [ ] `OpenTasksPanel` with `is_on_board` filter

### 1.3 Task detail
- [ ] `TaskDetailDrawer` — view/edit
- [ ] Status transitions set `completed_at` when done

**Exit criteria:** Team lead can manage and reorder tasks for one team.

---

## Phase 2 — Cross-team dashboard (Week 3)

### 2.1 Dashboard API
- [ ] `GET /api/dashboard` — top N tasks per team
- [ ] RLS verified: member sees own teams; executive sees all

### 2.2 Dashboard UI
- [ ] `TaskBoard` with `TeamLane` columns
- [ ] `TeamSelector` filter
- [ ] Realtime subscription (`useRealtimeTasks`)

### 2.3 Admin cross-team reorder
- [ ] Permission check in reorder API for `admin` role
- [ ] Cross-lane drag (admin only)
- [ ] `activity_log` on every reorder

**Exit criteria:** Marek/Ivan can reprioritize across teams; others read-only on foreign teams.

---

## Phase 3 — Reports and projects (Week 4)

### 3.1 Daily report
- [ ] `GET /api/reports/daily?date=`
- [ ] `DailyReport` + `NextDayPreview` components
- [ ] `/reports/daily` page
- [ ] Copy-to-markdown export

### 3.2 Projects
- [ ] `GET/POST /api/projects`
- [ ] `/projects` page with empty state
- [ ] Link tasks to projects in task form

**Exit criteria:** Daily report matches prototype behavior; projects section live.

---

## Phase 4 — Hardening (Week 5)

- [ ] Admin user management UI
- [ ] Error boundaries, loading skeletons
- [ ] E2E tests: login, reorder, daily report (Playwright)
- [ ] Security review: RLS policy audit
- [ ] Performance: dashboard query < 200ms

**Exit criteria:** Staging demo-ready for CEO office.

---

## Phase 5 — Production prep (Week 6)

- [ ] Vercel production deploy
- [ ] Custom domain + SSL
- [ ] Azure AD SSO (if required before go-live)
- [ ] Backup/restore runbook
- [ ] Onboarding doc for team leads

---

## Phase 6 — Integrations (post-MVP)

See `ARCHITECTURE.md` §7:
1. Asana OAuth + import worker
2. Microsoft Graph SSO
3. Scheduled daily report email

---

## Coding/build plan (sprint breakdown)

| Sprint | Focus | Key files |
|--------|-------|-----------|
| S1 | Auth + schema + layout | `middleware.ts`, `app-shell.tsx`, migration SQL |
| S2 | Team board + DnD | `sortable-task-list.tsx`, `api/tasks/reorder` |
| S3 | Dashboard + realtime | `task-board.tsx`, `use-realtime-tasks.ts` |
| S4 | Reports + projects | `daily-report.tsx`, `projects/page.tsx` |
| S5 | Admin + polish | `permissions.ts`, `admin/users` |
| S6 | Deploy + SSO | Vercel, Azure AD config |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Prototype UX differs from inference | Import HTML file; diff against built UI in week 1 |
| RLS too restrictive | Integration tests per role |
| DnD conflicts with drawer click | 8px activation constraint; separate handle |
| Fractional sort_order exhaustion | Periodic rebalance job (admin cron) |

---

## Definition of done (MVP)

- [ ] 3+ teams with real tasks in staging
- [ ] Marek and Ivan confirmed admin cross-team reorder
- [ ] Daily report accurate to America/New_York midnight boundary
- [ ] 2+ concurrent users see realtime updates
- [ ] No task mutation without auth + RLS enforcement
