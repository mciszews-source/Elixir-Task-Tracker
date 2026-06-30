# UI Refinement — Audit & Change Notes

**Reference:** `docs/elixir-task-tracker_4.html` (legacy single-file tracker prototype)
**Goal:** Make the live app feel like a polished production version of the original Elixir tracker — preserve the executive, glass-on-navy character; eliminate generic-SaaS drift; unify every control under one token system.

---

## 1. Audit — current GUI vs. legacy reference

### What was on-brand (kept and refined, not replaced)
- Body gradient + noise overlay (`#212F59 → #8EB8D4`, fractal-noise SVG)
- Glass surfaces, blur, hairline borders
- Montserrat display for chrome, Inter for body
- Priority palette (red/amber/blue/green) + left-stripe accent on rows
- Sidebar with department list
- Top-of-app segmented control (Departments / Projects)
- Task row layout (rank, priority chip, title, due, actions)
- EOD strip
- Stat pills

### Where the live app diverged from the reference
| # | Where | Divergence |
|---|-------|------------|
| 1 | `globals.css` | Sparse tokens (6 colors, 3 surface utilities). No radii/shadow/focus/typography tokens, no branded form-control styles. Everything was an ad-hoc `bg-white/X` Tailwind soup with values that drifted (`/8`, `/[0.04]`, `/12`, `/.10`, `/.18` all coexisting). |
| 2 | `<select>` everywhere | Native dropdowns. Chevron is browser-native, the option list is browser-themed, the focus state is browser default. Closed state had a generic look that did not belong to the rest of the UI. |
| 3 | `<input type="date">` | Light calendar icon, native picker styling that fights the dark theme. |
| 4 | `<input type="checkbox">` (e.g. Ewan's request) | Native macOS/Windows checkbox — clearly the most foreign element on the page. |
| 5 | `top-bar.tsx` (used by `dashboard-client.tsx`) | Pure light theme: `bg-white`, `border-slate-200`, `text-slate-900`. Cleanly off-brand. |
| 6 | `task-card.tsx`, `team-lane.tsx`, `open-tasks-panel.tsx`, `team-board-client.tsx` | All light-theme prototype shadcn-ish: `bg-white border-slate-200`. |
| 7 | `status-pill.tsx` | Light pastel tints (`bg-blue-50`, `bg-amber-50`) — totally off the dark palette. |
| 8 | `reports/daily-report.tsx`, `reports/next-day-preview.tsx` | Same light-theme prototype look. |
| 9 | `elixir-header.tsx` | Decent overall but the "DAILY REPORT" pill used a hot brick-red `rgba(176,49,40,0.25)` not in the brand palette; segmented control was hand-rolled instead of a system primitive. |
| 10 | `sidebar.tsx` | Solid but spacing was loose, active state used a left-border that fought the rounded item, and the bottom of the rail was empty. |
| 11 | `elixir-task-row.tsx` | Close to reference but native `<select>` for priority broke the look; icon buttons used inconsistent hover surfaces. |
| 12 | `team-tracker.tsx` add row | Native `<select>` for priority, native `<input type="date">`, native checkbox. The bottleneck of inconsistency. |
| 13 | `admin-users-client.tsx` | Three native `<select>`s side by side — most visible offender for "looks like a SaaS template, not Elixir." |
| 14 | `projects-grid.tsx` | Minimal cards with no status accent dot — felt under-designed vs the rest. |
| 15 | Spacing / typography | Heading sizes drifted (`text-2xl`, `text-xl`, `text-lg`, `text-base` mixed). Letter-spacing on display type was inconsistent (`0.18em`, `0.12em`, `0.14em`, `0.2em`). Body density varied row-to-row. |

---

## 2. Design system — what was tightened

`src/app/globals.css` was rewritten as the **single source of truth** for tokens, surfaces, and primitive control styles. Everything below is now used by the components.

### Token layers
- **Brand colors** — `--elixir-navy / -deep / -darker`, `--elixir-red(-soft)`, `--elixir-amber(-soft)`, `--elixir-green(-soft)`, `--elixir-blue(-soft)`, `--elixir-aqua`, `--elixir-slate`.
- **Surfaces** — `--surface-1..6` (alpha over the body gradient) + `--panel-bg`, `--panel-bg-strong`, `--panel-bg-deep`, `--menu-bg` (the legacy `rgba(18,24,60,0.98)` for popovers/menus).
- **Borders** — `--border-1..3`, `--border-strong`.
- **Text** — `--text-1..7` (white at descending opacity).
- **Radii** — `--r-sm..4xl` (`6 / 8 / 10 / 12 / 14 / 16 / 18`) + `--r-pill`.
- **Shadows** — `--shadow-card / panel / modal`.
- **Focus** — `--ring-soft`, `--ring-strong` (used by all controls).

### Primitive utility classes (used everywhere)
- `glass-panel`, `glass-panel-strong`, `glass-panel-deep` — the three header/sidebar/EOD/admin-panel surface levels from the reference.
- `glass-card` + `glass-card-hover` — task/project/admin cards.
- `glass-input` — text and date inputs, with proper hover + focus ring.
- `elixir-select` — kills the native chevron, draws a branded one with two diagonal CSS gradients, themes the focus state, and themes the option list (`#12183e` background) so the open dropdown actually looks like part of the app instead of a default OS menu.
- `elixir-priority-select` — variant that inherits the `.priority-*` chip color and draws a smaller chevron in `currentColor` so the priority dropdown reads as a tinted pill, not a select.
- `elixir-date` — `color-scheme: dark` + inverted/dimmed calendar picker icon.
- `elixir-check` — fully custom checkbox (rounded square, branded checked state with the brand blue glow).
- `elixir-btn`, `elixir-btn-primary`, `elixir-btn-danger`, `elixir-btn-ghost` — Montserrat, uppercase, tracked, with hover + focus ring. Identical look across every page.
- `elixir-icon-btn` (+ `.danger`) — small square icon affordance for ✎ / ✕ / move arrows.
- `elixir-popover` + `elixir-menuitem` — branded popover surface ready for any future custom dropdown menus (matches the legacy calendar popover style).
- `elixir-pill` (+ `elixir-pill-danger`) — stat pills.
- `elixir-segment` — the Departments / Projects segmented control extracted into a system primitive (uses `data-active="true"`).
- `priority-{critical,high,medium,low}` and `status-{open,in_progress,blocked,done}` — chip styles.
- Branded **scrollbar** (Webkit + Firefox) and global `color-scheme: dark` so any unstyled native control renders in dark mode.

---

## 3. What was changed (per file)

### Tokens / system
- **`src/app/globals.css`** — full rewrite. Adds the token layers above, all primitive utility classes, branded scrollbar, dark color scheme.

### Active path (what an admin actually sees today)
- **`src/components/layout/sidebar.tsx`** — refined active-state (absolute hairline rail on the rounded item instead of a `border-l` that fights the radius), tightened spacing (`224px` width, 2px vertical gap), unified item style helpers, added a footer line ("v1 · executive build") so the rail feels finished.
- **`src/components/layout/elixir-header.tsx`** — replaced hand-rolled segmented control with the `elixir-segment` primitive; replaced the off-brand brick-red "DAILY REPORT" pill with a standard `elixir-btn`. Uses Departments/Projects as proper title-case (legacy reference style) instead of all-caps shouting.
- **`src/components/tracker/team-tracker.tsx`** — add row now uses `elixir-select` (priority), `elixir-date` (due date), `elixir-check` (Ewan flag), `elixir-btn elixir-btn-primary` (add). Stat pills use the new `elixir-pill` / `elixir-pill-danger` primitives.
- **`src/components/tracker/elixir-task-row.tsx`** — priority `<select>` uses `elixir-priority-select` (branded chevron in chip color); edit/delete use `elixir-icon-btn` / `.danger`; tightened typography spacing; deadline label is now a flex row so the OVERDUE chip sits cleanly to its left.
- **`src/components/tracker/eod-strip.tsx`** — surface upgraded to `glass-panel-strong`, buttons replaced with `elixir-btn` system, preview list switched to a real `<ul>` with priority chips reused from the row tokens instead of one-off colored text.
- **`src/components/admin/admin-users-client.tsx`** — invite form and per-user role/team controls now use `elixir-select` + `elixir-btn-primary`. The big visual mismatch on this page (three native selects in a row) is gone.
- **`src/app/(dashboard)/reports/daily/page.tsx`** — inline `ReportSection` cards use `glass-panel-strong` + `glass-card` instead of ad-hoc opacity stacks; numeric badge for the "top N" mode now uses the brand blue ring instead of a flat translucent dot.
- **`src/components/projects/projects-grid.tsx`** — status now reads as a colored dot + uppercase label at the top of the card (Elixir style), card uses `glass-card-hover`, typography aligned to system display sizes.

### Defense-in-depth (off-path prototype code, repainted so re-enabling doesn't reintroduce light theme)
- **`src/components/layout/top-bar.tsx`** — repainted dark; uses display type and the new token surface.
- **`src/components/tasks/task-card.tsx`** — repainted dark, gained the priority left stripe (matches `ElixirTaskRow` so the look is consistent if both are mounted).
- **`src/components/tasks/open-tasks-panel.tsx`** — `glass-panel-strong` instead of `bg-slate-50/80`.
- **`src/components/teams/team-lane.tsx`** — `glass-panel-strong` with team-color top border accent.
- **`src/components/teams/team-board-client.tsx`** — repainted.
- **`src/components/dashboard/dashboard-client.tsx`** — loading text + spacing aligned.
- **`src/components/ui/status-pill.tsx`** — repainted using the new `status-*` chip tokens; now reads like a real branded pill instead of a light pastel.
- **`src/components/reports/daily-report.tsx`** & **`next-day-preview.tsx`** — repainted dark with the system surfaces.

---

## 4. Dropdown / menu / theme inconsistencies — specifically fixed

This was the loudest "looks like an imported component" symptom. The fix has three layers, all in `globals.css`:

1. **Closed state** — `.elixir-select` strips `appearance` entirely and paints its own chevron with two diagonal CSS gradients, so the trigger reads as a branded input, not a system dropdown.
2. **Open menu** — `option` elements are restyled (`background: #12183e; color: #fff`) so the native popup is dark and matches the menu surface in the reference. Combined with `html { color-scheme: dark }`, browsers (Chrome / Safari / Firefox) render the open list dark.
3. **Focus / hover / disabled** — every primitive (`.glass-input`, `.elixir-select`, `.elixir-priority-select`, `.elixir-check`, `.elixir-date`, `.elixir-btn`, `.elixir-icon-btn`) goes through the same `--ring-soft` focus halo, the same hover transition (`0.15s ease`), and the same `disabled { opacity: .5; cursor: not-allowed; }`.

A future need for a richer custom dropdown menu (e.g., a per-row "..." menu, a department filter, a user picker) has a ready-made surface: drop a popover into `.elixir-popover` and rows into `.elixir-menuitem`. No component library lock-in.

---

## 5. What was aligned to the original HTML (mapping)

| Legacy HTML token / class | Implemented as |
|---------------------------|----------------|
| `--navy: #21264C`, `--red`, `--amber`, `--green`, `--blue-mid` | `--elixir-navy`, `--elixir-red`, `--elixir-amber`, `--elixir-green`, `--elixir-blue` + soft variants |
| `body { background: linear-gradient(135deg, …) }` + noise overlay | unchanged — preserved in `globals.css` |
| `.header { background: rgba(33,38,76,0.4); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.12) }` | `.glass-panel` (header now uses it) |
| `.tab-bar`, `.tab-btn` | The Elixir segmented control + sidebar item active state borrow the same letter-spacing, weight, and uppercase rhythm |
| `.input-glass`, `.input-glass:focus` | `.glass-input` (now also has hover + focus-ring) |
| `.input-glass option { background: #21264C; color: #fff; }` | Generalized: every branded select themes its `option` to `#12183e` |
| `.priority-sel`, `.sel-critical/-high/-medium/-low` | `.elixir-priority-select` + `.priority-*` chip tokens |
| `.task-card { background: rgba(255,255,255,0.08); border-radius: 12px; …::before priority stripe }` | `.glass-card` + `.task-p-*::before` stripe; `.glass-card-hover` for the `:not(.editing):hover` rule |
| `.eod-strip { background: rgba(33,38,76,0.5); border-radius: 14px }` | `.glass-panel-strong` |
| `.cal-box { background: rgba(18,24,60,0.98); border-radius: 16px; box-shadow: 0 28px 72px rgba(0,0,0,0.65) }` | `.elixir-popover` (matches exactly) |
| `.cal-day:hover { background: rgba(255,255,255,0.13) }`, `.cal-day.is-sel { background: rgba(74,120,196,0.7) }` | `.elixir-menuitem:hover` + `.elixir-menuitem[data-selected="true"]` |
| `.confirm-btn`, `.add-task-btn`, `.eod-btn` | `.elixir-btn` + `.elixir-btn-primary` + `.elixir-btn-danger` (single button system) |
| `.task-check` | `.elixir-check` (small square variant for inline forms) + the original round task-check is kept inline in `elixir-task-row.tsx` |
| Stat pills (`.stat-pill`, `.stat-dot`) | `.elixir-pill` (+ `-danger`) |
| Sidebar inactive vs active text colors | Reused: `var(--text-5)` idle, white active, hairline rail accent |
| `MONTSERRAT` for chrome, `INTER` for body, `0.2em` letter-spacing on display | Standardized: display headings track ≥ `0.12em`, uppercase chrome labels track `0.18–0.22em` |

---

## 6. What was changed (concise summary)

- **Restyled** every native `<select>`, native date input, and native checkbox into branded components.
- **Restyled** every form button to a single 3-variant `elixir-btn` system.
- **Restyled** every "white card" leftover (TopBar, TaskCard, OpenTasksPanel, TeamLane, TeamBoardClient, StatusPill, DailyReport, NextDayPreview) into dark glass surfaces.
- **Aligned** sidebar, header, daily-report cards, admin pages, and projects grid to the same surface + radius + typography rhythm.
- **Aligned** the priority chip / left-stripe / status pill colors to the legacy palette and unified them as `.priority-*` and `.status-*` tokens.
- **Aligned** the segmented control (Departments / Projects) into a reusable `elixir-segment` primitive.
- **Added** a real focus-ring system (`--ring-soft`) so keyboard users see a branded halo, not browser defaults.
- **Added** a branded popover surface (`.elixir-popover` + `.elixir-menuitem`) ready for any future custom menus.
- **Added** a branded scrollbar and `color-scheme: dark` baseline so accidental native UI inherits the theme.

---

## 7. Components still needing a second pass (out of scope for this change)

These are quality-of-life upgrades, not visual mismatches — they are now consistent, but could be elevated further:

1. **Inline task-row edit mode** — `ElixirTaskRow`'s `onEdit` currently calls `window.prompt`/`window.confirm`. The legacy reference had inline edit fields and a branded confirm modal (`.confirm-box`). The popover/menu primitives are now in place; the next step is a `<ConfirmDialog>` and an inline edit input row that toggles via `.editing`.
2. **Custom priority dropdown** — `elixir-priority-select` is the best CSS-only result possible without state. A click-driven popover variant (using `.elixir-popover`) would let the open menu match the chip pill aesthetic exactly (the native option list is dark and acceptable but not pixel-perfect to the legacy `.priority-sel option`).
3. **Date picker** — `<input type="date">` is themed via `color-scheme: dark` and the icon is inverted, but the native calendar varies per browser/OS. The legacy file shipped a fully custom calendar (`.cal-box`). The `.elixir-popover` primitive is the foundation; building `<DatePicker>` on top is the obvious next-step upgrade.
4. **`projects-grid.tsx` progress bar** — the legacy projects view has a gradient progress bar (`linear-gradient(90deg, #4A78C4, #7DDFAD)`). The current grid shows status only; adding the progress bar (once the data model carries `percent_complete`) would close the last gap to the project-board reference.
5. **`dashboard-client.tsx` board view** — repainted defensively, but the original cross-team dashboard layout in the reference is denser and uses a Kanban-style horizontal scroll. If/when this view is re-enabled as a real route, a denser variant of `TeamLane` would be the upgrade.
6. **Mobile** — typography and spacing are tuned for ≥ 1280px (the executive use-case). The reference has a `@media (min-width: 1400px)` step; we should mirror that with a `@media (max-width: 768px)` collapse of the sidebar.

---

## 8. Verification

- `npx tsc --noEmit` → clean.
- `next build` (Turbopack) → 19/19 pages, no errors.
- All previously-rendered routes (`/login`, `/login/instant`, `/teams/[slug]`, `/projects`, `/reports/daily`, `/admin/users`) compile and statically/dynamically render exactly as before.
