# UI/UX Recommendations — Executive Task Tracker

Design for **Marek, Ivan, and CEO office**: scan in under 3 seconds, act in one gesture.

---

## 1. Design principles

1. **Clarity over density** — max 7±2 tasks visible per team lane without scroll.
2. **Priority is spatial** — top = most important; position never lies.
3. **Color encodes team, not urgency** — urgency uses icon + label (avoid red/green noise).
4. **Quiet chrome** — white/near-white surface, subtle borders, one accent color (Elixir brand).
5. **Forgiving interactions** — undo toast after reorder; confirm only on delete.

---

## 2. Visual system

### Typography

| Token | Size | Use |
|-------|------|-----|
| `text-2xl font-semibold` | 24px | Page titles |
| `text-base font-medium` | 16px | Task titles on cards |
| `text-sm text-slate-600` | 14px | Meta (assignee, due) |
| `text-xs uppercase tracking-wide` | 12px | Section labels |

Font: **Geist Sans** (already in Next scaffold) or **Inter** if brand requires.

### Color tokens (extend `globals.css`)

```css
--surface: #fafafa;
--surface-elevated: #ffffff;
--border: #e5e7eb;
--text-primary: #0f172a;
--text-secondary: #64748b;
--accent: #1e40af;        /* Elixir blue — adjust to brand */
--status-open: #3b82f6;
--status-progress: #f59e0b;
--status-blocked: #ef4444;
--status-done: #22c55e;
```

Team lane headers use `teams.color` at 10% opacity background.

### Task card anatomy

```
┌─────────────────────────────────────┐
│ ● Engineering          Due: Jun 30  │  ← team pill + due
│ Fix board deck for investor meeting │  ← title (2 lines max)
│ Ivan · High · In progress           │  ← meta row
└─────────────────────────────────────┘
```

- Min height 72px; padding 16px; border-radius 12px.
- Drag handle (⠿) on left; entire card draggable.
- Hover: subtle shadow; focus: ring for keyboard.

---

## 3. Layout recommendations

### Cross-team dashboard (`/`)

- **Horizontal lanes** — one column per team (scroll-x on mobile).
- Each lane: team name, task count, top 5 tasks by `sort_order`.
- **Sticky top bar** — today's date, link to daily report, admin badge if applicable.
- **Right drawer** — open tasks across all teams (collapsible).

### Team view (`/teams/[slug]`)

- **Main area (70%)** — full sortable priority list (`is_on_board = true`).
- **Side panel (30%)** — open tasks; drag from panel onto board to prioritize.
- FAB or top button: "+ Add task".

### Daily report (`/reports/daily`)

Two-column layout:

| Completed today | Top for tomorrow |
|-----------------|------------------|
| Grouped by team | Grouped by team |
| Checkmark icon | Numbered 1–N |
| Timestamp optional | Due date highlighted |

- Default date = today in America/New_York.
- Date picker for historical view.
- "Copy summary" button → markdown for email.

---

## 4. Interaction patterns

### Drag-and-drop

- Use `@dnd-kit` with `PointerSensor` + 8px activation distance (prevent mis-drags).
- **Within team:** team_lead and admin reorder freely.
- **Cross-team (admin only):** drag task to another team's lane → updates `team_id` + `sort_order` + audit log.
- Visual: ghost card at 80% opacity; drop indicator line between items.

### Open task → board

- Drag from open panel to board sets `is_on_board = true` and assigns `sort_order`.
- Alternative: "Prioritize" button on card.

### Task detail drawer

- Click card (not drag) opens right drawer.
- Inline edit title; tabs: Details | Activity.
- Close on Esc or overlay click.

---

## 5. Empty and loading states

| State | Treatment |
|-------|-----------|
| No tasks | Illustration + "Add first task" CTA |
| No projects | "Projects help group initiatives" + create CTA |
| Loading | Skeleton cards (3 per lane), no spinners |
| Error | Toast + retry; preserve optimistic state rollback |
| Unauthorized | Redirect to login; explain insufficient permissions |

---

## 6. Accessibility

- All DnD actions have keyboard alternatives (↑↓ + Enter to move).
- Status never color-only: icon + text label.
- Focus trap in modals/drawers.
- `aria-live` region announces reorder results.

---

## 7. Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| ≥1280px | Multi-column dashboard |
| 768–1279px | 2 team columns; horizontal scroll |
| <768px | Single team selector; stack open tasks below |

Executive primary use case is **desktop**; mobile is read-only acceptable for MVP.

---

## 8. Prototype → production UI mapping

| Prototype pattern (inferred) | Production component |
|------------------------------|----------------------|
| Priority list | `SortableTaskList` |
| Open tasks column | `OpenTasksPanel` |
| Daily summary section | `DailyReport` + `NextDayPreview` |
| Team headers | `TeamLane` |
| local task modal | `TaskDetailDrawer` |
