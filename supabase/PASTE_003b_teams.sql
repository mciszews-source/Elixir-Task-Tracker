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
