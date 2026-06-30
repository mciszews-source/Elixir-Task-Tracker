DO $$
DECLARE team_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'is_executive_request'
  ) THEN
    RAISE EXCEPTION 'Run PASTE_002_policies.sql first.';
  END IF;
  SELECT count(*) INTO team_count FROM teams
    WHERE slug IN ('operations','marketing','sales','ewan','max','marek_jr_');
  IF team_count < 6 THEN
    RAISE EXCEPTION 'Run PASTE_003b_teams.sql first. Found % teams.', team_count;
  END IF;
END $$;

WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ('operations','marketing','sales')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (1, 'operations', 'Finalize vendor contracts', 'Supplier delay / cost overruns if unresolved', 'high', '2026-06-07'::date, false, 'open', NULL::timestamptz, 100),
  (2, 'operations', 'Weekly ops review prep', 'Team misalignment on KPIs', 'medium', '2026-06-06'::date, false, 'open', NULL, 200),
  (3, 'operations', 'Office supply reorder', 'Minor inconvenience only', 'low', '2026-06-12'::date, false, 'open', NULL, 300),
  (5, 'marketing', 'Marketing Plan and Materials for Dr. Shararah', 'Relationship Management', 'high', '2026-06-10'::date, false, 'open', NULL, 100),
  (42, 'marketing', 'Outstanding needs from Dr. Kassir and Scheila', 'Important relationship', 'high', '2026-06-09'::date, false, 'open', NULL, 200),
  (58, 'marketing', 'Finish Branding For AstralX', '', 'high', '2026-06-12'::date, false, 'open', NULL, 300),
  (6, 'marketing', 'Coordinate Omar Husseins EVA announcement', 'EVA marketing', 'medium', '2026-06-09'::date, false, 'open', NULL, 400),
  (9, 'sales', 'Kristy Hamilton EVA', '', 'medium', '2026-06-15'::date, false, 'open', NULL, 100)
)
INSERT INTO tasks (
  team_id, title, description, priority, due_date,
  is_executive_request, status, completed_at,
  sort_order, is_on_board, external_id
)
SELECT
  tm.id,
  s.title,
  s.description,
  s.priority::task_priority,
  s.due_date,
  s.from_ewan,
  s.status::task_status,
  s.completed_at,
  s.sort_order,
  true,
  'legacy:' || s.legacy_id
FROM seed s
JOIN team_map tm ON tm.slug = s.slug
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t
  WHERE t.external_id = 'legacy:' || s.legacy_id::text
);

SELECT t.slug, count(*) AS legacy_tasks
FROM tasks tk
JOIN teams t ON t.id = tk.team_id
WHERE tk.external_id LIKE 'legacy:%'
  AND t.slug IN ('operations','marketing','sales')
GROUP BY t.slug
ORDER BY t.slug;
