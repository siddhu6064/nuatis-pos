# Nuatis POS

## Overview

Throwaway UX prototype for Nuatis POS — a service-based point-of-sale system for salons. Validates UX flow and visual hierarchy on a tablet-sized screen (iPad portrait, 1024×768). Salon vertical only. No real payments.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite (react-vite artifact) at `/`
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Replit Auth (OpenID Connect with PKCE)
- **Fonts**: Epilogue (service names), Fraunces (prices/brand), JetBrains Mono (durations/clock)

## Architecture

- `artifacts/nuatis-pos/` — React + Vite frontend (auth-gated register screen)
- `artifacts/api-server/` — Express API server (auth routes, sessions)
- `lib/db/` — PostgreSQL schema (users, sessions tables for Replit Auth)
- `lib/replit-auth-web/` — Replit Auth browser hook (`useAuth`)
- `lib/api-spec/openapi.yaml` — API contract (auth endpoints)

## Key Files

- `artifacts/nuatis-pos/src/lib/services.ts` — 12 hardcoded salon services
- `artifacts/nuatis-pos/src/components/ServiceTile.tsx` — Color-coded tap tile
- `artifacts/nuatis-pos/src/components/Header.tsx` — Brand + live clock + logout
- `artifacts/nuatis-pos/src/App.tsx` — Auth gate (login vs register)

## Services (Batch 1 — hardcoded)

| Category | Color |
|---|---|
| cuts | `#FBCFE8` (pink) |
| color | `#FEF3C7` (cream) |
| treatments | `#E9D5FF` (lavender) |
| styling | `#FED7AA` (peach) |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Prototype Notes

This is a throwaway UX prototype (Batch 1). Do NOT use as basis for production POS build.
- No cart, no checkout, no tip — planned for Batch 2+
- No state management library — plain useState only
- No responsive optimization — tablet portrait only
- Tile tap logs to console only; cart logic comes later

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
