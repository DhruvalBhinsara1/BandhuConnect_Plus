# BandhuConnect+ Project Structure

## Root Folders

- `src/` — Main application source code
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

- `config/` — All configuration files
  - `app/` — App-specific configurations
    - `app.config.js` — Main Expo app configuration
    - `app.config.pilgrim.js` — Pilgrim app variant configuration
    - `app.config.volunteer.js` — Volunteer app variant configuration
  - `build/` — Build and development configurations
    - `babel.config.js` — Babel configuration
    - `metro.config.js` — Metro bundler configuration
    - `tailwind.config.js` — Tailwind CSS configuration
    - `tsconfig.json` — TypeScript configuration
  - `environment/` — Environment and styling files
    - `.env.example` — Environment variables template
    - `global.css` — Global CSS styles

- `database/` — Database related files
  - `schema/` — Database schema files
  - `migrations/` — Database migration scripts
  - `functions/` — Database functions
  - `maintenance/` — Database maintenance scripts
  - `testing/` — Database testing files
  - `demo/` — Demo data and setup scripts

- `docs/` — All documentation
  - `api/` — API documentation
  - `components/` — Component documentation
  - `database/` — Database documentation
  - `guides/` — User and developer guides
  - `project/` — Project overview and planning
  - `reference/` — Reference materials and changelogs
  - `setup/` — Setup and installation guides
  - `testing/` — Testing documentation
  - `ui/` — UI/UX design documentation

- `assets/` — Static assets
  - Images, icons, and other media files

- `scripts/` — Utility scripts
  - Build scripts, deployment scripts, and development utilities

- `supabase/` — Supabase configuration
  - Database schema, policies, and configuration

- `guidelines/` — Design and development guidelines
  - Color themes, frontend/backend guidelines, development roadmap

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
