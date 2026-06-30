-- Dev seed data (run after migration, with auth users created manually or via invite)

INSERT INTO teams (name, slug, color, sort_order) VALUES
  ('CEO Office', 'ceo-office', '#1e40af', 0),
  ('Operations', 'operations', '#7c3aed', 1),
  ('Finance', 'finance', '#059669', 2),
  ('Engineering', 'engineering', '#dc2626', 3);

-- After creating auth users for Marek and Ivan, run:
-- UPDATE profiles SET role = 'admin' WHERE email IN ('marek@elixir.com', 'ivan@elixir.com');

-- Sample project
INSERT INTO projects (name, description, status, team_id)
SELECT 'Q3 Board Prep', 'Investor and board meeting preparation', 'active', id
FROM teams WHERE slug = 'ceo-office';

-- Sample tasks (requires at least one profile id — replace in dev)
-- INSERT INTO tasks (team_id, title, status, priority, sort_order, is_on_board) ...
