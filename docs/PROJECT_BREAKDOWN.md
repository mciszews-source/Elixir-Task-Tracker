# Project Breakdown — Deliverables A–H

Master index for the Elixir Executive Task Tracker production plan.

---

## A. Detailed project breakdown

| Workstream | Scope | Owner (suggested) |
|------------|-------|-------------------|
| **Product** | PRD, roles, MVP scope | Product / Marek |
| **Design** | Executive UI system, component specs | Design + frontend |
| **Backend** | Supabase schema, RLS, API routes | Full-stack |
| **Frontend** | Next.js app, DnD board, reports | Frontend |
| **Auth** | Supabase invite → Azure AD SSO | Full-stack |
| **Integrations** | Asana, Microsoft Graph (Phase 2) | Backend |
| **DevOps** | Vercel + Supabase envs, CI | DevOps |

### Milestones

1. **M0** — Scaffold + docs + mock UI (this PR)
2. **M1** — Auth + live task CRUD for one team
3. **M2** — Cross-team dashboard + admin reorder
4. **M3** — Daily report + projects
5. **M4** — Staging demo + RLS audit
6. **M5** — Production deploy
7. **M6** — Integrations

---

## B. Coding / build plan

See [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for week-by-week tasks.

**Immediate next commits:**

1. `feat(auth): supabase login + profile bootstrap`
2. `feat(tasks): team board with live supabase queries`
3. `feat(tasks): reorder API with activity_log`
4. `feat(dashboard): cross-team view + realtime`
5. `feat(reports): daily report query by timezone`
6. `feat(projects): CRUD + task linking`

---

## C. Suggested tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| DnD | @dnd-kit |
| Data fetching | TanStack Query v5 |
| Backend | Next.js Route Handlers |
| Database | Supabase Postgres |
| Auth | Supabase Auth → Azure AD |
| Realtime | Supabase Realtime |
| Validation | Zod |
| Hosting | Vercel |
| Jobs (Phase 2) | Supabase Edge Functions or Inngest |

---

## D. Folder structure

Implemented in repo root — see [README.md](../README.md#project-structure).

---

## E. Database schema

Executable DDL: [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql)

TypeScript types: [`src/types/database.ts`](../src/types/database.ts)

---

## F. UI/UX recommendations

See [UI_UX_RECOMMENDATIONS.md](./UI_UX_RECOMMENDATIONS.md).

**Key decisions:**

- Horizontal team lanes on dashboard; vertical priority within lane
- Open tasks in right panel; drag to board to prioritize
- Daily report: two-column completed / tomorrow
- 72px min task cards, team color at 10% opacity
- Admin-only cross-lane drag

---

## G. First-pass implementation roadmap

| Week | Deliverable |
|------|-------------|
| 1 | Auth shell, schema, design tokens |
| 2 | Team board + DnD + open panel |
| 3 | Cross-team dashboard + admin reorder + realtime |
| 4 | Daily report + projects |
| 5 | Hardening, E2E, RLS audit |
| 6 | Production deploy + optional SSO |

---

## H. Sample starter code structure

**Implemented in this repository:**

| Area | Path |
|------|------|
| Dashboard page | `src/app/(dashboard)/page.tsx` |
| Team board | `src/app/(dashboard)/teams/[slug]/page.tsx` |
| Daily report | `src/app/(dashboard)/reports/daily/page.tsx` |
| Projects | `src/app/(dashboard)/projects/page.tsx` |
| API routes | `src/app/api/*` |
| DnD components | `src/components/tasks/sortable-task-list.tsx` |
| Permissions | `src/lib/permissions.ts` |
| Supabase clients | `src/lib/supabase/*` |
| DB migration | `supabase/migrations/001_initial_schema.sql` |

Run `npm run dev` to preview the mock-data dashboard.

---

## Extend vs rewrite

**Verdict: UX-preserving rewrite.**

The HTML prototype informs interaction design; the production app is a new Next.js + Supabase codebase. See [PROTOTYPE_ANALYSIS.md](./PROTOTYPE_ANALYSIS.md).
