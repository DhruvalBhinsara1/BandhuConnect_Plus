# BandhuConnect+ Project Structure

## Root Folders

- `src/` — Main application source code

  - `assets/` — Images, icons, and static assets
  - `components/` — Reusable UI components
  - `constants/` — App-wide constants
  - `context/` — React context providers
  - `design/` — Design system and theme files
  - `hooks/` — Custom React hooks
  - `lib/` — Utility libraries
  - `navigation/` — Navigation logic
  - `screens/` — App screens (admin, volunteer, etc.)
  - `services/` — API and business logic services
  - `theme/` — Theme and style tokens
  - `types/` — TypeScript types
  - `utils/` — Utility functions

- `database/` — SQL files, setup guides, and migrations
- `docs/` — Documentation, guides, and API references
- `guidelines/` — Design and development guidelines
- `supabase/` — Supabase SQL, policies, and schema

## Key Screens

- `src/screens/admin/` — Admin dashboard and management screens
- `src/screens/volunteer/` — Volunteer dashboard and profile screens

## Services

- `src/services/` — Handles authentication, assignment, notifications, location, etc.

## Documentation

- `README.md` — Main project overview
- `PROJECT_STRUCTURE.md` — This file
- `docs/` — Feature guides, API docs, and setup instructions

## Database

- `database/schema/` — Current and production schema
- `database/migrations/` — Migration scripts
- `database/testing/` — Demo/testing SQL files (now cleaned up)

## Supabase

- `supabase/schema.sql` — Main schema
- `supabase/rls_policies.sql` — Row-level security policies

## Guidelines

- `guidelines/` — Design and development best practices

---

For more details, see `README.md` and `docs/`.
