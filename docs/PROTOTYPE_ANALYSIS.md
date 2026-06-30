# Prototype Analysis — `elixir-task-tracker_4.html`

> **Note:** The HTML prototype and meeting transcript were not present in the repository at analysis time. This document is based on the product brief, meeting summary, and naming/versioning (`_4` = fourth iteration). Items marked **(inferred)** should be validated once `elixir-task-tracker_4.html` is added to the repo.

---

## 1. Prototype intent

The prototype is a **single-user, browser-local executive task board** for the CEO office. It consolidates work items that today live in Excel, Asana, and ad-hoc lists into one **visually scannable priority surface**.

The name "Elixir" refers to the company/brand, not the Elixir programming language.

---

## 2. Inferred current features

| Feature | Confidence | Notes |
|---------|------------|-------|
| Drag-and-drop task reordering | **Confirmed** (meeting) | Core interaction leadership wants preserved |
| Open tasks list | **Confirmed** (meeting) | Likely a dedicated column or panel for unblocked / in-flight work |
| Task detail on click/open | **Confirmed** (meeting) | "Open task" behavior liked |
| Daily completed-task report | **Confirmed** (meeting) | End-of-day summary for executive review |
| Next-day top priorities | **Confirmed** (meeting) | Forward-looking slice of top N tasks |
| Team / department grouping | **Inferred** | Required for cross-team dashboard; prototype may use tabs or color-coded lanes |
| Priority ranking (not just status columns) | **Inferred** | DnD implies ordered list, not free-form Kanban |
| Projects section (possibly stub) | **Inferred** | Meeting says include even if empty initially |
| Local persistence (`localStorage`) | **Inferred** | Typical for single-file HTML prototypes |
| Inline task creation / editing | **Inferred** | Needed for standalone use without a backend |
| Status indicators (open, in progress, done) | **Inferred** | Required for daily report filtering |
| Due dates or target dates | **Inferred** | Common in executive trackers |
| Assignee labels | **Inferred** | Cross-team visibility implies owner display |

---

## 3. Inferred UI structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: logo, date, maybe team filter                       │
├──────────────┬──────────────────────────┬───────────────────┤
│  Sidebar or  │  Main priority board      │  Open tasks       │
│  nav         │  (drag-reorderable list)  │  (secondary list) │
│  - Dashboard │                           │                   │
│  - Teams     │  [Task cards by priority] │  [Open items]     │
│  - Reports   │                           │                   │
│  - Projects  │                           │                   │
├──────────────┴──────────────────────────┴───────────────────┤
│  Daily report panel / modal (completed today + tomorrow top) │
└─────────────────────────────────────────────────────────────┘
```

### Reusable logic to preserve

1. **Priority sort order** — numeric `sort_order` updated on drag end.
2. **Open vs prioritized** — distinction between "on the board" and "open backlog."
3. **Daily report aggregation** — `completed_at` within business day window; top N by `sort_order` where status ≠ done.
4. **Visual hierarchy** — large readable titles, restrained chrome, strong status color coding.
5. **Low-friction reorder** — single gesture to reprioritize without opening a form.

### Logic to replace (not extend)

| Prototype pattern | Production replacement |
|-------------------|------------------------|
| `localStorage` JSON blob | Supabase Postgres + Realtime |
| Single implicit user | Auth + RLS per role/team |
| Hardcoded team names | `teams` table + membership |
| Client-only date math | Server-side timezone-aware queries (America/New_York assumed) |
| Inline `<script>` state | React state + TanStack Query + optimistic updates |

---

## 4. Extend vs rewrite recommendation

**Recommendation: controlled rewrite, UX-preserving.**

The HTML prototype is valuable as a **interaction and visual spec**, not as an architectural foundation. A single-file app cannot support:

- Multi-user concurrent editing
- Role-based cross-team reprioritization (Marek / Ivan admin rules)
- Audit trail of priority changes
- Future Asana / Microsoft sync workers

**Preserve:** drag-and-drop prioritization, open-tasks panel, daily report layout, executive readability.

**Rebuild:** auth, data layer, API, component architecture, realtime sync.

---

## 5. Validation checklist (when prototype file is available)

- [ ] Export task JSON shape → map 1:1 to `tasks` table columns
- [ ] Screenshot color tokens → Tailwind theme extension
- [ ] Record exact drag behavior (within list only vs cross-team)
- [ ] Confirm daily report field set (assignee? team? notes?)
- [ ] Identify any prototype features to **drop** vs **keep**
