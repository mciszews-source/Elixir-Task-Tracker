ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_executive_request BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, 'user@local'), '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Enable insert for auth trigger" ON public.profiles;
CREATE POLICY "Enable insert for auth trigger"
  ON public.profiles FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;
CREATE POLICY "Admins manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (is_admin());
