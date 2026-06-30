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
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read phases" ON project_phases;
CREATE POLICY "Read phases"
  ON project_phases FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins write phases" ON project_phases;
CREATE POLICY "Admins write phases"
  ON project_phases FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS phase_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE phase_docs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read docs" ON phase_docs;
CREATE POLICY "Read docs"
  ON phase_docs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins write docs" ON phase_docs;
CREATE POLICY "Admins write docs"
  ON phase_docs FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS tasks_external_id_uidx
  ON tasks (external_id)
  WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS project_phases_external_id_uidx
  ON project_phases (external_id)
  WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_uidx
  ON projects (slug)
  WHERE slug IS NOT NULL;
