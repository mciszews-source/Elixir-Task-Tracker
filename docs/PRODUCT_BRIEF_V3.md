# Elixir Task Tracker — Product Brief v3 (Executive Command Center)

**Supersedes:** extends `PRODUCT_SPEC_V2.md` (which stays valid for the base tracker). This brief covers the next expansion: department depth, executive overview, events, Asana, transcript ingestion, and suggestions.
**North star (unchanged):** a polished, visual dashboard leadership uses to understand the state of the organization — priorities, progress, blockers, and where to intervene — with global edit control restricted to approved admins, and external tools (Asana first) feeding into it.

---

## 1. Structured product brief

### 1.1 The one-sentence product
A branded executive command center where every department's people, priorities, events, and imported work are visible at a glance, and where leadership can reprioritize anything — while the system helps route new work (from meetings, Asana, or ideas) to the right department, owner, and priority.

### 1.2 Requirements restated (normalized)

| ID | Requirement | Type |
|----|-------------|------|
| A1 | Login page uses the brand **logo mark** (from the brand guide PDF), not the text "ELIXIR MD INC" | Branding |
| A2 | Logo is subtly interactive (hover/motion), premium not gimmicky | Branding |
| B1 | Department page shows its **members** | Dept structure |
| B2 | Departments are flexible: members can be added/moved easily | Dept structure |
| B3 | Opening a department answers: who's in it, what they're working on, what the priorities are, what's changing | Dept structure |
| C1 | Executive overview shows org-wide activity: busy teams, key priorities, blockers, overdue, "most important right now" | Exec view |
| C2 | Overview signals where leadership should intervene / insert directives | Exec view |
| D1 | Priorities highly visible; drag/reorder plus explicit "more/less important" affordances | Priorities |
| D2 | Cross-team reprioritization workflow that's visually clean | Priorities |
| E1 | Asana priority tasks imported **once daily** | Integration |
| E2 | Imported tasks clearly badged, folded into team boards, reorderable locally | Integration |
| F1 | Remove "CEO Office" department | Dept changes |
| F2 | Rename "Engineering" → "R&D" | Dept changes |
| F3 | Ensure departments: R&D, Clinical, Regulatory (+ `+` add button — **already shipped** in the TabBar) | Dept changes |
| G1 | Important-events tracker: milestones, deadlines, external/internal events on a timeline | Events |
| H1 | Paste a meeting transcript → extract action items → map to departments/owners/priorities → review → publish to boards | Ingestion |
| I1 | Suggestions: likely department, assignee, priority, and whether an item is project/event/daily-ops | Suggestions |

---

## 2. Information architecture & navigation

### 2.1 IA (proposed)

```
/                        → Executive Overview  (the new default landing for admin/executive)
/teams/[slug]            → Department page: TabBar (existing) + 3 tabs inside:
                             • Board      (existing tracker — tasks, add row, stats, EOD)
                             • People     (members in this department, add/remove/move)
                             • Activity   (what changed recently — reprioritizations, completions, imports)
/projects                → Projects (existing; phases land per PRODUCT_SPEC_V2)
/events                  → Important Events timeline
/inbox                   → Triage inbox (transcript-extracted + Asana-imported items pending review)
/reports/daily           → Daily report (existing)
/admin/users             → Team access (existing; gains Pending approvals per PRIORITY_RESET_PLAN)
/login                   → Branded logo login (A1/A2)
```

### 2.2 Navigation structure
- **Sidebar** (exists): Departments list → add **Overview** at top (admin/executive only), then Departments, then Tools: Events, Inbox (with pending-count badge), Projects, Daily Report, Team Access.
- **Horizontal TabBar** (exists): stays as the department switcher on `/teams/*`.
- **Header segment control** (exists): Departments / Projects — add **Overview** as a third segment for admins.
- Everything stays inside the existing Elixir token system (`globals.css`) — no new visual language.

### 2.3 How each concept is represented

| Concept | Representation |
|---|---|
| Department | Existing team + tab; dept page gains People/Activity tabs. Color accent per dept (already in `teams.color`). |
| Team member | Avatar-chip row on the People tab; assignee chip on task rows (initials circle, dept-colored ring). |
| Priority | Existing chip + left stripe (kept) **plus** an "Escalate ↑ / Deprioritize ↓" pair in the row actions and a "Executive priority" star that pins a task to the top of the overview. |
| Imported (Asana) task | Row badge `ASANA` (aqua `--elixir-aqua` tint, same shape as the `EWAN` tag) + "last synced" tooltip. Source field already exists (`external_source`). |
| Transcript-derived task | Row badge `MEETING` (slate tint) until approved; lives in `/inbox` first, never lands on a board unreviewed. |
| Event | Timeline card on `/events`: date-block on the left (big day number, small month — Montserrat), title, dept chips, countdown pill ("in 12 days" / red "3 days overdue"). Next-3 events also surface as a strip on the Executive Overview. |
| Suggestion | Ghost chips ("R&D? · Max? · High?") on inbox items — click to accept, or override via the branded selects. Never auto-applied. |

---

## 3. New screens / modules

| # | Screen/Module | What it contains | New or change |
|---|---|---|---|
| S1 | **Login logo** | Logo mark (SVG from brand guide) replacing corner text; subtle hover response (e.g. slow sheen/scale 1.02 + letter-spacing ease on the wordmark beneath). Same treatment reused in the sidebar header. | Change |
| S2 | **Executive Overview** (`/`) | Per-dept summary cards: open/critical/overdue counts, top-3 priorities, workload bar (open tasks vs 7-day completions), blocked/stale flag ("no activity in 5 days"), "needs attention" ranking. Row of next events. Global "Top priorities right now" list (executive-starred + critical across all teams) with cross-team drag-reorder. | New |
| S3 | **Department People tab** | Member list w/ role, add-member (from existing users), remove, move-to-other-dept. Assignee filter for the board. | New |
| S4 | **Department Activity tab** | Feed from `activity_log` (already in schema): created/completed/reprioritized/imported, with actor + timestamp. | New (schema exists) |
| S5 | **Events tracker** (`/events`) | Timeline list (upcoming/past), add/edit/delete events (admin), event types (milestone/deadline/external/internal), link to dept and/or project. | New |
| S6 | **Triage Inbox** (`/inbox`) | Pending items from transcripts + a review lane for daily Asana imports. Each item: suggestion chips, approve→board, edit, discard. Badge count in sidebar. | New |
| S7 | **Transcript ingestion** | "New from transcript" button on Inbox → paste transcript (or upload .txt/.docx) → server extracts action items → items appear in Inbox with suggestions. | New |
| S8 | **Asana daily sync** | Cloudflare Worker cron trigger (once daily) pulling prioritized Asana tasks per configured workspace/project mapping → upsert into `tasks` with `external_source='asana'`. Admin settings panel for the mapping + PAT. | New |
| S9 | **Assignee on task rows** | Add assignee chip + assignee select in add-row/edit-row (schema already has `assignee_id`). | Change |
| S10 | **Reprioritize affordances** | Escalate/deprioritize buttons (single-click priority bump), executive star, cross-team reorder on Overview. | Change |

---

## 4. Data model changes (migrations `005+`)

Already in schema and reusable as-is: `team_members`, `tasks.assignee_id`, `tasks.external_id/external_source`, `activity_log`, `integration_provider` enum (`asana`, `microsoft`).

```sql
-- 005_departments_reshape.sql
--  F1/F2/F3: remove CEO Office, rename Engineering→R&D, ensure Clinical + Regulatory
DELETE FROM teams WHERE slug = 'ceo-office';                     -- cascades tasks
UPDATE teams SET name = 'R&D', slug = 'rnd' WHERE slug = 'engineering';
INSERT INTO teams (name, slug, color, sort_order) VALUES
  ('R&D',        'rnd',        '#4A78C4', 7),
  ('Clinical',   'clinical',   '#3DB87A', 8),
  ('Regulatory', 'regulatory', '#E8A840', 9)
ON CONFLICT (slug) DO NOTHING;

-- 006_events.sql
CREATE TYPE event_kind AS ENUM ('milestone','deadline','external','internal');
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  detail TEXT DEFAULT '',
  kind event_kind NOT NULL DEFAULT 'milestone',
  event_date DATE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: read all authenticated; write admin/executive only.

-- 007_triage.sql
CREATE TYPE triage_status AS ENUM ('pending','approved','discarded');
CREATE TYPE triage_source AS ENUM ('transcript','asana','manual');
CREATE TABLE triage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source triage_source NOT NULL,
  status triage_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  detail TEXT DEFAULT '',
  -- suggestions (nullable — filled by heuristics/AI, editable by reviewer)
  suggested_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  suggested_assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  suggested_priority task_priority,
  suggested_bucket TEXT,             -- 'task' | 'project' | 'event'
  suggested_due DATE,
  transcript_id UUID,                -- groups items from one transcript
  raw_context TEXT,                  -- the transcript excerpt that produced it
  approved_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 008_task_extras.sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_executive_priority BOOLEAN NOT NULL DEFAULT false;  -- the "star"
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;                             -- Asana freshness

-- 009_integration_settings.sql  (admin-only via RLS; PAT lives in a Worker secret, NOT here)
CREATE TABLE integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider integration_provider NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  external_ref TEXT NOT NULL,        -- Asana project/section GID mapped to this team
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, team_id, external_ref)
);
```

No changes needed to `tasks` sort/priority mechanics — the existing `sort_order` numeric-gap approach handles all reprioritization cases including cross-team pinning (executive star is a boolean + overview sorts starred-first).

---

## 5. Architecture / integration implications

### 5.1 Asana daily sync (E)
- **Mechanism:** Cloudflare Worker **cron trigger** (add `"triggers": {"crons": ["0 11 * * *"]}` to `wrangler.jsonc` ≈ 6am ET) → OpenNext exposes a scheduled handler → calls an internal sync route with a service token.
- **Flow:** for each enabled `integration_settings` row → Asana REST (`GET /projects/{gid}/tasks?opt_fields=name,due_on,assignee,memberships.section.name,completed`) with a **PAT stored as a Worker secret** (`ASANA_PAT`) → upsert into `tasks` keyed on `external_id = 'asana:<gid>'` (the same idempotency pattern as the prototype seed) → set `external_source='asana'`, `last_synced_at=now()`, priority mapped from Asana section/custom-field or defaulted to `medium` for review.
- Local reorders/priority changes are **not** overwritten by sync (only title/due/completed refresh) — the dashboard stays the priority source of truth, per the product goal.
- Phase 3 of the v2 spec (per-user OAuth, two-way) stays parked; PAT + one-way daily is the v1.

### 5.2 Transcript ingestion (H) — assisted, reviewer-in-the-loop
- **Route:** `POST /api/ingest/transcript` (admin-only). Server-side call to the **Claude API** (`@anthropic-ai/sdk`, model `claude-opus-4-8`) using **structured outputs** (`client.messages.parse()` with a zod schema: `{items: [{title, detail, suggested_team_slug, suggested_owner_name, suggested_priority, suggested_bucket, suggested_due, quote}]}`) so the response is guaranteed-parseable. The prompt includes the current team list + member roster so suggestions map to real slugs/people.
- Results land in `triage_items` (`source='transcript'`) → Inbox → human approves/edits/discards. Nothing auto-publishes.
- Long transcripts: single call is fine (1M context); no need for chunking at meeting-transcript sizes.
- Secret: `ANTHROPIC_API_KEY` as a Worker secret. Cost is negligible at "a few transcripts a week" volume; if it ever becomes daily-batch at scale, move to the **Batches API** (50% price) since latency doesn't matter.

### 5.3 Suggestions (I) — heuristics first, AI second
- **v1 (no AI):** deterministic scoring in `src/lib/suggest.ts`: keyword→team map (seeded from each team's existing task titles), name-mention→assignee (roster match), priority from urgency words + due-date proximity, bucket from shape ("by Friday"→task, "launch/submission/conference"→event, matches project name→project). Runs on every triage item, instant and free.
- **v2:** same interface, backed by the transcript-extraction model call (it already returns suggestions) and optionally a nightly re-rank. The UI never changes — suggestions are chips regardless of engine.

### 5.4 Logo asset (A)
- The brand guide is a PDF (`docs/Elixir MD INC Brand Guide_IP-compressed.pdf`). I need the **logo mark as SVG** (or high-res PNG with transparency) — either exported from the brand guide by Marek/designer, or I extract the vector from the PDF page. Once in `public/brand/logo-mark.svg`, the login + sidebar swap is trivial and the hover treatment is pure CSS (no library).

### 5.5 What this does NOT change
- Auth flow, RLS model, deploy pipeline, design tokens — all stay. Every new surface composes existing primitives (`glass-panel`, `elixir-popover`, `elixir-pill`, `elixir-btn`, chips).

---

## 6. MVP vs Phase 2 · manual-first vs automated-later

| Feature | MVP (build now) | Phase 2 (later) |
|---|---|---|
| A. Logo | SVG mark + CSS hover on login & sidebar | Animated brand moment (draw-in on load) |
| B. Departments | People tab (add/remove/move members), assignee chips on rows | Per-member workload view, capacity hints |
| C. Overview | Dept summary cards + top-priorities list + events strip | Trend sparklines, week-over-week deltas |
| D. Priorities | Escalate/deprioritize buttons, executive star, cross-team list reorder | Priority-change history & "changed by Ivan" attributions surfaced on rows (data already in activity_log) |
| E. Asana | **Manual first:** admin "Sync now" button hitting the same sync route | **Automated later:** the cron trigger — flip on once mapping is validated |
| F. Dept changes | Migration 005 (remove/rename/add) — pure SQL, ship immediately | — |
| G. Events | CRUD + timeline + overview strip | Calendar view, reminders in daily report |
| H. Transcripts | **Manual first:** paste → extract → review inbox | **Automated later:** email-in / recording-tool webhook ingestion |
| I. Suggestions | **Manual-first heuristics** (`suggest.ts`) | AI-backed suggestions + learn-from-corrections |

**Coherence rule:** every feature enters through one of three existing shapes — a **board row** (tasks), a **glass card** (overview/projects/events), or a **popover** (pickers/dialogs). Nothing gets its own visual system. The Inbox is the single funnel for anything entering from outside (meetings, Asana review, future sources) — that's what keeps it one product instead of a feature pile.

---

## 7. Recommended rollout order

Each step is independently shippable; order minimizes rework:

1. **F — Department reshape** (mig 005). Pure SQL, do first so everything after builds on the right teams. *~½ day incl. verifying tab bar.*
2. **A — Logo** (blocked on the SVG asset — request it from Marek now; the code slot is 1 hour once the file exists).
3. **B — People tab + assignee chips** (S3, S9). Uses existing `team_members`; makes departments feel real before the overview aggregates them. *~1 day.*
4. **C — Executive Overview** (S2) + **D — priority affordances** (S10). The centerpiece; lands once per-dept data is rich. *~1½ days.*
5. **G — Events** (mig 006 + S5 + overview strip). *~1 day.*
6. **Inbox shell + suggestions v1** (mig 007 + S6 + `suggest.ts`). Funnel exists before anything feeds it. *~1 day.*
7. **H — Transcript ingestion** (S7). Feeds the now-existing inbox. *~1 day.*
8. **E — Asana sync** (mig 009 + S8), manual "Sync now" first, then cron. Needs Asana PAT + project GIDs from Marek. *~1 day.*
9. **Phase 2 items** as demanded.

**Dependencies to request from Marek now (so nothing blocks):**
- Logo mark as SVG/transparent-PNG (or approval for me to extract from the brand guide PDF)
- Asana: a PAT + which Asana projects map to which departments
- Confirmation to hard-delete "CEO Office" (its seeded tasks cascade — or I can move them to another team first; say which)

---

## 8. Alignment check against the original goals

| Original goal | How this brief serves it |
|---|---|
| Visual dashboard for leadership | Overview is built around "where do I look / where do I act", not task dumps (C1/C2). |
| Easy to read, polished, operational | All new UI composes the existing token system; three shapes only (row/card/popover). |
| Understand priorities/progress/intervene | Priority affordances + activity feeds + needs-attention ranking. |
| Cross-team visibility & reprioritization | Overview reorder + escalate/star, propagating through existing sort_order machinery. |
| Connects to Asana etc. | One-way daily sync now, schema already future-proofed (`external_source`, `integration_settings`). |
| Only approved admins edit globally | All new write surfaces gate on the existing `admin`/`executive` roles + RLS; suggestions never auto-apply. |
