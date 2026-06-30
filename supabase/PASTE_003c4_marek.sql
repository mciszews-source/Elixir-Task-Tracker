WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ('marek_jr_')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (68, 'marek_jr_', $t68$Roxium Execution System plus Dashboard$t68$, '', 'high', '2026-06-19'::date, false, 'open', NULL::timestamptz, 100),
  (69, 'marek_jr_', $t69$EVA 3D - Marketing Execution System$t69$, '', 'high', '2026-06-26'::date, false, 'open', NULL::timestamptz, 200),
  (70, 'marek_jr_', $t70$Dr. Kristy Hamilton - First Marketing Deliveries$t70$, '', 'high', '2026-06-19'::date, false, 'open', NULL::timestamptz, 300)
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
  AND t.slug IN ('marek_jr_')
GROUP BY t.slug
ORDER BY t.slug;
