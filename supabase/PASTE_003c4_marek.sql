INSERT INTO tasks (team_id, title, description, priority, due_date, is_executive_request, status, completed_at, sort_order, is_on_board, external_id)
SELECT t.id, $t68$Roxium Execution System plus Dashboard$t68$, '', 'high'::task_priority, DATE '2026-06-19', false, 'open'::task_status, NULL::timestamptz, 100::numeric, true, 'legacy:68'
FROM teams t
WHERE t.slug = 'marek_jr_'
  AND NOT EXISTS (SELECT 1 FROM tasks x WHERE x.external_id = 'legacy:68');

INSERT INTO tasks (team_id, title, description, priority, due_date, is_executive_request, status, completed_at, sort_order, is_on_board, external_id)
SELECT t.id, $t69$EVA 3D - Marketing Execution System$t69$, '', 'high'::task_priority, DATE '2026-06-26', false, 'open'::task_status, NULL::timestamptz, 200::numeric, true, 'legacy:69'
FROM teams t
WHERE t.slug = 'marek_jr_'
  AND NOT EXISTS (SELECT 1 FROM tasks x WHERE x.external_id = 'legacy:69');

INSERT INTO tasks (team_id, title, description, priority, due_date, is_executive_request, status, completed_at, sort_order, is_on_board, external_id)
SELECT t.id, $t70$Dr. Kristy Hamilton - First Marketing Deliveries$t70$, '', 'high'::task_priority, DATE '2026-06-19', false, 'open'::task_status, NULL::timestamptz, 300::numeric, true, 'legacy:70'
FROM teams t
WHERE t.slug = 'marek_jr_'
  AND NOT EXISTS (SELECT 1 FROM tasks x WHERE x.external_id = 'legacy:70');

SELECT count(*) AS marek_legacy_tasks
FROM tasks
WHERE external_id IN ('legacy:68', 'legacy:69', 'legacy:70');
