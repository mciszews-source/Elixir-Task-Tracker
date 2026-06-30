# Elixir MD Inc — Company Task Tracker v2 (Cloud Edition)
## Build Prompt for Cursor / Claude

> **How to use this file:** Paste this entire document into Cursor (or Claude) as the opening prompt for a new project. It contains (1) the product vision from the stakeholder meeting, (2) a full reverse-engineered spec of the existing prototype, (3) the target architecture, and (4) a phased, copy-pasteable build plan. Start with **Phase 0** and work down. Do not skip the "Migration & Data Model" section — the existing prototype already has real production data that must import cleanly.

---

## 0. TL;DR — What We're Building

We have a working single-file HTML prototype: a glassmorphic "Daily Task Tracker" for **Elixir MD Inc** that currently runs only in one person's browser via `localStorage`. The CEO (Ivan/Iwan) is a highly visual person who won't use Excel or Asana — he wants a beautiful, easy-to-read dashboard.

**The job:** Turn this single-user, browser-only prototype into a **multi-user, cloud-hosted web app** with:
- Real authentication + persistent cloud database (replaces `localStorage`)
- **Role-based access control**: only **Marek (Marek Jr.)** and **Ivan** can edit everything; everyone else is largely read-only / scoped to their own team
- A **CEO/admin back-end** where Ivan can view every department + every individual's tasks and re-prioritize any team's work
- Keep the existing look, drag-to-reorder, daily DOCX report, projects view, and import/export
- Deploy to a real domain (an existing Elixir subdomain, e.g. `dash.<elixir-domain>` — DNS access will be provided)
- **Future (Phase 2+, not now):** integrate external task sources — **Asana** (Hayden/Johnny/marketing), **Microsoft tools** (Eric's team), and **Salesforce** — so external tasks flow into the dashboard automatically

Build it framework-based and cloud-native from the start, but **preserve the visual design and data model** of the existing prototype.

---

## 1. Context from the Stakeholder Meeting

Direct requirements extracted from the meeting transcript (Marek Jr. + the prototype's author):

1. **Why it exists:** Ivan is "a very visual person." Other managers use Excel (Eric) or Asana (Johnny), "but Ivan will never look at this. He wants it to look nice and be easy to read." The dashboard is the readable layer on top of everyone's work.
2. **Make it everyone's tool:** Today it "only works for me." Goal: "a tool that everyone can use... it just works for everyone." → multi-user.
3. **Cloud + live:** "something that lives in the cloud, and it changes" (real-time/persistent, not a local file).
4. **Domain required:** "if you want more than one person to access it, you need a domain." An existing Elixir subdomain will be reused; DNS/registrar access (IONOS mentioned) will be provided.
5. **Keep the Daily Report:** "the daily report... when you finish all tasks in that day, it automatically writes you a report about these tasks you've done, and the top tasks for the next day. I want this to stay." (Already implemented as DOCX export — keep & improve.)
6. **Keep Projects:** Projects view "has project in here... have it in there as well." Must remain and stay fully editable.
7. **Everything must be editable** by the admins: "I have to be able to change everything, as always."
8. **Open tasks stay:** Existing open tasks "should stay for now." Import the current data as the seed.
9. **Keep drag-to-reorder:** "I like this because you can drag it." Manual ordering matters because it expresses priority.
10. **Cross-department visibility for the CEO:** Ivan "can see the tasks from all departments." He can look at e.g. the Marketing team's list and say "this one I want done first," and re-order/re-prioritize it for Johnny. Johnny then sees the updated priority. → **CEO can re-prioritize any team's tasks; team members see the changes.**
11. **Back-end for the CEO's office:** "this website to be the back end, especially for the CEO's office, where he could go into every individual person's organization... and change the priorities for their teams if necessary," or just observe what's going on across teams.
12. **Admin control (critical):** "only me [Marek] and Iwan should be able to edit it. For the other ones it should be fixed. So there should be an admin control and just you and [Ivan] will have it."
13. **Phased external integrations:** "build it first, then we can toggle." Connect **Asana** (need each person's Asana access — tasks flow straight into the dashboard), **Microsoft** tools (Eric/support), and **Salesforce** later. "Step by step, we can sit again after you've done the first part."
14. **Team menu / drill-down idea:** "a team menu down here. And then when you press the team, it pops up to that." (Navigate by team, drill into a team's board.)
15. **Effort estimate from author:** building the cloud version was estimated at "probably about a day" for the original author — scope is intentionally tight for Phase 1.

> Note on names: the transcript renders the CEO as both "Ivan" and "Iwan/Iwan" and "Saskia" (likely auto-transcription noise). Treat **Ivan** as the CEO/super-admin. Confirm exact spellings with Marek before going live.

---

## 2. The Existing Prototype — Full Reverse-Engineered Spec

**File:** `elixir-task-tracker_4.html` — a single self-contained HTML file (~3,600 lines). Vanilla JS, no framework. Persists to `localStorage`. The bottom ~2,400 lines are bundled libraries (a Buffer polyfill + JSZip) used to generate the `.docx` daily report client-side.

### 2.1 Branding & Visual Design (MUST PRESERVE)
- **Title:** `ELIXIR MD INC — Daily Task Tracker v2.1`
- **Fonts:** Google Fonts — `Montserrat` (300–700) for headings/labels, `Inter` (300–600) for body.
- **Aesthetic:** Glassmorphism — frosted translucent cards (`rgba(255,255,255,0.08)` fills, `backdrop-filter: blur(...)`, subtle white borders), on a diagonal navy→blue→steel gradient background with a faint SVG fractal-noise texture overlay and an animated dot grid.
- **Color tokens (CSS `:root`):**
  ```css
  --navy:#21264C; --slate:#8598B1; --white:#fff;
  --red:#E8495A; --amber:#E8A840; --green:#3DB87A; --blue-mid:#4A78C4;
  ```
- **Background gradient:** `linear-gradient(135deg,#212F59 0%,#293D85 30%,#1D569D 60%,#5E7080 85%,#8EB8D4 100%)`
- **Priority left-border colors on cards:** critical=red, high=amber, medium=blue-mid, low=green.

### 2.2 Information Architecture
- **Header:** brand mark "ELIXIR MD INC" (left); a pill toggle **DEPARTMENTS / PROJECTS** (center); date display + buttons **📄 DAILY REPORT**, **⬇ EXPORT**, **⬆ IMPORT** (right).
- **Two top-level views:**
  1. **Departments view** — a dynamic tab bar of departments/people, each tab showing a task board.
  2. **Projects view** — project tabs (Astral X, Clear, EVA 3D), each a phased checklist with attachable docs.

### 2.3 Departments View
- **Tabs (default):** `operations`, `marketing`, `sales`, `ewan`, `max`, `marek_jr_`. Tabs are user-editable: add via `+` (prompts for name → slugifies to a key), delete via an inline `×` on the active tab (confirms if it has tasks). Tab order and set persist to `localStorage` key `elixir_tabs_v1`.
- **Each tab = a task board** with:
  - An **add-task row**: name input, "risk/notes" input, priority `<select>` (Critical/High/Medium/Low), a custom **date picker** (popover calendar, not native), an optional "from Ewan" checkbox, and an **+ ADD TASK** button.
  - A **stats bar** (count pills by status/priority).
  - A **task list** of cards. Active tasks shown first; **completed tasks** collapse into a toggle section (collapsed state stored per-tab).
- **Task card** shows: priority color stripe, name, risk/notes, deadline (formatted e.g. "Jun 7"), a "from Ewan" flag, done checkbox, edit, delete, and up/down move controls.
- **Drag-and-drop reorder** within a board (HTML5 drag events; reorders the underlying array; `.dragging` / `.drag-over` styles). Disabled while editing or for done tasks.
- **Inline editing**: clicking edit turns a card into an editable row (name, date, priority, risk, fromEwan), with save/cancel.
- **Sorting helper** `sortByP()` sorts by priority order `['critical','high','medium','low']` (used after priority change), but manual drag order is otherwise respected.

### 2.4 Projects View
- **Project tabs:** `astralx` (✦ Astral X), `clear` (◎ Clear), `eva3d` (⬡ EVA 3D).
- Each project = an ordered list of **phases**. Default phase template per project: `Market Research, Market Feedback, Load Design, CAD Design 1/2/3, Cost of Prototype, Presentation 1/2, IP / Legal` (EVA 3D omits Market Research).
- Each **phase**: `{ id, name, done, docs:[] }`. Toggle done, add/delete phases, and attach/remove **docs** (a doc has a name + URL; rendered as links). A progress subtitle shows "X of Y phases complete."
- Persists to `localStorage` key `elixir_projects_v1`.

### 2.5 Daily Report (MUST KEEP)
- Button generates a **Microsoft Word `.docx`** entirely client-side (loads a base64 DOCX template into JSZip, swaps `word/document.xml`).
- Current content: title "DAILY OPERATIONS REPORT" + long date; then for the **Max** board: a **✓ Completed** section (all done tasks) and a **🎯 Top 3 Priorities for Tomorrow** section (first 3 active tasks). Filename `Elixir-Daily-Report-YYYY-MM-DD.docx`.
- Has a guard that alerts if no tasks are loaded for Ewan/Max.
- **Improve in v2:** make the report per-user/per-team (driven by who's logged in or a selected scope), include completed-today (using `completedAt` timestamps) rather than all-time done, and let admins generate a report for any team/person.

### 2.6 Import / Export
- **Export** → downloads a JSON snapshot of all tasks/meta. **Import** → reads a `.json` file and restores state. **Keep this** as a backup/migration path even after moving to the cloud.

### 2.7 Data Model (current, in `localStorage`)

```js
// localStorage keys
'elixir_tasks_v1'     // { [deptKey]: Task[] }
'elixir_meta_v1'      // { nextId, completedCollapsed: { [deptKey]: bool } }
'elixir_tabs_v1'      // string[] of department keys
'elixir_projects_v1'  // { [projKey]: Phase[] }

// Task
{
  id: number,            // unique, monotonic (current nextId starts at 80)
  name: string,
  priority: 'critical'|'high'|'medium'|'low',
  deadline: string,      // 'YYYY-MM-DD'
  risk: string,          // free-text "risk / notes"
  fromEwan: boolean,
  done: boolean,
  completedAt?: string   // ISO timestamp, present on some completed tasks
}

// Phase (projects)
{ id: string, name: string, done: boolean, docs: { name, url }[] }
```

**There is real seed data already in the file** (operations/marketing/sales/ewan/max/marek_jr_ boards with dozens of real tasks, and 3 projects). Phase 1 must import this verbatim as the initial cloud dataset.

---

## 3. Target Architecture (v2 Cloud Edition)

> Recommended stack — optimize for fast build, easy auth, real-time, and cheap hosting. If the team has a strong existing preference, swap equivalently, but justify it.

- **Frontend:** **Next.js (App Router) + TypeScript + Tailwind CSS**. Recreate the exact glassmorphic design system as Tailwind theme tokens + a few component classes. Use a component library only for primitives (e.g. Radix) — keep the custom visual identity.
- **State/data:** **Supabase** (Postgres + Auth + Row-Level Security + Realtime) — fastest path to multi-user with roles and live updates, and RLS maps cleanly onto the "only Marek & Ivan can edit everything" rule. (Alternative: Firebase Auth + Firestore.)
- **Auth:** Supabase Auth (email magic-link or Google SSO on the company Google Workspace if available). Each user has a profile row with `role` and `team`.
- **Realtime:** Supabase Realtime subscriptions so when the CEO re-prioritizes a team's task, the team member's board updates live (meeting requirement #10).
- **DOCX report:** keep client-side generation (port the existing JSZip approach) or move to a serverless route; either is fine.
- **Hosting:** Vercel (frontend) + Supabase (managed DB). Point the existing Elixir subdomain (e.g. `dash.<elixir-domain>`) at Vercel via DNS (IONOS). DNS access to be provided by Marek.
- **Env/secrets:** `.env.local`; never commit keys. Document required vars in README.

### 3.1 Roles & Permissions (CRITICAL — meeting #11, #12)
Define an enum and enforce with **Supabase RLS** (server-side, not just UI):
- `super_admin` — **Ivan (CEO)** and **Marek**. Full read/write on **everything**: all departments, all individuals, all projects, all settings. Can re-prioritize and reorder any team's tasks; can manage users/teams.
- `manager` *(optional, future)* — read all, write within own team(s).
- `member` — can read their own team board(s) and the cross-team read-only view the CEO has opted to share; **cannot edit** others. (Decide with Marek whether members can edit their own tasks or are fully read-only — meeting says "for the other ones it should be fixed.")
- `viewer` — read-only dashboard (for stakeholders who just watch).

UI must hide/disable edit, add, delete, drag, and priority controls for non-editors, **and** RLS must reject those writes server-side regardless of UI.

### 3.2 CEO / Admin Back-end (meeting #11, #14)
A dedicated admin area where a `super_admin` can:
- Browse a **team menu** → drill into any department or individual's board (requirement #14).
- See an **all-departments overview** (cross-team read view, requirement #10).
- **Re-prioritize / reorder** any team's tasks; changes propagate live to that team member.
- Manage users: invite, assign `role` + `team`.
- Generate the daily report for any scope.

### 3.3 Database Schema (Postgres / Supabase)

```sql
profiles      (id uuid pk = auth.uid, full_name, email, role, team, created_at)
teams         (key text pk, label, sort_order)          -- replaces 'elixir_tabs_v1'
tasks         (id uuid pk, team_key fk->teams, assignee_id fk->profiles null,
               name, priority, deadline date, risk, from_ewan bool,
               done bool, completed_at timestamptz null,
               sort_order int,                            -- manual drag order
               created_by, created_at, updated_at)
projects      (key text pk, label, icon, sort_order)
project_phases(id uuid pk, project_key fk, name, done bool, sort_order int)
phase_docs    (id uuid pk, phase_id fk, name, url)
```

- Keep `priority` as a constrained text/enum: `critical|high|medium|low`.
- `sort_order` (int, gap-spaced e.g. 10,20,30) preserves drag-and-drop ordering and lets the CEO reorder without renumbering everything.
- RLS policies: `super_admin` full access; others read-scoped to their `team` (+ any explicitly shared teams), write only per the rules above.

---

## 4. Phased Build Plan (do these in order)

### Phase 0 — Scaffold & Design System
- [ ] Init Next.js + TS + Tailwind. Add Montserrat + Inter via `next/font`.
- [ ] Port the exact color tokens, gradient, noise overlay, dot grid, and glass-card styles into Tailwind theme + global CSS. Build reusable `<GlassCard>`, `<TabBar>`, `<TaskCard>`, `<PriorityBadge>`, `<DatePickerPopover>` components matching the prototype pixel-for-pixel.
- [ ] Set up Supabase project; create the schema above; enable RLS (start permissive in dev, lock down before deploy).

### Phase 1 — Core App (single source of truth in the cloud)
- [ ] **Auth**: login/logout, profile bootstrap (role/team). Seed Ivan + Marek as `super_admin`.
- [ ] **Departments view**: tab bar from `teams`; task board per team with add/edit/delete/done, completed-collapse section, stats bar, custom date-picker popover, and **drag-to-reorder persisting `sort_order`**.
- [ ] **Projects view**: project tabs, phases with done toggle, add/delete phases, attach/remove docs, progress subtitle.
- [ ] **Realtime**: subscribe to `tasks`/`phases` so edits appear live across users.
- [ ] **Import/Export JSON**: keep, and **write a one-time migration script** that reads the prototype's exported JSON (or the embedded `DEFAULT_TASKS`/`DEFAULT_PROJECTS`) and inserts it as seed data. Verify every existing task/project imports correctly.
- [ ] **Daily Report**: port the DOCX generator; make scope = current user's team (admins can pick any team/person); base "completed" on `completed_at` = today; keep "Top 3 priorities for tomorrow."

### Phase 2 — Roles, Admin Back-end & Domain
- [ ] Enforce RLS for all roles; hide/disable edit controls in UI for non-editors.
- [ ] **CEO back-end**: team menu drill-down, all-departments overview, cross-team reorder/re-prioritize with live propagation, user management (invite + assign role/team).
- [ ] Deploy to Vercel; point the Elixir subdomain via IONOS DNS (Marek provides access); set production env vars; lock RLS.

### Phase 3 — External Integrations (only after Phase 1–2 sign-off; "step by step")
- [ ] **Asana**: OAuth per team member; sync their Asana tasks into the relevant team board (read at minimum; two-way later). Needs each person's Asana access.
- [ ] **Microsoft** (Eric/support): integrate Microsoft To Do / Planner / Graph as a source.
- [ ] **Salesforce**: sync relevant sales tasks.
- [ ] Build a normalized "external task" ingestion layer so all sources map onto the `tasks` schema with a `source` field.

---

## 5. Acceptance Criteria (Phase 1–2)
1. Multiple users can log in concurrently; data persists in the cloud (no `localStorage` dependence).
2. The existing prototype data (all departments, all tasks, all 3 projects) is imported and visible.
3. Visual design is faithful to the prototype (gradient, glass cards, fonts, priority colors, dot grid).
4. Drag-to-reorder works and persists; completed tasks collapse; custom date picker works.
5. Only Ivan and Marek can edit everything; other users' edit controls are hidden **and** server-side writes are rejected.
6. The CEO can open any team/person's board, reorder/re-prioritize, and the affected user sees the change live.
7. Daily DOCX report still generates, scoped per user/team, with completed-today + top-3-tomorrow.
8. Deployed at the Elixir subdomain over HTTPS.

## 6. Open Questions to Confirm With Marek (before/while building)
- Exact spelling + email for **Ivan (CEO)** and the full user/team roster.
- Can `member` users edit **their own** tasks, or are all non-admins fully read-only?
- Which Elixir subdomain + who controls IONOS DNS.
- Preferred login method (Google Workspace SSO vs. email magic link).
- For the daily report: per-person, per-team, or company-wide by default?
- Confirm the canonical team list (the prototype's `ewan`/`max`/`marek_jr_` are people, while `operations`/`marketing`/`sales` are departments — decide on a consistent model: people, teams, or both).

---

### Appendix A — Source assets
- Existing prototype: `elixir-task-tracker_4.html` (vanilla JS, localStorage; contains the seed `DEFAULT_TASKS` and `DEFAULT_PROJECTS` to migrate).
- Stakeholder meeting transcript: `Meeting-with-Jr-Marek-Ciszewski` (June 30, 2026) — source of requirements in §1.
- Keep the JSON Export from the live prototype as the authoritative seed snapshot for migration.
