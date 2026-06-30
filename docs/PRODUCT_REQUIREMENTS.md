# Product Requirements Document — Elixir Executive Task Tracker

**Version:** 1.0 (MVP)  
**Audience:** CEO office, department leads, operations  
**Status:** Draft — pending prototype file validation

---

## 1. Product summary

Elixir Executive Task Tracker is an **internal leadership dashboard** that gives the CEO office a single, polished view of prioritized work across departments. It replaces fragmented Excel sheets and siloed Asana boards with one cloud-based system where teams manage their own tasks, leadership sees the full picture, and **only designated admins** can reprioritize work across team boundaries.

### Problem

- Tasks live in Excel, Asana, email, and personal lists.
- Leadership lacks a unified, real-time priority view across teams.
- Reprioritization requires meetings or messages instead of a single drag gesture.
- End-of-day reporting is manual.

### Solution

A multi-user web app with:

- Cross-team dashboard with drag-and-drop prioritization
- Team-scoped views for day-to-day management
- Daily report: completed today + top tasks for tomorrow
- Projects registry (initially sparse)
- Role-based permissions with admin-only cross-team edit

### Success metrics (MVP)

| Metric | Target |
|--------|--------|
| Leadership daily active use | Marek + Ivan + CEO office ≥ 5 days/week |
| Task freshness | ≥ 80% of active tasks updated within 7 days |
| Time to reprioritize | < 10 seconds (drag, no modal) |
| Daily report generation | < 2 seconds, zero manual copy-paste |

---

## 2. User roles and permission model

### Roles

| Role | Slug | Who | Capabilities |
|------|------|-----|--------------|
| **Admin** | `admin` | Marek, Ivan only | Full read/write all teams; cross-team reprioritize; manage users/teams; configure integrations |
| **Executive viewer** | `executive` | CEO office staff | Read all teams; comment; cannot reprioritize other teams |
| **Team lead** | `team_lead` | Department heads | CRUD tasks in own team; reprioritize own team; view other teams read-only |
| **Team member** | `member` | Individual contributors | CRUD assigned tasks in own team; cannot change global/cross-team priority |
| **Viewer** | `viewer` | Optional stakeholders | Read-only within assigned teams |

### Permission matrix

| Action | admin | executive | team_lead | member | viewer |
|--------|:-----:|:---------:|:---------:|:------:|:------:|
| View cross-team dashboard | ✓ | ✓ | ✓ | ✓* | ✓* |
| View team detail | ✓ | ✓ | own + read others | own | assigned |
| Create task (own team) | ✓ | — | ✓ | ✓ | — |
| Edit task (own team) | ✓ | — | ✓ | own assigned | — |
| Reprioritize (own team) | ✓ | — | ✓ | — | — |
| **Reprioritize (other teams)** | **✓** | — | — | — | — |
| Manage projects | ✓ | — | ✓ | — | — |
| Manage users/roles | ✓ | — | — | — | — |
| View daily report (all teams) | ✓ | ✓ | own team | own team | own team |
| Integration settings | ✓ | — | — | — | — |

\*Members/viewers see dashboard in read-only mode; scope configurable per team.

### Enforcement

- **Database:** Supabase Row Level Security (RLS) policies on every table.
- **API:** Next.js route handlers validate role + team membership before mutations.
- **UI:** Hide/disable controls client-side; never rely on UI alone.

### Assumptions

- Single organization (Elixir); multi-tenant schema optional for future.
- Auth via Microsoft SSO (Azure AD) in production; email/password acceptable for MVP dev.
- Business timezone: **America/New_York** (EST/EDT).

---

## 3. MVP feature list

### P0 — Must ship

1. **Authentication** — Supabase Auth; invite-only signup.
2. **Cross-team dashboard** — All teams' top tasks in one view; read-optimized cards.
3. **Team task views** — Filtered board per department.
4. **Drag-and-drop prioritization** — `@dnd-kit` sortable lists; optimistic updates.
5. **Open tasks panel** — Tasks with status `open` or unranked backlog.
6. **Task CRUD** — Title, description, status, assignee, team, due date, project (optional).
7. **Daily report** — Completed today (by `completed_at`); top 5–10 for tomorrow.
8. **Projects section** — List/create projects; link tasks; empty state OK.
9. **Admin cross-team reprioritize** — Marek/Ivan only; audit log entry per change.
10. **Realtime sync** — Supabase Realtime on `tasks` for multi-user freshness.

### P1 — Should ship in MVP if time allows

11. Task comments ( lightweight ).
12. Keyboard shortcuts for power users.
13. Export daily report to PDF / copy markdown.
14. Activity feed on task (status changes, reprioritize).

### Out of MVP scope

- Asana / Microsoft bi-directional sync (Phase 2)
- Custom domain / production SSO hardening (post-MVP structure)
- Mobile-native app (responsive web is sufficient)
- Time tracking

---

## 4. Phase 2 feature list

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | **Asana integration** | Import projects/tasks; optional one-way sync |
| 2 | **Microsoft 365** | Azure AD SSO; Outlook calendar due-date hints; Teams notifications |
| 3 | **SharePoint / Excel import** | One-time migration from legacy sheets |
| 4 | **Scheduled daily report email** | Auto-send to CEO office at 6 PM ET |
| 5 | **Executive annotations** | Leadership notes on tasks without editing team fields |
| 6 | **Custom dashboards** | Saved filters (e.g. "Q3 initiatives only") |
| 7 | **Webhook / API for automation** | n8n, Zapier-style internal hooks |
| 8 | **Advanced analytics** | Throughput, aging, blocked tasks |

---

## 5. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | Dashboard LCP < 2.5s on office network |
| Availability | 99.5% (Supabase + Vercel SLA) |
| Security | RLS, HTTPS, secrets in env; no PII beyond names/emails |
| Accessibility | WCAG 2.1 AA for core flows |
| Audit | `activity_log` for priority changes and admin actions |

---

## 6. Open questions

1. Exact team list at launch (Engineering, Ops, Finance, …)?
2. Can team leads see other teams' **full** task detail or summary only?
3. Max tasks on executive dashboard per team (top 5 vs all)?
4. Definition of "open task" vs "prioritized backlog" — mutually exclusive?

---

## 7. Meeting transcript → requirements traceability

| Meeting statement | Requirement ID |
|-------------------|----------------|
| Highly visual, polished, executive-readable | NFR UX; design system in `UI_UX_RECOMMENDATIONS.md` |
| Consolidate Excel / Asana | MVP dashboard + Phase 2 integrations |
| Keep drag-and-drop / open-task behavior | MVP #4, #5 |
| Multiple users, cloud, dynamic updates | MVP #1, #10 |
| Daily report + next-day top tasks | MVP #7 |
| Projects section (can be empty) | MVP #8 |
| Cross-department view + reprioritize | MVP #2, #9 |
| Only Marek and Ivan admin over other teams | Roles `admin`; MVP #9 |
| Integrations phase 2 | Phase 2 #1–#3 |
| Domain/deployment after MVP structure | Deployment section in `ARCHITECTURE.md` |
