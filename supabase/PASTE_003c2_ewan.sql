WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ('ewan')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (10, 'ewan', $t10$Follow Up with Executives about the proposal for Face Cairo$t10$, $d10$He must have time to look at it at least one day prior to meeting.$d10$, 'critical', '2026-06-08'::date, false, 'done', now(), 100),
  (25, 'ewan', $t25$Make sure Kevin Tehrani signs today$t25$, $d25$We need the money$d25$, 'critical', '2026-06-08'::date, false, 'done', now(), 200),
  (26, 'ewan', $t26$Collect requested paperwork by Dr. Yash$t26$, $d26$Potential Sale$d26$, 'critical', '2026-06-08'::date, false, 'done', now(), 300),
  (48, 'ewan', $t48$Call with Sam about payment structure$t48$, $d48$No Clear$d48$, 'critical', '2026-06-08'::date, false, 'done', now(), 400),
  (37, 'ewan', $t37$Dr. Shararah proposal (Brand guideline, social media guideline, marketing strategy, domain and website, YouTube channel setup, instagram setup , linked in setup, email signature, business cards, printed materials)$t37$, $d37$Very important relationship$d37$, 'critical', '2026-06-12'::date, false, 'open', NULL, 500),
  (59, 'ewan', $t59$ROXIUM and diary of a surgeon Domain, who has IONOS?$t59$, '', 'critical', '2026-06-12'::date, false, 'open', NULL, 600),
  (60, 'ewan', $t60$get the NOVEXIS website and LinkedIn$t60$, '', 'critical', '2026-06-12'::date, false, 'open', NULL, 700),
  (62, 'ewan', $t62$Bank of America Transfer$t62$, '', 'critical', '2026-06-12'::date, false, 'open', NULL, 800),
  (63, 'ewan', $t63$Event sponsorship - Rita$t63$, '', 'critical', '2026-06-12'::date, false, 'open', NULL, 900),
  (36, 'ewan', $t36$Plan next weeks Dallas trip - Communicate with Dr. White, Camp, Yash, Rohrich...$t36$, '', 'high', '2026-06-10'::date, false, 'open', NULL, 1000),
  (11, 'ewan', $t11$Create Kristy Hamiltons Talk Tracks and 100k Marketing Strategy$t11$, $d11$Potential Upsell Opportunity$d11$, 'high', '2026-06-10'::date, false, 'open', NULL, 1100),
  (27, 'ewan', $t27$Finalize project X name$t27$, $d27$Hoyos is here right now$d27$, 'high', '2026-06-08'::date, false, 'done', now(), 1200),
  (28, 'ewan', $t28$Register project X company and initiate trademark filings (software and hardware)$t28$, '', 'high', '2026-06-10'::date, false, 'done', now(), 1300),
  (29, 'ewan', $t29$Continue the discussion with Dr. Stephen Davis$t29$, $d29$We need to move him into the pipeline$d29$, 'high', '2026-06-09'::date, false, 'open', NULL, 1400),
  (57, 'ewan', $t57$Astral X NDA and Invention assignment between the company and everyone that is working on it$t57$, $d57$SO they dont say they invented it$d57$, 'high', '2026-06-19'::date, false, 'done', now(), 1500),
  (31, 'ewan', $t31$Schedule meeting with Dr. Samir Kapadia$t31$, $d31$Potenital Sale$d31$, 'high', '2026-06-09'::date, false, 'open', NULL, 1600),
  (32, 'ewan', $t32$Richard Chavo? reach out to him$t32$, '', 'high', '2026-06-10'::date, false, 'done', now(), 1700),
  (41, 'ewan', $t41$Outstanding needs from Dr. Kassir and Scheila$t41$, $d41$important Relationship$d41$, 'high', '2026-06-09'::date, false, 'done', now(), 1800),
  (45, 'ewan', $t45$Immediate need to replace Ben with another videographer$t45$, $d45$Dependence on Ben$d45$, 'high', '2026-06-12'::date, false, 'open', NULL, 1900),
  (43, 'ewan', $t43$Meeting with Jerry Chidester regard ing Clinical Trial, open projects and Project X investment$t43$, $d43$Very important$d43$, 'high', '2026-06-10'::date, false, 'open', NULL, 2000),
  (44, 'ewan', $t44$Make sure Ben gets first payment of open invoices$t44$, $d44$No videographer$d44$, 'high', '2026-06-09'::date, false, 'done', now(), 2100),
  (53, 'ewan', $t53$Outstanding payments from January$t53$, $d53$Legal Exposure$d53$, 'high', '2026-06-11'::date, false, 'open', NULL, 2200),
  (61, 'ewan', $t61$AstralX website$t61$, '', 'high', '2026-06-12'::date, false, 'open', NULL, 2300),
  (30, 'ewan', $t30$Schedule meeting with Dr. Rubinstein$t30$, $d30$Very important relationship$d30$, 'medium', '2026-06-10'::date, false, 'open', NULL, 2400),
  (35, 'ewan', $t35$Dr. Sarah follow up$t35$, $d35$Maintain relationship$d35$, 'medium', '2026-06-10'::date, false, 'done', now(), 2500),
  (38, 'ewan', $t38$Coordinate Omar Husseins EVA announcement$t38$, $d38$EVA marketing$d38$, 'medium', '2026-06-08'::date, false, 'open', NULL, 2600),
  (39, 'ewan', $t39$Provide George Bitar with the EVA information he requested$t39$, $d39$Potential EVA Sale$d39$, 'medium', '2026-06-12'::date, false, 'open', NULL, 2700),
  (47, 'ewan', $t47$Contact Michelle for East Coast machine building$t47$, '', 'medium', '2026-06-12'::date, false, 'open', NULL, 2800)
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
  AND t.slug IN ('ewan')
GROUP BY t.slug
ORDER BY t.slug;
