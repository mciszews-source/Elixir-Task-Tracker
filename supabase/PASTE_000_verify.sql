SELECT 'sql_editor_ok' AS check_name, 1 AS ok;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('teams', 'tasks', 'projects', 'profiles', 'project_phases')
ORDER BY table_name;
