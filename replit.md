# MyBeautify Cosmetics Store

MyBeautify is a premium cosmetics storefront for discovering products, saving favorites, and managing a shopping bag.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mybeautify-store/src/` — React storefront routes, shared shell, product cards, cart, auth, wishlist, and account screens
- `artifacts/api-server/src/routes/catalog.ts` — catalog, cart, wishlist, coupon, auth, and order API routes
- `lib/api-spec/openapi.yaml` — source of truth for storefront API contracts
- `lib/api-client-react/src/generated/` — generated React Query client used by the storefront

## Architecture decisions

- The storefront uses the shared `/api` service routing rather than a Vite proxy or hardcoded host.
- The initial catalog uses a small in-memory API seed so the primary shopping experience is usable before persistence is added.
- The frontend consumes generated API hooks from the OpenAPI contract instead of hand-written request types.

## Product

Users can browse and search a curated catalog, filter by category or brand, inspect product details and reviews, save products, manage a cart, validate a promo code, sign in or register, and place demo orders.

## User preferences

The requested storefront direction is premium, calm, responsive, and editorial, with original beauty-brand styling.

## Gotchas

- Regenerate the API client with `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
