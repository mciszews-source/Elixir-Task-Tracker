# Supabase SQL paste guide

Use these files in the **Supabase SQL Editor** (Dashboard → SQL → New query).  
Do **not** copy SQL from chat — dashes and quotes often get corrupted on paste.

## Order

| Step | File | What it does |
|------|------|----------------|
| 0 | `PASTE_000_verify.sql` | Shows what is already done and what to run next |
| 1 | `PASTE_001_schema.sql` | Core tables, RLS, triggers (**one-time only**) |
| 2 | `PASTE_002_policies.sql` | Executive flag + admin policies (safe to re-run) |
| 3 | `PASTE_003_seed.sql` | Prototype teams, tasks, projects (idempotent) |

**Already ran 001 before?** Skip it. Error `type "user_role" already exists` means 001 succeeded earlier — go straight to 002, then 003.

Run `PASTE_000_verify.sql` first if unsure; it reports `done = true/false` for each step.

Or run 003 in four smaller steps if debugging:

- `PASTE_003a_tables.sql` — `project_phases`, indexes
- `PASTE_003b_teams.sql` — 6 teams
- `PASTE_003c_tasks.sql` — 69 tasks
- `PASTE_003d_projects.sql` — 3 projects + 29 phases

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

**Good — 001 is already applied.** Do not run `PASTE_001_schema.sql` again.

Next:

1. Run `PASTE_002_policies.sql` (skip if `is_executive_request` column already exists)
2. Run `PASTE_003_seed.sql`

## Error: `relation "the" does not exist`

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
