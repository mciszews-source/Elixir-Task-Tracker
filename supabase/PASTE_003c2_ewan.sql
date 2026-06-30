WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ('ewan')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (10, 'ewan', 'Follow Up with Executives about the proposal for Face Cairo', 'He must have time to look at it at least one day prior to meeting.', 'critical', '2026-06-08'::date, false, 'done', now(), 100),
  (25, 'ewan', 'Make sure Kevin Tehrani signs today', 'We need the money', 'critical', '2026-06-08'::date, false, 'done', now(), 200),
  (26, 'ewan', 'Collect requested paperwork by Dr. Yash', 'Potential Sale', 'critical', '2026-06-08'::date, false, 'done', now(), 300),
  (48, 'ewan', 'Call with Sam about payment structure', 'No Clear', 'critical', '2026-06-08'::date, false, 'done', now(), 400),
  (37, 'ewan', 'Dr. Shararah proposal (Brand guideline, social media guideline, marketing strategy, domain and website, YouTube channel setup, instagram setup , linked in setup, email signature, business cards, printed materials)', 'Very important relationship', 'critical', '2026-06-12'::date, false, 'open', NULL, 500),
  (59, 'ewan', 'ROXIUM and diary of a surgeon Domain, who has IONOS?', '', 'critical', '2026-06-12'::date, false, 'open', NULL, 600),
  (60, 'ewan', 'get the NOVEXIS website and LinkedIn', '', 'critical', '2026-06-12'::date, false, 'open', NULL, 700),
  (62, 'ewan', 'Bank of America Transfer', '', 'critical', '2026-06-12'::date, false, 'open', NULL, 800),
  (63, 'ewan', 'Event sponsorship - Rita', '', 'critical', '2026-06-12'::date, false, 'open', NULL, 900),
  (36, 'ewan', 'Plan next weeks Dallas trip - Communicate with Dr. White, Camp, Yash, Rohrich...', '', 'high', '2026-06-10'::date, false, 'open', NULL, 1000),
  (11, 'ewan', 'Create Kristy Hamiltons Talk Tracks and 100k Marketing Strategy', 'Potential Upsell Opportunity', 'high', '2026-06-10'::date, false, 'open', NULL, 1100),
  (27, 'ewan', 'Finalize project X name', 'Hoyos is here right now', 'high', '2026-06-08'::date, false, 'done', now(), 1200),
  (28, 'ewan', 'Register project X company and initiate trademark filings (software and hardware)', '', 'high', '2026-06-10'::date, false, 'done', now(), 1300),
  (29, 'ewan', 'Continue the discussion with Dr. Stephen Davis', 'We need to move him into the pipeline', 'high', '2026-06-09'::date, false, 'open', NULL, 1400),
  (57, 'ewan', 'Astral X NDA and Invention assignment between the company and everyone that is working on it', 'SO they dont say they invented it', 'high', '2026-06-19'::date, false, 'done', now(), 1500),
  (31, 'ewan', 'Schedule meeting with Dr. Samir Kapadia', 'Potenital Sale', 'high', '2026-06-09'::date, false, 'open', NULL, 1600),
  (32, 'ewan', 'Richard Chavo? reach out to him', '', 'high', '2026-06-10'::date, false, 'done', now(), 1700),
  (41, 'ewan', 'Outstanding needs from Dr. Kassir and Scheila', 'important Relationship', 'high', '2026-06-09'::date, false, 'done', now(), 1800),
  (45, 'ewan', 'Immediate need to replace Ben with another videographer', 'Dependence on Ben', 'high', '2026-06-12'::date, false, 'open', NULL, 1900),
  (43, 'ewan', 'Meeting with Jerry Chidester regard ing Clinical Trial, open projects and Project X investment', 'Very important', 'high', '2026-06-10'::date, false, 'open', NULL, 2000),
  (44, 'ewan', 'Make sure Ben gets first payment of open invoices', 'No videographer', 'high', '2026-06-09'::date, false, 'done', now(), 2100),
  (53, 'ewan', 'Outstanding payments from January', 'Legal Exposure', 'high', '2026-06-11'::date, false, 'open', NULL, 2200),
  (61, 'ewan', 'AstralX website', '', 'high', '2026-06-12'::date, false, 'open', NULL, 2300),
  (30, 'ewan', 'Schedule meeting with Dr. Rubinstein', 'Very important relationship', 'medium', '2026-06-10'::date, false, 'open', NULL, 2400),
  (35, 'ewan', 'Dr. Sarah follow up', 'Maintain relationship', 'medium', '2026-06-10'::date, false, 'done', now(), 2500),
  (38, 'ewan', 'Coordinate Omar Husseins EVA announcement', 'EVA marketing', 'medium', '2026-06-08'::date, false, 'open', NULL, 2600),
  (39, 'ewan', 'Provide George Bitar with the EVA information he requested', 'Potential EVA Sale', 'medium', '2026-06-12'::date, false, 'open', NULL, 2700),
  (47, 'ewan', 'Contact Michelle for East Coast machine building', '', 'medium', '2026-06-12'::date, false, 'open', NULL, 2800)
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
  AND t.slug IN ('ewan')
GROUP BY t.slug
ORDER BY t.slug;
