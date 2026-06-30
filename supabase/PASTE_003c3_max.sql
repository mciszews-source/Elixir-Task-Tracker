WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ('max')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (73, 'max', 'Update lead list', '', 'critical', '2026-06-18'::date, false, 'open', NULL, 100),
  (72, 'max', 'Dallas Recap Report', '', 'critical', '2026-06-17'::date, false, 'done', '2026-06-19T00:21:37.882Z'::timestamptz, 200),
  (65, 'max', 'Pay EVA Forwarder', '', 'critical', '2026-06-12'::date, false, 'done', now(), 300),
  (66, 'max', 'Send Johnny EVA recordings', '', 'critical', '2026-06-12'::date, false, 'done', now(), 400),
  (64, 'max', 'Finalize what we do with the interviews - Create a list', '', 'critical', '2026-06-12'::date, false, 'done', now(), 500),
  (46, 'max', 'Respond to all interview candidates with either acceptance or rejection', 'Professionalism', 'critical', '2026-06-08'::date, false, 'done', now(), 600),
  (12, 'max', 'Face Global, what are the next steps', 'Hot Opportunity', 'critical', '2026-06-17'::date, false, 'done', now(), 700),
  (50, 'max', 'Send Transcript of Hoyos visit to John', 'Stay Hot', 'critical', '2026-06-08'::date, false, 'done', now(), 800),
  (55, 'max', 'Make Task Tracker for Marek and See what you can teach him', '', 'critical', '2026-06-09'::date, false, 'done', now(), 900),
  (74, 'max', 'Roxium ADP Bank Account', '', 'critical', '2026-06-18'::date, false, 'open', NULL, 1000),
  (56, 'max', 'Make this a company wide tool that can be seen by everyone', '', 'critical', '2026-06-10'::date, false, 'open', NULL, 1100),
  (71, 'max', 'Update Salesforce', '', 'critical', '2026-06-15'::date, false, 'open', NULL, 1200),
  (75, 'max', 'EVA 3D - Dr. Haris', '', 'critical', '2026-06-18'::date, false, 'done', '2026-06-18T23:29:38.725Z'::timestamptz, 1300),
  (76, 'max', 'Consulting company names to Ewan', '', 'critical', '2026-06-18'::date, false, 'done', '2026-06-19T00:03:15.050Z'::timestamptz, 1400),
  (77, 'max', 'EVA Project, how can we make it reality', '', 'critical', '2026-06-18'::date, false, 'open', NULL, 1500),
  (78, 'max', 'Build an EVA Pilot Dashboard', '', 'critical', '2026-06-18'::date, false, 'open', NULL, 1600),
  (79, 'max', 'Finish Dr. Kristy Hamiltons Marketing Strategy', '', 'critical', '2026-06-19'::date, false, 'done', '2026-06-19T00:20:15.307Z'::timestamptz, 1700),
  (67, 'max', 'Did we get paid for Comert and Uribe?', '', 'high', '2026-06-12'::date, false, 'open', NULL, 1800),
  (54, 'max', 'Create Company overview Dashboard - With all info about the companies (Plaud)', '', 'high', '2026-06-10'::date, false, 'open', NULL, 1900),
  (20, 'max', 'Creat Framework for Implementing Marketing Strategies Efficiently', 'Need to make Roxium succesful', 'high', '2026-06-08'::date, false, 'open', NULL, 2000),
  (22, 'max', 'Mehmet reply and video shoot', 'Surgeon needs to stay happy', 'high', '2026-06-08'::date, false, 'open', NULL, 2100),
  (51, 'max', 'Create guide for marketing strategies for surgeons', 'We will not be able to deliver what we promised', 'high', '2026-06-12'::date, false, 'open', NULL, 2200),
  (13, 'max', 'Balikian Visit Plan', 'Pilot Partner', 'high', '2026-06-16'::date, false, 'open', NULL, 2300),
  (21, 'max', 'EVA 3D Surgeon Sales Document', '', 'high', '2026-06-08'::date, false, 'open', NULL, 2400),
  (23, 'max', 'Turn Hamilton Call into plan', 'ROXIUM customer', 'high', '2026-06-07'::date, false, 'open', NULL, 2500),
  (24, 'max', 'Daily Reports', '', 'high', '2026-06-06'::date, false, 'open', NULL, 2600),
  (33, 'max', 'Egyptian lead - Follow up', 'Potential Sale', 'high', '2026-06-11'::date, false, 'open', NULL, 2700),
  (34, 'max', 'Create new Updated lead list', 'Losing potential sales', 'high', '2026-06-08'::date, false, 'open', NULL, 2800),
  (40, 'max', 'Schedule meeting with H/K/B', 'Important strategic meeting', 'high', '2026-06-09'::date, false, 'open', NULL, 2900),
  (49, 'max', 'ABS meeting agreement - Have Marek draft it', 'No partnership for the meeting', 'high', '2026-06-10'::date, false, 'open', NULL, 3000)
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
  AND t.slug IN ('max')
GROUP BY t.slug
ORDER BY t.slug;
