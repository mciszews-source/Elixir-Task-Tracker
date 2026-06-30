# Supabase SQL paste guide

**Copy only from Raw GitHub links below — never from this chat, email, or the Supabase RLS warning popup.**

If you accidentally paste the Supabase warning text (`...may be able to access the.`), PostgreSQL runs the word **`the`** as SQL → `relation "the" does not exist`.

## You only need these files now

| File | When |
|------|------|
| `PASTE_001_SKIP.sql` | **Run this instead of 001** — confirms schema exists |
| `PASTE_003c1_ops_mkt_sales.sql` | Tasks step 1 of 4 |
| `PASTE_003c2_ewan.sql` | Tasks step 2 of 4 |
| `PASTE_003c3_max.sql` | Tasks step 3 of 4 |
| `PASTE_003c4_marek.sql` | Tasks step 4 of 4 |

**Do not run `PASTE_001_schema.sql`** if you already got `user_role already exists` — that error means 001 succeeded earlier.

## Order (your situation: 002, 003a, 003b, 003d already done)

Run only the four **003c** files above, in order. Clear the SQL editor completely between each file.

Raw links:

```
https://raw.githubusercontent.com/mciszews-source/Elixir-Task-Tracker/cursor/fix-seed-sql-quotes-3b87/supabase/PASTE_003c1_ops_mkt_sales.sql
https://raw.githubusercontent.com/mciszews-source/Elixir-Task-Tracker/cursor/fix-seed-sql-quotes-3b87/supabase/PASTE_003c2_ewan.sql
https://raw.githubusercontent.com/mciszews-source/Elixir-Task-Tracker/cursor/fix-seed-sql-quotes-3b87/supabase/PASTE_003c3_max.sql
https://raw.githubusercontent.com/mciszews-source/Elixir-Task-Tracker/cursor/fix-seed-sql-quotes-3b87/supabase/PASTE_003c4_marek.sql
```

First line of **003c1** must be `WITH team_map AS (` — nothing before it.

## Order

| Step | File | What it does |
|------|------|----------------|
| 0 | `PASTE_000_verify.sql` | Shows what is already done and what to run next |
| 0b | `PASTE_001_status.sql` | Run if unsure whether 001 is needed |
| 1 | `PASTE_001_schema.sql` | Core tables (**only on empty DB — skip if `user_role` exists**) |
| 2 | `PASTE_002_policies.sql` | Executive flag + admin policies (safe to re-run) |
| 3 | `PASTE_003_seed.sql` | All seed data in one file (or use split 003a–d below) |

**001 error `user_role already exists`?** That means 001 already ran. **Do not run 001 again.** Run `PASTE_001_status.sql` to confirm.

### If `PASTE_003c_tasks.sql` fails — use smaller files

Run in order (clear editor between each):

1. `PASTE_003c1_ops_mkt_sales.sql` — 8 tasks
2. `PASTE_003c2_ewan.sql` — 28 tasks
3. `PASTE_003c3_max.sql` — 30 tasks
4. `PASTE_003c4_marek.sql` — 3 tasks

Each file ends with a per-team task count. Total should reach **69**.

Or run 003 in four smaller steps if debugging:

- `PASTE_003a_tables.sql` — `project_phases`, indexes (**RLS warning appears here — see below**)
- `PASTE_003b_teams.sql` — 6 teams (run before 003c)
- `PASTE_003c_tasks.sql` — 69 tasks (no tables created; no RLS dialog)
- `PASTE_003d_projects.sql` — 3 projects + 29 phases

### Supabase “Row Level Security” popup

When running **003a** (or the full **003_seed**), Supabase may warn:

> This query creates a table without enabling Row Level Security…

**Click `Run without RLS`** — not “Run and enable RLS”.

Our scripts **already** run `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and create policies in the same file. “Run and enable RLS” can interfere with that and cause confusing failures on later steps.

**003c does not create tables.** If you see the RLS popup on 003c, you may have leftover SQL from 003a in the editor — clear the editor and paste only the 003c file.

### Strict order for split 003

| Step | File | Skip if |
|------|------|---------|
| — | `PASTE_002_policies.sql` | `is_executive_request` column exists |
| a | `PASTE_003a_tables.sql` | `project_phases` table exists |
| b | `PASTE_003b_teams.sql` | 6 prototype teams exist |
| c | `PASTE_003c_tasks.sql` | `legacy_task_count` is 69 |
| d | `PASTE_003d_projects.sql` | 29 phases exist |

## Raw GitHub URLs (copy from browser, not chat)

Replace `BRANCH` with `main` after PR merge, or `cursor/fix-seed-sql-quotes-3b87` until then:

```
https://raw.githubusercontent.com/mciszews-source/Elixir-Task-Tracker/BRANCH/supabase/PASTE_001_schema.sql
https://raw.githubusercontent.com/mciszews-source/Elixir-Task-Tracker/BRANCH/supabase/PASTE_002_policies.sql
https://raw.githubusercontent.com/mciszews-source/Elixir-Task-Tracker/BRANCH/supabase/PASTE_003_seed.sql
```

## Verify seed

```sql
SELECT 'teams' AS t, count(*) FROM teams WHERE slug IN ('operations','marketing','sales','ewan','max','marek_jr_')
UNION ALL SELECT 'tasks', count(*) FROM tasks WHERE external_id LIKE 'legacy:%'
UNION ALL SELECT 'projects', count(*) FROM projects WHERE slug IN ('astralx','clear','eva3d')
UNION ALL SELECT 'phases', count(*) FROM project_phases WHERE external_id LIKE 'legacy:%';
```

Expected: 6 teams, 69 tasks, 3 projects, 29 phases.

## Error: `type "user_role" already exists`

**Stop running 001.** Run `PASTE_001_SKIP.sql` instead — it only prints a confirmation message.

## Error: `relation "the" does not exist`

Usually one of:

1. Pasted SQL from **chat** or **docs** (comment/prose lost its `--` prefix)
2. Pasted the **Supabase RLS warning** text into the editor by mistake
3. Old single-quoted task seed (fixed in latest 003c files — uses `$t10$...$t10$` dollar quotes)

Fix: open the **raw GitHub** link → Ctrl+A in the browser → Ctrl+C → **delete all text** in SQL editor → paste → Run.

This means **prose was executed as SQL**, not that a table is missing.

Cause: a comment line like `-- Brings the live DB...` lost its `--` prefix (common when copying from chat or rich text). PostgreSQL then runs `Brings the live DB...` and treats **the** as a table name.

Fix: use only the `PASTE_*.sql` files from raw GitHub. The first line of 003 must be:

```sql
CREATE TABLE IF NOT EXISTS project_phases (
```

If you see `-- 003_prototype_seed` or `Brings the live DB` at the top, you have the wrong file.

## `migrations/*.sql` vs `PASTE_*.sql`

- `migrations/` — for `supabase db push` / CLI; may include comments.
- `PASTE_*.sql` — comment-free; safe for SQL Editor paste.
