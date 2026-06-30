#!/usr/bin/env python3
from pathlib import Path
import re

def dq(tag: str, s: str) -> str:
    if s == "":
        return "''"
    t = tag
    n = 0
    while f"${t}$" in s:
        n += 1
        t = f"{tag}{n}"
    return f"${t}${s}${t}$"

def convert_row(line: str) -> str:
    line = line.strip().rstrip(",")
    parts = []
    # manual: legacy_id, slug, title, desc, priority, due, from_ewan, status, completed, sort
    m = re.match(r"\((\d+),", line)
    if not m:
        raise ValueError(line[:80])
    rest = line[m.end() :]
    slug_m = re.match(r"\s*'([^']*)',\s*", rest)
    slug = slug_m.group(1)
    rest = rest[slug_m.end() :]
    title_m = re.match(r"'((?:''|[^'])*)',\s*", rest)
    title = title_m.group(1).replace("''", "'")
    rest = rest[title_m.end() :]
    desc_m = re.match(r"'((?:''|[^'])*)',\s*", rest)
    desc = desc_m.group(1).replace("''", "'")
    rest = rest[desc_m.end() :]
    rest = re.sub(r"'(open|done)',\s*NULL,", r"'\1', NULL::timestamptz,", rest)
    lid = m.group(1)
    return (
        f"({lid}, '{slug}', {dq('t' + lid, title)}, {dq('d' + lid, desc)}, {rest}"
    )

INSERT = """INSERT INTO tasks (
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
  s.completed_at::timestamptz,
  s.sort_order,
  true,
  ('legacy:' || s.legacy_id::text)
FROM seed s
JOIN team_map tm ON tm.slug = s.slug
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t
  WHERE t.external_id = ('legacy:' || s.legacy_id::text)
);"""

def footer(slugs):
    sl = ",".join(f"'{s}'" for s in slugs)
    return f"""
SELECT t.slug, count(*) AS legacy_tasks
FROM tasks tk
JOIN teams t ON t.id = tk.team_id
WHERE tk.external_id LIKE 'legacy:%'
  AND t.slug IN ({sl})
GROUP BY t.slug
ORDER BY t.slug;
"""

def main():
    src = Path("supabase/migrations/003_prototype_seed.sql").read_text()
    m = re.search(
        r"seed\(legacy_id.*?VALUES\n(.*)\n\)\nINSERT INTO tasks",
        src,
        re.S,
    )
    all_rows = []
    for line in m.group(1).splitlines():
        line = line.strip()
        if line.startswith("("):
            slug = line.split(",")[1].strip().strip("'")
            all_rows.append((slug, convert_row(line)))

    def write(slugs, name):
        sl = ",".join(f"'{s}'" for s in slugs)
        rows = [r for slug, r in all_rows if slug in slugs]
        text = f"""WITH team_map AS (
  SELECT slug, id FROM teams WHERE slug IN ({sl})
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  {",\n  ".join(rows)}
)
{INSERT}
{footer(slugs)}"""
        Path(f"supabase/{name}").write_text(text)

    write(["operations", "marketing", "sales"], "PASTE_003c1_ops_mkt_sales.sql")
    write(["ewan"], "PASTE_003c2_ewan.sql")
    write(["max"], "PASTE_003c3_max.sql")
    write(["marek_jr_"], "PASTE_003c4_marek.sql")

    all_c = [r for _, r in all_rows]
    full = f"""WITH team_map AS (
  SELECT slug, id FROM teams
  WHERE slug IN ('operations','marketing','sales','ewan','max','marek_jr_')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  {",\n  ".join(all_c)}
)
{INSERT}

SELECT count(*) AS legacy_task_count FROM tasks WHERE external_id LIKE 'legacy:%';
"""
    Path("supabase/PASTE_003c_tasks.sql").write_text(full)
    print(len(all_rows))

if __name__ == "__main__":
    main()
