# Elixir Executive Task Tracker

Internal leadership dashboard for cross-team task visibility, drag-and-drop prioritization, and daily reporting.

## Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) | Formal PRD, roles, MVP vs Phase 2 |
| [Prototype Analysis](docs/PROTOTYPE_ANALYSIS.md) | Inferred features from HTML prototype |
| [Architecture](docs/ARCHITECTURE.md) | Stack, schema, API plan, integrations |
| [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md) | Sprint-by-sprint build plan |
| [Setup Guide](docs/SETUP_GUIDE.md) | Supabase + Cloudflare step-by-step |

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**
- **Supabase** (Postgres, Auth, Realtime, RLS)
- **@dnd-kit** for drag-and-drop
- **TanStack Query** for server state

## Quick start

```bash
cp .env.example .env.local
# Add Supabase keys (optional for mock UI demo)

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the cross-team dashboard (mock data until Supabase is connected).

## Database setup

1. Create a Supabase project
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Run `supabase/seed.sql` for sample teams
4. Promote Marek and Ivan to admin:

```sql
UPDATE profiles SET role = 'admin'
WHERE email IN ('marek@elixir.com', 'ivan@elixir.com');
```

## Project structure

```
src/
├── app/
│   ├── (auth)/login/          # Auth entry
│   ├── (dashboard)/           # Main app screens
│   └── api/                   # Route handlers
├── components/
│   ├── layout/                # Shell, sidebar, top bar
│   ├── tasks/                 # Cards, board, DnD
│   ├── reports/               # Daily report components
│   └── projects/
├── hooks/                     # TanStack Query hooks
├── lib/                       # Supabase, permissions, utils
└── types/                     # Shared TypeScript types
```

## Next steps

See [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md) Phase 1:

1. Wire Supabase auth on `/login`
2. Replace mock data with live queries
3. Connect reorder API to Postgres + activity log
4. Enable Realtime subscriptions

## Note on source files

The HTML prototype (`elixir-task-tracker_4.html`) and meeting transcript were not in the repository at scaffold time. Add them to `docs/source/` to validate inferred UX against the built UI.
