# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The imported `AGENTS.md` is the source of truth for architecture (DDD + Clean Architecture layers, `Either`, auth flows, role rules). The notes below add what it does not cover. Project docs, UI copy, routes and commit messages are in Portuguese; domain vocabulary is in English.

## Hard rules

- **No comments in source code** (`//`, `/* */`, JSDoc, JSX/CSS comments). Document behavior changes in `AGENTS.md` instead, and keep it in sync.
- **Next.js 16.4 differs from training data.** Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code. `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `reactCompiler`; server pages that read the session export `export const instant = false`.
- `src/core`, `src/domain`, `src/application` must not import React, Next, better-auth, Drizzle, Zod or `process.env`.
- Never derive a user's role from the e-mail domain. Roles (`student` | `professor` | `admin`) come from `users.role`, written only server-side. `domain/enterprise/entities/institutional-email.ts` is legacy domain-based code that is not wired into any flow; do not reintroduce it.

## Commands

```bash
npm run dev                                   # dev server
npm run build                                 # production build
npm run lint                                  # biome check (lint + format check)
npm run lint:fix                              # biome check --write
npm test                                      # vitest run (all src/**/*.test.ts)
npx vitest run src/application/auth/sign-in.test.ts   # single file
npx vitest run -t "normaliza"                 # filter by test name
npm run db:generate | db:migrate | db:push | db:seed | db:studio
npm run email:dev                             # React Email preview at http://localhost:3001
```

Commits go through husky: `pre-commit` runs lint-staged (`biome check --write`), `commit-msg` runs commitlint with `@commitlint/config-conventional` (e.g. `feat: ...`, `fix: ...`).

Formatting (Biome): 2-space indent, 100 cols, single quotes, no semicolons, trailing commas, always-parenthesized arrow params. Path alias `@/` → `src/`.

## Things that span multiple files

- **Two migration sources.** Drizzle-kit migrations live in `drizzle/`; hand-written SQL in `src/db/migrations/*.sql` (favorites, project progress, admin user registration, social profiles, projects, compatibility checks, and project advisors/activation/verification) is **not** applied by `db:migrate` and must be run manually against Neon. Keep `schema.ts` consistent with both. The historical Drizzle snapshots do not contain every table managed by manual SQL, so review generated diffs carefully before accepting a migration; blindly generating one may propose creating existing tables again.
- **Beyond the auth slice**, much of the app does not follow the layered architecture:
  - Projects: `domain/.../project.ts` + `ProjectRepository` port + `application/projects/list-projects.ts`, but the only adapter is `infrastructure/projects/mock-project-repository.ts` (static mock data).
  - Route handlers under `src/app/api/` (`admin/users`, `profile`, `favorites`, `projects/[id]/progress`) and some server pages/components (`perfil`, `projetos/[id]`, `DashboardPage`) query Drizzle (`@/db`) directly and check the session via `auth` from `src/libs/auth.ts`. Access rules for project progress are in `src/libs/project-progress-access.ts`.
- **Server auth config** is `src/libs/auth.ts` (better-auth + Drizzle adapter, plural table names, optional Microsoft provider enabled only when `MICROSOFT_CLIENT_ID`/`SECRET` are set). The client composition root is `src/presentation/auth/auth-context.tsx`.
- Accounts are pre-provisioned (no self sign-up): via the admin panel (`/admin`, `/admin/usuarios/novo`, supports spreadsheet import via `xlsx` in `application/users/user-import.ts`) or `npm run db:seed` for development.

## Environment

Copy `.env.example` to `.env`: `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and optional `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_TENANT_ID` (default `organizations`). `drizzle.config.ts` throws if `DATABASE_URL` is missing.
