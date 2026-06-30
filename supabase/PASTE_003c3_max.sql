WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ('max')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (73, 'max', $t73$Update lead list$t73$, '', 'critical', '2026-06-18'::date, false, 'open', NULL, 100),
  (72, 'max', $t72$Dallas Recap Report$t72$, '', 'critical', '2026-06-17'::date, false, 'done', '2026-06-19T00:21:37.882Z'::timestamptz, 200),
  (65, 'max', $t65$Pay EVA Forwarder$t65$, '', 'critical', '2026-06-12'::date, false, 'done', now(), 300),
  (66, 'max', $t66$Send Johnny EVA recordings$t66$, '', 'critical', '2026-06-12'::date, false, 'done', now(), 400),
  (64, 'max', $t64$Finalize what we do with the interviews - Create a list$t64$, '', 'critical', '2026-06-12'::date, false, 'done', now(), 500),
  (46, 'max', $t46$Respond to all interview candidates with either acceptance or rejection$t46$, $d46$Professionalism$d46$, 'critical', '2026-06-08'::date, false, 'done', now(), 600),
  (12, 'max', $t12$Face Global, what are the next steps$t12$, $d12$Hot Opportunity$d12$, 'critical', '2026-06-17'::date, false, 'done', now(), 700),
  (50, 'max', $t50$Send Transcript of Hoyos visit to John$t50$, $d50$Stay Hot$d50$, 'critical', '2026-06-08'::date, false, 'done', now(), 800),
  (55, 'max', $t55$Make Task Tracker for Marek and See what you can teach him$t55$, '', 'critical', '2026-06-09'::date, false, 'done', now(), 900),
  (74, 'max', $t74$Roxium ADP Bank Account$t74$, '', 'critical', '2026-06-18'::date, false, 'open', NULL, 1000),
  (56, 'max', $t56$Make this a company wide tool that can be seen by everyone$t56$, '', 'critical', '2026-06-10'::date, false, 'open', NULL, 1100),
  (71, 'max', $t71$Update Salesforce$t71$, '', 'critical', '2026-06-15'::date, false, 'open', NULL, 1200),
  (75, 'max', $t75$EVA 3D - Dr. Haris$t75$, '', 'critical', '2026-06-18'::date, false, 'done', '2026-06-18T23:29:38.725Z'::timestamptz, 1300),
  (76, 'max', $t76$Consulting company names to Ewan$t76$, '', 'critical', '2026-06-18'::date, false, 'done', '2026-06-19T00:03:15.050Z'::timestamptz, 1400),
  (77, 'max', $t77$EVA Project, how can we make it reality$t77$, '', 'critical', '2026-06-18'::date, false, 'open', NULL, 1500),
  (78, 'max', $t78$Build an EVA Pilot Dashboard$t78$, '', 'critical', '2026-06-18'::date, false, 'open', NULL, 1600),
  (79, 'max', $t79$Finish Dr. Kristy Hamiltons Marketing Strategy$t79$, '', 'critical', '2026-06-19'::date, false, 'done', '2026-06-19T00:20:15.307Z'::timestamptz, 1700),
  (67, 'max', $t67$Did we get paid for Comert and Uribe?$t67$, '', 'high', '2026-06-12'::date, false, 'open', NULL, 1800),
  (54, 'max', $t54$Create Company overview Dashboard - With all info about the companies (Plaud)$t54$, '', 'high', '2026-06-10'::date, false, 'open', NULL, 1900),
  (20, 'max', $t20$Creat Framework for Implementing Marketing Strategies Efficiently$t20$, $d20$Need to make Roxium succesful$d20$, 'high', '2026-06-08'::date, false, 'open', NULL, 2000),
  (22, 'max', $t22$Mehmet reply and video shoot$t22$, $d22$Surgeon needs to stay happy$d22$, 'high', '2026-06-08'::date, false, 'open', NULL, 2100),
  (51, 'max', $t51$Create guide for marketing strategies for surgeons$t51$, $d51$We will not be able to deliver what we promised$d51$, 'high', '2026-06-12'::date, false, 'open', NULL, 2200),
  (13, 'max', $t13$Balikian Visit Plan$t13$, $d13$Pilot Partner$d13$, 'high', '2026-06-16'::date, false, 'open', NULL, 2300),
  (21, 'max', $t21$EVA 3D Surgeon Sales Document$t21$, '', 'high', '2026-06-08'::date, false, 'open', NULL, 2400),
  (23, 'max', $t23$Turn Hamilton Call into plan$t23$, $d23$ROXIUM customer$d23$, 'high', '2026-06-07'::date, false, 'open', NULL, 2500),
  (24, 'max', $t24$Daily Reports$t24$, '', 'high', '2026-06-06'::date, false, 'open', NULL, 2600),
  (33, 'max', $t33$Egyptian lead - Follow up$t33$, $d33$Potential Sale$d33$, 'high', '2026-06-11'::date, false, 'open', NULL, 2700),
  (34, 'max', $t34$Create new Updated lead list$t34$, $d34$Losing potential sales$d34$, 'high', '2026-06-08'::date, false, 'open', NULL, 2800),
  (40, 'max', $t40$Schedule meeting with H/K/B$t40$, $d40$Important strategic meeting$d40$, 'high', '2026-06-09'::date, false, 'open', NULL, 2900),
  (49, 'max', $t49$ABS meeting agreement - Have Marek draft it$t49$, $d49$No partnership for the meeting$d49$, 'high', '2026-06-10'::date, false, 'open', NULL, 3000)
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
  AND t.slug IN ('max')
GROUP BY t.slug
ORDER BY t.slug;
