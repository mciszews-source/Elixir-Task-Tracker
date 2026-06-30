SELECT
  EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') AS schema_001_done,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role')
    THEN 'SKIP PASTE_001 — already applied (user_role exists is normal)'
    ELSE 'RUN PASTE_001_schema.sql — schema not installed yet'
  END AS next_step;
