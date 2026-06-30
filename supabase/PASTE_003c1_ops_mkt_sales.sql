WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ('operations','marketing','sales')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (1, 'operations', $t1$Finalize vendor contracts$t1$, $d1$Supplier delay / cost overruns if unresolved$d1$, 'high', '2026-06-07'::date, false, 'open', NULL::timestamptz, 100),
  (2, 'operations', $t2$Weekly ops review prep$t2$, $d2$Team misalignment on KPIs$d2$, 'medium', '2026-06-06'::date, false, 'open', NULL::timestamptz, 200),
  (3, 'operations', $t3$Office supply reorder$t3$, $d3$Minor inconvenience only$d3$, 'low', '2026-06-12'::date, false, 'open', NULL::timestamptz, 300),
  (5, 'marketing', $t5$Marketing Plan and Materials for Dr. Shararah$t5$, $d5$Relationship Management$d5$, 'high', '2026-06-10'::date, false, 'open', NULL::timestamptz, 100),
  (42, 'marketing', $t42$Outstanding needs from Dr. Kassir and Scheila$t42$, $d42$Important relationship$d42$, 'high', '2026-06-09'::date, false, 'open', NULL::timestamptz, 200),
  (58, 'marketing', $t58$Finish Branding For AstralX$t58$, '', 'high', '2026-06-12'::date, false, 'open', NULL::timestamptz, 300),
  (6, 'marketing', $t6$Coordinate Omar Husseins EVA announcement$t6$, $d6$EVA marketing$d6$, 'medium', '2026-06-09'::date, false, 'open', NULL::timestamptz, 400),
  (9, 'sales', $t9$Kristy Hamilton EVA$t9$, '', 'medium', '2026-06-15'::date, false, 'open', NULL::timestamptz, 100)
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
  s.completed_at::timestamptz,
  s.sort_order,
  true,
  ('legacy:' || s.legacy_id::text)
FROM seed s
JOIN team_map tm ON tm.slug = s.slug
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t
  WHERE t.external_id = ('legacy:' || s.legacy_id::text)
);

SELECT t.slug, count(*) AS legacy_tasks
FROM tasks tk
JOIN teams t ON t.id = tk.team_id
WHERE tk.external_id LIKE 'legacy:%'
  AND t.slug IN ('operations','marketing','sales')
GROUP BY t.slug
ORDER BY t.slug;
