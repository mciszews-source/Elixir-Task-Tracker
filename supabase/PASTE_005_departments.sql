DELETE FROM teams WHERE slug = 'ceo-office';
DELETE FROM teams WHERE slug = 'finance';

UPDATE teams SET name = 'R&D', slug = 'rnd'
WHERE slug = 'engineering'
  AND NOT EXISTS (SELECT 1 FROM teams WHERE slug = 'rnd');

WITH dept_seed(name, slug, color, sort_order) AS (
  VALUES
    ('R&D',        'rnd',        '#4A78C4', 4),
    ('Clinical',   'clinical',   '#3DB87A', 5),
    ('Regulatory', 'regulatory', '#E8A840', 6)
)
INSERT INTO teams (name, slug, color, sort_order)
SELECT s.name, s.slug, s.color, s.sort_order
FROM dept_seed s
WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.slug = s.slug);

UPDATE teams SET sort_order = 1 WHERE slug = 'operations';
UPDATE teams SET sort_order = 2 WHERE slug = 'marketing';
UPDATE teams SET sort_order = 3 WHERE slug = 'sales';
UPDATE teams SET sort_order = 4, name = 'R&D' WHERE slug = 'rnd';
UPDATE teams SET sort_order = 5 WHERE slug = 'clinical';
UPDATE teams SET sort_order = 6 WHERE slug = 'regulatory';
UPDATE teams SET sort_order = 7 WHERE slug = 'ewan';
UPDATE teams SET sort_order = 8 WHERE slug = 'max';
UPDATE teams SET sort_order = 9 WHERE slug = 'marek_jr_';

SELECT slug, name, sort_order FROM teams ORDER BY sort_order;
