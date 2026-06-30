-- 003_prototype_seed.sql
-- Brings the live DB to parity with docs/elixir-task-tracker_4.html.
-- Idempotent: safe to re-run. Uses WHERE NOT EXISTS (no ON CONFLICT — avoids PG 42P10 on partial indexes).
--
-- What this does:
--   1. Adds project_phases + phase_docs tables (for the legacy Projects view)
--   2. Adds a unique index on tasks.external_id for idempotent upserts
--   3. Adds icon column to projects (legacy uses ✦ ◎ ⬡)
--   4. Upserts the 6 prototype teams: operations, marketing, sales, ewan, max, marek_jr_
--   5. Inserts the 69 prototype tasks (DEFAULT_TASKS), tagged external_id='legacy:N'
--   6. Inserts the 3 prototype projects + 29 phases (DEFAULT_PROJECTS)

-- ─────────────────────────────────────────────────────────────────────────
-- 1. project_phases + phase_docs
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS phase_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read phases" ON project_phases;
CREATE POLICY "Read phases"
  ON project_phases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins write phases" ON project_phases;
CREATE POLICY "Admins write phases"
  ON project_phases FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Read docs" ON phase_docs;
CREATE POLICY "Read docs"
  ON phase_docs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins write docs" ON phase_docs;
CREATE POLICY "Admins write docs"
  ON phase_docs FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 2–3. Schema extras for prototype projects/tasks
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;

-- Optional uniqueness helpers (not required for WHERE NOT EXISTS inserts)
CREATE UNIQUE INDEX IF NOT EXISTS tasks_external_id_uidx
  ON tasks (external_id)
  WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_phases_external_id_uidx
  ON project_phases (external_id)
  WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_uidx
  ON projects (slug)
  WHERE slug IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Upsert the 6 prototype teams
-- ─────────────────────────────────────────────────────────────────────────
WITH team_seed(name, slug, color, sort_order) AS (
  VALUES
    ('Operations', 'operations', '#7c3aed', 1),
    ('Marketing',  'marketing',  '#4A78C4', 2),
    ('Sales',      'sales',      '#3DB87A', 3),
    ('Ewan',       'ewan',       '#E8A840', 4),
    ('Max',        'max',        '#4AAAC4', 5),
    ('Marek Jr.',  'marek_jr_',  '#9ABCF0', 6)
)
UPDATE teams t
SET
  name = s.name,
  color = s.color,
  sort_order = s.sort_order
FROM team_seed s
WHERE t.slug = s.slug;

WITH team_seed(name, slug, color, sort_order) AS (
  VALUES
    ('Operations', 'operations', '#7c3aed', 1),
    ('Marketing',  'marketing',  '#4A78C4', 2),
    ('Sales',      'sales',      '#3DB87A', 3),
    ('Ewan',       'ewan',       '#E8A840', 4),
    ('Max',        'max',        '#4AAAC4', 5),
    ('Marek Jr.',  'marek_jr_',  '#9ABCF0', 6)
)
INSERT INTO teams (name, slug, color, sort_order)
SELECT s.name, s.slug, s.color, s.sort_order
FROM team_seed s
WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.slug = s.slug);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Insert the 69 prototype tasks (DEFAULT_TASKS)
--    idempotency key: external_id = 'legacy:<numeric id from prototype>'
-- ─────────────────────────────────────────────────────────────────────────
WITH team_map AS (
  SELECT slug, id FROM teams
  WHERE slug IN ('operations','marketing','sales','ewan','max','marek_jr_')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (1, 'operations', 'Finalize vendor contracts', 'Supplier delay / cost overruns if unresolved', 'high', '2026-06-07'::date, false, 'open', NULL::timestamptz, 100),
  (2, 'operations', 'Weekly ops review prep', 'Team misalignment on KPIs', 'medium', '2026-06-06'::date, false, 'open', NULL, 200),
  (3, 'operations', 'Office supply reorder', 'Minor inconvenience only', 'low', '2026-06-12'::date, false, 'open', NULL, 300),
  (5, 'marketing', 'Marketing Plan and Materials for Dr. Shararah', 'Relationship Management', 'high', '2026-06-10'::date, false, 'open', NULL, 100),
  (42, 'marketing', 'Outstanding needs from Dr. Kassir and Scheila', 'Important relationship', 'high', '2026-06-09'::date, false, 'open', NULL, 200),
  (58, 'marketing', 'Finish Branding For AstralX', '', 'high', '2026-06-12'::date, false, 'open', NULL, 300),
  (6, 'marketing', 'Coordinate Omar Hussein’s EVA announcement', 'EVA marketing', 'medium', '2026-06-09'::date, false, 'open', NULL, 400),
  (9, 'sales', 'Kristy Hamilton EVA', '', 'medium', '2026-06-15'::date, false, 'open', NULL, 100),
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
  (38, 'ewan', 'Coordinate Omar Hussein’s EVA announcement', 'EVA marketing', 'medium', '2026-06-08'::date, false, 'open', NULL, 2600),
  (39, 'ewan', 'Provide George Bitar with the EVA information he requested', 'Potential EVA Sale', 'medium', '2026-06-12'::date, false, 'open', NULL, 2700),
  (47, 'ewan', 'Contact Michelle for East Coast machine building', '', 'medium', '2026-06-12'::date, false, 'open', NULL, 2800),
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
  (51, 'max', 'Create guide for marketing strategies for surgeons', 'We won''t be able to deliver what we promised', 'high', '2026-06-12'::date, false, 'open', NULL, 2200),
  (13, 'max', 'Balikian Visit Plan', 'Pilot Partner', 'high', '2026-06-16'::date, false, 'open', NULL, 2300),
  (21, 'max', 'EVA 3D Surgeon Sales Document', '', 'high', '2026-06-08'::date, false, 'open', NULL, 2400),
  (23, 'max', 'Turn Hamilton Call into plan', 'ROXIUM customer', 'high', '2026-06-07'::date, false, 'open', NULL, 2500),
  (24, 'max', 'Daily Reports', '', 'high', '2026-06-06'::date, false, 'open', NULL, 2600),
  (33, 'max', 'Egyptian lead - Follow up', 'Potential Sale', 'high', '2026-06-11'::date, false, 'open', NULL, 2700),
  (34, 'max', 'Create new Updated lead list', 'Losing potential sales', 'high', '2026-06-08'::date, false, 'open', NULL, 2800),
  (40, 'max', 'Schedule meeting with H/K/B', 'Important strategic meeting', 'high', '2026-06-09'::date, false, 'open', NULL, 2900),
  (49, 'max', 'ABS meeting agreement - Have Marek draft it', 'No partnership for the meeting', 'high', '2026-06-10'::date, false, 'open', NULL, 3000),
  (68, 'marek_jr_', 'Roxium Execution System plus Dashboard', '', 'high', '2026-06-19'::date, false, 'open', NULL, 100),
  (69, 'marek_jr_', 'EVA 3D - Marketing Execution System', '', 'high', '2026-06-26'::date, false, 'open', NULL, 200),
  (70, 'marek_jr_', 'Dr. Kristy Hamilton - First Marketing Deliveries', '', 'high', '2026-06-19'::date, false, 'open', NULL, 300)
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

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Insert the 3 prototype projects (DEFAULT_PROJECTS)
-- ─────────────────────────────────────────────────────────────────────────
WITH project_seed(slug, name, description, status, icon) AS (
  VALUES
    ('astralx', 'Astral X', 'Astral X product development', 'active', '✦'),
    ('clear',   'Clear',    'Clear initiative',              'active', '◎'),
    ('eva3d',   'EVA 3D',   'EVA 3D rollout',                'active', '⬡')
)
UPDATE projects p
SET
  name = s.name,
  description = s.description,
  status = s.status::project_status,
  icon = s.icon
FROM project_seed s
WHERE p.slug = s.slug;

WITH project_seed(slug, name, description, status, icon) AS (
  VALUES
    ('astralx', 'Astral X', 'Astral X product development', 'active', '✦'),
    ('clear',   'Clear',    'Clear initiative',              'active', '◎'),
    ('eva3d',   'EVA 3D',   'EVA 3D rollout',                'active', '⬡')
)
INSERT INTO projects (slug, name, description, status, icon)
SELECT s.slug, s.name, s.description, s.status::project_status, s.icon
FROM project_seed s
WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.slug = s.slug);

-- 6b. Phases for those projects (idempotent on external_id)
WITH proj_map AS (
  SELECT slug, id FROM projects WHERE slug IN ('astralx','clear','eva3d')
),
phase_seed(proj_slug, legacy_id, name, done, sort_order) AS (
  VALUES
  ('astralx', 'a1',  'Market Research', false,  100),
  ('astralx', 'a2',  'Market Feedback', false,  200),
  ('astralx', 'a3',  'Load Design', false,  300),
  ('astralx', 'a4',  'CAD Design 1', false,  400),
  ('astralx', 'a5',  'CAD Design 2', false,  500),
  ('astralx', 'a6',  'CAD Design 3', false,  600),
  ('astralx', 'a7',  'Cost of Prototype', false,  700),
  ('astralx', 'a8',  'Presentation 1', false,  800),
  ('astralx', 'a9',  'Presentation 2', false,  900),
  ('astralx', 'a10', 'IP / Legal', false, 1000),
  ('clear',   'c1',  'Market Research', false,  100),
  ('clear',   'c2',  'Market Feedback', false,  200),
  ('clear',   'c3',  'Load Design', false,  300),
  ('clear',   'c4',  'CAD Design 1', false,  400),
  ('clear',   'c5',  'CAD Design 2', false,  500),
  ('clear',   'c6',  'CAD Design 3', false,  600),
  ('clear',   'c7',  'Cost of Prototype', false,  700),
  ('clear',   'c8',  'Presentation 1', false,  800),
  ('clear',   'c9',  'Presentation 2', false,  900),
  ('clear',   'c10', 'IP / Legal', false, 1000),
  ('eva3d',   'e2',  'Market Feedback', false,  100),
  ('eva3d',   'e3',  'Load Design', false,  200),
  ('eva3d',   'e4',  'CAD Design 1', false,  300),
  ('eva3d',   'e5',  'CAD Design 2', false,  400),
  ('eva3d',   'e6',  'CAD Design 3', false,  500),
  ('eva3d',   'e7',  'Cost of Prototype', false,  600),
  ('eva3d',   'e8',  'Presentation 1', false,  700),
  ('eva3d',   'e9',  'Presentation 2', false,  800),
  ('eva3d',   'e10', 'IP / Legal', false,  900)
)
INSERT INTO project_phases (project_id, name, done, sort_order, external_id)
SELECT pm.id, ps.name, ps.done, ps.sort_order, 'legacy:' || ps.legacy_id
FROM phase_seed ps
JOIN proj_map pm ON pm.slug = ps.proj_slug
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases pp
  WHERE pp.external_id = 'legacy:' || ps.legacy_id
);

-- Enable realtime for the new tables (best-effort; safe if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_phases;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE phase_docs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Done. Inserted: 6 teams, 69 tasks, 3 projects, 29 phases.
