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

