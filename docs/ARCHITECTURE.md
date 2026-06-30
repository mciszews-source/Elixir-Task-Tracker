# Technical Architecture — Elixir Executive Task Tracker

## 1. Recommended stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 16** (App Router) | SSR for dashboard, API routes, Vercel deploy |
| Language | **TypeScript** | Type safety across DB ↔ API ↔ UI |
| Styling | **Tailwind CSS v4** | Fast iteration; executive polish via tokens |
| UI primitives | **Custom components** (shadcn-compatible patterns) | Full control over executive aesthetic |
| Database | **Supabase Postgres** | Managed Postgres + Auth + Realtime + RLS |
| Auth | **Supabase Auth** → Azure AD (Phase 1.5) | Invite flow now; SSO later |
| Client data | **TanStack Query v5** | Cache, optimistic updates, invalidation |
| Drag-and-drop | **@dnd-kit** | Accessible, touch-friendly, React-native |
| Validation | **Zod** | Shared schemas API ↔ forms |
| Hosting | **Vercel** | Zero-config Next.js; preview deploys |
| Background jobs (Phase 2) | **Supabase Edge Functions** or **Inngest** | Asana sync, scheduled reports |

**Why not alternatives?**

- **Firebase:** Weaker relational modeling for cross-team priority queries.
- **Prisma + separate Postgres:** More ops; Supabase gives Auth+RLS+Realtime in one.
- **Remix:** Fine, but team preference is Next.js; no strong advantage here.

---

## 2. System architecture

```
┌──────────────┐     HTTPS      ┌─────────────────────┐
│   Browser    │◄────────────►│  Vercel (Next.js)   │
│  React + RQ  │                │  App Router + API   │
└──────┬───────┘                └──────────┬──────────┘
       │                                   │
       │ WebSocket (Realtime)                │ service role
       ▼                                   ▼
┌──────────────────────────────────────────────────────┐
│                    Supabase                           │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐ │
│  │  Auth   │  │ Postgres │  │Realtime │  │Storage │ │
│  │ (JWT)   │  │  + RLS   │  │ tasks   │  │ (opt)  │ │
│  └─────────┘  └──────────┘  └─────────┘  └────────┘ │
└──────────────────────────────────────────────────────┘
       ▲
       │ Phase 2: webhooks / cron
┌──────┴───────┐
│ Edge Fn /    │
│ Inngest jobs │──► Asana API, Microsoft Graph
└──────────────┘
```

### Request flow (task reorder)

1. User drags task → optimistic UI update (TanStack Query cache).
2. `PATCH /api/tasks/reorder` with `{ taskId, newSortOrder, teamId }`.
3. API validates JWT, loads `profiles.role`, checks team permission.
4. Transaction: shift `sort_order` for affected tasks in team scope.
5. Insert `activity_log` row.
6. Return updated ordering; Realtime broadcasts to other clients.
7. On error → rollback optimistic update, toast user.

---

## 3. Database schema

See `supabase/migrations/001_initial_schema.sql` for executable DDL.

### Entity relationship (conceptual)

```
organizations ─┬─ teams ─┬─ team_members ─── profiles ─── auth.users
               │         │
               │         └─ tasks ─── projects
               │                └─ activity_log
               └─ projects
```

### Core tables

#### `profiles`
Extends `auth.users`. One row per person.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → auth.users |
| email | text | |
| full_name | text | |
| role | enum | admin, executive, team_lead, member, viewer |
| avatar_url | text | nullable |
| created_at | timestamptz | |

#### `teams`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | e.g. "Engineering" |
| slug | text unique | URL segment |
| color | text | hex for UI lane |
| sort_order | int | dashboard column order |
| created_at | timestamptz | |

#### `team_members`

| Column | Type | Notes |
|--------|------|-------|
| team_id | uuid FK | |
| user_id | uuid FK | |
| is_lead | boolean | |
| PK | (team_id, user_id) | |

#### `projects`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| team_id | uuid FK nullable | null = org-wide |
| name | text | |
| status | enum | active, on_hold, completed |
| description | text | |
| created_at | timestamptz | |

#### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| team_id | uuid FK | required |
| project_id | uuid FK | nullable |
| title | text | |
| description | text | |
| status | enum | open, in_progress, blocked, done |
| priority | enum | low, medium, high, critical |
| sort_order | numeric | fractional indexing for cheap reorder |
| assignee_id | uuid FK | nullable → profiles |
| due_date | date | nullable |
| is_on_board | boolean | false = open-tasks-only backlog |
| completed_at | timestamptz | set when status → done |
| created_by | uuid FK | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Fractional indexing:** On reorder, set `sort_order` between neighbors (e.g. avg) to avoid renumbering entire list.

#### `activity_log`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| task_id | uuid FK | |
| actor_id | uuid FK | |
| action | text | e.g. `reordered`, `status_changed` |
| metadata | jsonb | `{ from, to, team_id }` |
| created_at | timestamptz | |

#### `integration_connections` (Phase 2 stub)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| provider | enum | asana, microsoft |
| credentials | jsonb encrypted | vault / pgsodium later |
| team_id | uuid FK nullable | |
| sync_enabled | boolean | |
| last_sync_at | timestamptz | |

### Indexes

- `tasks (team_id, sort_order)` — board queries
- `tasks (team_id, status, is_on_board)` — open tasks panel
- `tasks (completed_at)` WHERE status = 'done' — daily report
- `activity_log (task_id, created_at DESC)`

### RLS policy summary

- **SELECT tasks:** user is member of task's team OR role IN (admin, executive)
- **UPDATE tasks (own team):** team_lead+ or assignee for limited fields
- **UPDATE sort_order cross-team:** `profiles.role = 'admin'` only
- **INSERT/DELETE tasks:** team_lead+ for that team; admin globally

---

## 4. Frontend component map

```
src/components/
├── layout/
│   ├── app-shell.tsx          # Dashboard chrome
│   ├── sidebar.tsx            # Nav: Dashboard, Teams, Reports, Projects
│   └── top-bar.tsx            # Date, user menu, quick actions
├── teams/
│   ├── team-selector.tsx      # Filter / switch team context
│   └── team-lane.tsx          # Single team column on dashboard
├── tasks/
│   ├── task-card.tsx          # Executive-readable card
│   ├── task-board.tsx         # Multi-lane dashboard board
│   ├── sortable-task-list.tsx # DnD wrapper (@dnd-kit)
│   ├── open-tasks-panel.tsx   # Right-rail open items
│   ├── task-detail-drawer.tsx # Slide-over on open
│   └── task-form.tsx          # Create/edit modal
├── reports/
│   ├── daily-report.tsx       # Completed today section
│   └── next-day-preview.tsx   # Top N tomorrow
├── projects/
│   ├── projects-grid.tsx      # Card grid
│   └── project-form.tsx
└── ui/
    ├── button.tsx
    ├── badge.tsx
    ├── card.tsx
    └── status-pill.tsx
```

---

## 5. Page / screen map

| Route | Screen | Primary users |
|-------|--------|---------------|
| `/login` | Auth | All |
| `/` | Cross-team dashboard | Admin, executive |
| `/teams/[slug]` | Team task board + open panel | Team lead, members |
| `/reports/daily` | Daily report (today + tomorrow) | Admin, executive |
| `/projects` | Projects registry | Team lead, admin |
| `/projects/[id]` | Project detail + linked tasks | Team lead |
| `/settings` | Profile, notifications | All |
| `/admin/users` | User/role management | Admin only |
| `/admin/integrations` | Asana/M365 (Phase 2) | Admin only |

---

## 6. API route plan

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/teams` | List teams for user | member+ |
| GET | `/api/teams/[id]/tasks` | Team board + open tasks | member+ |
| GET | `/api/dashboard` | Cross-team summary | executive+ |
| POST | `/api/tasks` | Create task | team_lead+ |
| PATCH | `/api/tasks/[id]` | Update fields | per RLS |
| DELETE | `/api/tasks/[id]` | Soft/hard delete | team_lead+ |
| POST | `/api/tasks/reorder` | Batch reorder | team_lead / admin |
| GET | `/api/reports/daily` | `?date=YYYY-MM-DD` | member+ |
| GET/POST | `/api/projects` | List/create | team_lead+ |
| GET | `/api/activity/[taskId]` | Task history | member+ |

All routes: validate session via `createServerClient`, return `{ data, error }` JSON.

---

## 7. Integration plan (Phase 2)

### Asana

1. OAuth app in Asana developer console.
2. `integration_connections` stores refresh token per team.
3. Edge Function `sync-asana`:
   - Pull: projects → `projects`, tasks → `tasks` with `external_id`.
   - Map Asana assignee email → `profiles`.
   - Conflict rule: **Elixir app wins** on `sort_order`; Asana wins on title/description unless edited locally in last 24h.
4. Webhook for task changes (optional).

### Microsoft

1. **Azure AD** — Supabase SAML/OIDC for SSO (same tenant as Elixir).
2. **Microsoft Graph** (optional):
   - Read user profile for assignee autocomplete.
   - Teams channel post on daily report (webhook connector).
3. **Excel / SharePoint** — one-time CSV/Excel upload → `tasks` import wizard; no continuous sync in v1.

### Integration architecture

```
integration_connections
        │
        ▼
┌───────────────────┐
│  sync_queue table │  job_type, payload, status
└─────────┬─────────┘
          ▼
   Edge Function / Inngest
          ▼
   External API (Asana / Graph)
```

---

## 8. Deployment recommendation

### MVP

| Service | Config |
|---------|--------|
| **Vercel** | Production + preview per PR; env vars for Supabase |
| **Supabase** | Pro plan; `us-east-1`; daily backups |
| **Domain** | `tasks.elixir.internal` or `tasks.elixir.com` — DNS after MVP |
| **Secrets** | `SUPABASE_SERVICE_ROLE_KEY` server-only; never client |

### Environments

- `development` — local Next + Supabase local (optional) or dev project
- `staging` — Vercel preview + Supabase staging project
- `production` — Vercel production + Supabase prod

### CI/CD

- GitHub Actions: `lint`, `typecheck`, `build` on PR
- Auto-deploy `main` → production after approval

---

## 9. Folder structure

```
elixir-task-tracker/
├── docs/                          # PRD, architecture, roadmap
├── supabase/
│   ├── migrations/                # SQL migrations
│   └── seed.sql                   # Dev seed data
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Cross-team dashboard
│   │   │   ├── teams/[slug]/page.tsx
│   │   │   ├── reports/daily/page.tsx
│   │   │   └── projects/page.tsx
│   │   ├── api/                   # Route handlers
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                # See component map
│   ├── hooks/
│   │   ├── use-tasks.ts
│   │   └── use-realtime-tasks.ts
│   ├── lib/
│   │   ├── supabase/              # client, server, middleware
│   │   ├── permissions.ts
│   │   ├── queries/
│   │   └── utils.ts
│   └── types/
│       ├── database.ts            # Generated + helpers
│       └── api.ts
├── middleware.ts                  # Auth session refresh
├── .env.example
├── package.json
└── README.md
```
