SELECT '001_schema' AS step,
  EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') AS done,
  'Skip PASTE_001 if true' AS action;

SELECT '002_policies' AS step,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'is_executive_request'
  ) AS done,
  'Run PASTE_002_policies.sql if false' AS action;

SELECT '003_seed' AS step,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'project_phases'
  ) AS tables_ready,
  (SELECT count(*) FROM tasks WHERE external_id LIKE 'legacy:%') AS legacy_task_count,
  CASE
    WHEN (SELECT count(*) FROM tasks WHERE external_id LIKE 'legacy:%') >= 69 THEN 'Done — seed complete'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'project_phases'
    ) THEN 'Run PASTE_003b/c/d or PASTE_003_seed.sql'
    ELSE 'Run PASTE_003_seed.sql (or 003a then 003b/c/d)'
  END AS action;
