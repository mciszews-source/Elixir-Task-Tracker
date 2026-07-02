CREATE TYPE user_role AS ENUM ('admin', 'executive', 'team_lead', 'member', 'viewer');
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'blocked', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE project_status AS ENUM ('active', 'on_hold', 'completed');
CREATE TYPE integration_provider AS ENUM ('asana', 'microsoft');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#1e40af',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_lead BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status project_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status task_status NOT NULL DEFAULT 'open',
  priority task_priority NOT NULL DEFAULT 'medium',
  sort_order NUMERIC NOT NULL DEFAULT 1000,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  is_on_board BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  external_id TEXT,
  external_source integration_provider,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider integration_provider NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  credentials JSONB NOT NULL DEFAULT '{}',
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_team_sort ON tasks (team_id, sort_order);
CREATE INDEX idx_tasks_team_status ON tasks (team_id, status, is_on_board);
CREATE INDEX idx_tasks_completed ON tasks (completed_at) WHERE status = 'done';
CREATE INDEX idx_activity_task ON activity_log (task_id, created_at DESC);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION handle_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status IS DISTINCT FROM 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_change BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION handle_task_status_change();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() = 'admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_team(tid UUID)
RETURNS BOOLEAN AS $$
  SELECT is_admin()
    OR auth_user_role() IN ('executive')
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = tid AND user_id = auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile role"
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Authenticated users can read teams"
  ON teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read team memberships"
  ON team_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read projects if team access"
  ON projects FOR SELECT TO authenticated
  USING (team_id IS NULL OR can_access_team(team_id));

CREATE POLICY "Team leads create projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (team_id IS NOT NULL AND can_access_team(team_id)
        AND auth_user_role() IN ('admin', 'team_lead'))
  );

CREATE POLICY "Read tasks if team access or executive"
  ON tasks FOR SELECT TO authenticated
  USING (can_access_team(team_id));

CREATE POLICY "Insert tasks in accessible teams"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (can_access_team(team_id) AND auth_user_role() IN ('admin', 'team_lead', 'member'))
  );

CREATE POLICY "Update tasks with permission"
  ON tasks FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR (can_access_team(team_id) AND auth_user_role() IN ('admin', 'team_lead'))
    OR (can_access_team(team_id) AND assignee_id = auth.uid())
  );

CREATE POLICY "Delete tasks team lead or admin"
  ON tasks FOR DELETE TO authenticated
  USING (
    is_admin()
    OR (can_access_team(team_id) AND auth_user_role() IN ('admin', 'team_lead'))
  );

CREATE POLICY "Read activity for accessible tasks"
  ON activity_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = activity_log.task_id AND can_access_team(t.team_id)
    )
  );

CREATE POLICY "Insert activity for accessible tasks"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = activity_log.task_id AND can_access_team(t.team_id)
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
