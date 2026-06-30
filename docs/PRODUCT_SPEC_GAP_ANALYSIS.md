# Product Spec v2 — Gap Analysis vs. Current Codebase

Map of every requirement in `docs/PRODUCT_SPEC_V2.md` against what's actually in the repo today. This is the working list — pick from §3 for the next round.

Status legend: ✅ done · 🟡 partial · ⚠️ different shape · ❌ missing

---

## 1. Meeting requirements (§1 of the spec)

| # | Requirement | Status | Where / notes |
|---|---|---|---|
| 1 | Visual, executive-friendly look | ✅ | `globals.css` token system + `UI_REFINEMENT_NOTES.md` — every control now matches the legacy aesthetic. |
| 2 | Multi-user | ✅ | Supabase auth + profiles; `/admin/users` for invites. |
| 3 | Cloud-hosted, persistent, live | 🟡 | Cloudflare Workers + Supabase Postgres ✅. **Realtime not wired** — UI uses React Query polling, not `supabase.channel()` subscriptions. CEO reprioritizing does NOT push live to team members today. |
| 4 | Real domain | 🟡 | Deploy pipeline ready (`.github/workflows/deploy-cloudflare.yml`), `NEXT_PUBLIC_APP_URL` is a build-time secret. DNS cut-over to the Elixir subdomain still pending Marek. |
| 5 | Keep the Daily Report (DOCX) | ⚠️ | We have an on-screen "completed today / top tomorrow" view at `/reports/daily` and an EOD text-brief copier in `EodStrip`. **No `.docx` export.** Spec says keep DOCX. |
| 6 | Keep Projects | 🟡 | `/projects` route exists with mock projects, but **no phases / docs / progress** — the legacy phase-checklist + per-phase doc attachments are not modeled in the DB or UI. |
| 7 | Admin can change everything | ✅ | `admin` and `executive` roles have full write via `permissions.ts`. |
| 8 | Existing open tasks must seed in | ❌ | No migration script. `supabase/seed.sql` only seeds teams. Real prototype data (`DEFAULT_TASKS`/`DEFAULT_PROJECTS` from `elixir-task-tracker_4.html`) is not imported. |
| 9 | Drag-to-reorder | ✅ | `@dnd-kit/sortable` in `team-tracker.tsx` + `sort_order` column. Persists. |
| 10 | CEO sees all departments, can re-prioritize | ✅ for read; 🟡 for live propagation | Sidebar lists every team; admin can open any team and reorder. Other users won't see the change until they reload (no realtime — same as #3). |
| 11 | Admin back-end / drill-down | 🟡 | `/admin/users` (user mgmt) + per-team pages exist. No single "all departments overview" page yet (the original `dashboard-client.tsx` is in the tree but not on the active route — `/` redirects to `/teams/<first>`). |
| 12 | Only Marek + Ivan edit everything; others "fixed" | ⚠️ | RLS in `001_initial_schema.sql` grants `admin` full access and lets team members edit their own team's tasks. Spec hints at **read-only for everyone else** ("for the other ones it should be fixed"). Needs a confirmation from Marek and then either tightening RLS or adding a `read_only_non_admin` toggle. |
| 13 | Phased external integrations (Asana / MS / Salesforce) | ⚠️ | Schema already carries `external_id` + `external_source` on `tasks` — wired for it. No connectors built (Phase 3). |
| 14 | Team menu drill-down | ✅ | Sidebar → click team → board. |
| 15 | Day-scale Phase 1 build | n/a | Phase 1 is essentially done; what remains is the spec gaps below. |

---

## 2. Prototype-spec parity (§2 of the spec)

### 2.1 Visual design
✅ Tokens, gradient, noise, glass, priority colors, fonts — all match (recent UI refactor explicitly mapped legacy → token names). Dot grid not implemented but optional — `.elixir-popover` and the rest of the chrome are aligned.

### 2.2 Information architecture
- Header brand + Departments/Projects segment + Daily Report button → ✅
- Header **Export / Import** buttons → ❌ (no JSON in/out today)

### 2.3 Departments view
| Sub-requirement | Status |
|---|---|
| Tab bar (dynamic, addable) | ⚠️ Sidebar list, not horizontal tabs. Teams come from DB but **no UI to add/rename/delete teams** without SQL. |
| Add-task row | ✅ Branded inputs/select/date/check, primary button. |
| Stats bar | ✅ |
| Task list — active first | ✅ |
| Completed-collapse section | ✅ — `showCompleted` toggle in `team-tracker.tsx`. |
| Priority stripe / chip | ✅ |
| "From Ewan" flag (`is_executive_request`) | ✅ |
| Drag-and-drop reorder | ✅ |
| Inline editing (name/date/priority/risk/flag) | ⚠️ Edit button calls `prompt()` for title only. No inline edit row with date/priority/risk/flag. |
| Custom date-picker popover (not native) | ❌ Native `<input type="date">` (themed but still native). `.elixir-popover` primitive is ready. |
| Per-tab collapsed-state persistence | ❌ `showCompleted` is in-memory only. |

### 2.4 Projects view
| Sub-requirement | Status |
|---|---|
| Project tabs (Astral X / Clear / EVA 3D) | 🟡 Mock list, no tabs. |
| Phases with done toggle | ❌ Not in schema. |
| Add/delete phases | ❌ |
| Attach/remove docs | ❌ |
| Progress subtitle ("X of Y phases complete") | ❌ |

### 2.5 Daily Report
| Sub-requirement | Status |
|---|---|
| `.docx` export | ❌ |
| Completed-today + Top-3-tomorrow content | 🟡 On screen ✅; in DOCX ❌. |
| Per-user/per-team scope picker for admins | ❌ |

### 2.6 Import / Export
| Sub-requirement | Status |
|---|---|
| Export full JSON | ❌ |
| Import JSON | ❌ |

### 2.7 Data model migration
Prototype → Supabase mapping is mostly clean (`name` → `title`, `risk` → `description`, `fromEwan` → `is_executive_request`, `deadline` → `due_date`, `done` → `status='done'`, `completedAt` → `completed_at`). **No migration script** that reads the legacy JSON (or the inline `DEFAULT_TASKS`/`DEFAULT_PROJECTS` in `elixir-task-tracker_4.html`) and inserts it.

---

## 3. Target architecture (§3 of the spec)

| Item | Status |
|---|---|
| Next.js + TS + Tailwind | ✅ |
| Supabase Postgres + Auth + RLS | ✅ (RLS in `001_initial_schema.sql` + `002_executive_flag_and_admin_policies.sql`) |
| Supabase Realtime subscriptions | ❌ |
| Auth (magic link) | ✅ (audited + fixed in PR #11 — token_hash-based callback, instant-link bootstrap path) |
| Google Workspace SSO option | ❌ (open question for Marek) |
| DOCX generator | ❌ |
| Hosted (Cloudflare Workers via OpenNext) | ✅ |
| Custom subdomain | 🟡 ready; DNS pending |
| Roles `super_admin` / `manager` / `member` / `viewer` | ⚠️ implemented as `admin` / `executive` / `team_lead` / `member` / `viewer`. Functionally equivalent if we treat `admin` ≡ super_admin and pin Ivan + Marek to it. |

### Schema delta vs. spec §3.3

| Spec column | Current | Note |
|---|---|---|
| `tasks.name` | `tasks.title` | Cosmetic. |
| `tasks.risk` | `tasks.description` | Cosmetic. |
| `tasks.from_ewan` | `tasks.is_executive_request` | Cosmetic. |
| `tasks.deadline` | `tasks.due_date` | Cosmetic. |
| `tasks.done` | `tasks.status='done'` + `completed_at` | Richer than spec — keep. |
| `tasks.sort_order int` | `numeric` (gap-spaced) | More flexible than `int`. Keep. |
| `project_phases`, `phase_docs` | missing | **Needed for §2.4 Projects.** |
| `tasks.assignee_id` | ✅ | |
| `tasks.external_id`, `external_source` | ✅ (phase-3 ready) | |

---

## 4. Acceptance criteria (§5 of the spec)

| # | Criterion | Status |
|---|---|---|
| 1 | Multi-user, cloud persistence | ✅ |
| 2 | Prototype data imported | ❌ |
| 3 | Visual design faithful | ✅ |
| 4 | Drag-reorder + completed-collapse + **custom date picker** | 🟡 (custom date picker ❌) |
| 5 | Edit gating: admin vs others | 🟡 (depends on whether members lose write — see §1 row 12) |
| 6 | CEO reprioritizes → team member sees live | ❌ (realtime missing) |
| 7 | Daily DOCX report, scoped per user/team | ❌ |
| 8 | Deployed at Elixir subdomain over HTTPS | 🟡 (worker live, custom domain pending) |

---

## 5. Recommended next round — prioritized

In rough effort × impact order. Each is bite-sized and shippable on its own.

1. **DOCX daily report endpoint** (meeting req #5; acceptance #7) — server route at `/api/reports/daily/docx?scope=…` using the `docx` npm package. Reuse the data shape already in `/api/reports/daily`. Add a download button + a scope picker to `/reports/daily`. *~½ day.*
2. **JSON import / export** (meeting req #6/§2.6; acceptance #2) — `/api/admin/export` (admin-only) emits the full snapshot; `/api/admin/import` accepts it and upserts via service role. Header buttons in admin area. *~½ day.*
3. **Legacy data migration script** (meeting req #8; acceptance #2) — `scripts/seed-from-prototype.ts` reads either the prototype's JSON export OR the inline `DEFAULT_TASKS`/`DEFAULT_PROJECTS` arrays in `elixir-task-tracker_4.html`, maps to current schema, and bulk-inserts via service role. *~1 day.*
4. **Supabase Realtime subscriptions** (meeting req #3/#10; acceptance #6) — wire `supabase.channel('tasks:team_id=eq.<id>')` in `team-tracker.tsx`; invalidate the React Query cache on change events. *~½ day.*
5. **Custom date picker** (§2.3; acceptance #4) — build `<DatePickerPopover>` on top of the existing `.elixir-popover` + `.elixir-menuitem` primitives; matches the legacy `.cal-box` calendar pixel-for-pixel. Replaces every `elixir-date` input. *~½ day.*
6. **Projects v2 — phases + docs** (§2.4) — schema migration (`project_phases`, `phase_docs`), `/projects/[slug]` route, phase row component, doc attach form. *~1 day.*
7. **Inline task editing** (§2.3) — replace `window.prompt` with an inline edit row in `ElixirTaskRow` (name + date + priority + risk + Ewan flag). The CSS state hooks (`.editing`) already exist in tokens. *~½ day.*
8. **Cross-team admin overview** (meeting req #11) — repurpose `dashboard-client.tsx` as `/admin/overview`, gate to `admin`/`executive` only, show all teams + open-tasks panel side-by-side. *~½ day.*
9. **RLS tightening for "members are fixed"** (meeting req #12) — requires Marek's confirmation. If confirmed: drop `team_members.can_edit`-style write paths for `member` and `viewer`; UI already hides edit affordances based on `permissions.ts`. *~¼ day after confirmation.*
10. **Custom-domain DNS cutover** (meeting req #4) — coordinated with Marek when he's ready to point IONOS at the worker.

Phase 3 (Asana / Microsoft / Salesforce) stays parked until 1–9 are signed off, per the meeting.

---

## 6. Open questions Marek should answer (mirror of spec §6)

- Is `member` fully read-only, or does each member edit their own team's tasks? Current code allows the latter; spec hints at the former.
- Confirm the canonical roster + roles. Pin Ivan and Marek as `admin` (super_admin).
- Which Elixir subdomain? Who at IONOS provides DNS? `NEXT_PUBLIC_APP_URL` is a build-time secret — every change requires a redeploy.
- Magic-link only, or add Google Workspace SSO?
- Daily report default scope: per-user, per-team, or company-wide?
- Are `ewan` / `max` / `marek_jr_` individuals' boards or department boards? The current schema models them as `teams` with no per-person split — fine if everyone in a department shares a board, otherwise we need a `person_board` view.
