# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start both frontend (Next.js) and backend (Convex) in parallel
npm run dev:frontend   # Next.js only (localhost:3000)
npm run dev:backend    # Convex dev server only
npm run build          # Production build
npm run lint           # ESLint with Convex rules
```

> `predev` runs automatically before `dev` — it waits for Convex to be ready and opens the dashboard.

## Architecture

This is a full-stack app using **Next.js 16 + Convex + Clerk**.

### Frontend (`app/`)
Next.js App Router. Client components use Convex hooks for real-time data; server components use `preloadQuery` for SSR data loading. The `app/server/` route demonstrates this pattern and is Clerk-protected via middleware (`proxy.ts`).

### Backend (`convex/`)
Serverless functions running on Convex:
- `myFunctions.ts` — queries and mutations for the `numbers` table
- `users.ts` — stores/syncs Clerk user identity into the `users` table on login
- `schema.ts` — database schema (`numbers`, `users` tables)
- `auth.config.ts` — Clerk JWT config (reads `CLERK_JWT_ISSUER_DOMAIN`)
- `_generated/` — auto-generated types, do not edit

### Auth + Data Flow
- `ConvexProviderWithClerk` (in `components/`) bridges Clerk auth and Convex
- Clerk middleware in `proxy.ts` guards the `/server` route
- User identity is stored in Convex via the `users.store` mutation on first login

### Environment Variables
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL (public)
- `CLERK_JWT_ISSUER_DOMAIN` — Clerk JWT issuer domain (server-side)
- Clerk publishable/secret keys (added automatically by Clerk setup)
