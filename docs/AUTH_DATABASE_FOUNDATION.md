# Auth + Database Foundation

Phase 2 sets up the backend foundation without changing the public browsing flow.

## Stack

- PostgreSQL as the primary relational database
- Prisma ORM for schema and type-safe queries
- Auth.js (`next-auth`) with credentials login
- JWT session strategy for the initial auth phase

## Models included

- `User`
- `Product`
- `Order`
- `OrderItem`
- `Wallet`
- `Transaction`

## Why JWT sessions for now

This phase keeps the schema limited to the business models above. Using JWT sessions means we do not need to introduce Auth.js adapter tables such as `Account`, `Session`, or `VerificationToken` yet.

## Commands

```bash
corepack pnpm run db:generate
corepack pnpm run db:push
corepack pnpm run db:studio
```

## Environment

Copy `.env.example` to `.env` and update:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`

`prisma generate` can still run with the local fallback URL from `prisma.config.ts`, but any real database command should point `DATABASE_URL` to your PostgreSQL instance.

## Current scope

- Prisma schema is ready
- Prisma client singleton is ready
- Auth.js route handler is ready at `/api/auth/[...nextauth]`
- Password hashing helpers are ready
- Dashboard is not protected yet in this phase

## Recommended next step

Phase 3 should add:

- auth pages (`/login`, `/register`)
- user registration flow with password hashing
- seeded admin/user accounts
- route protection for dashboard and future order/wallet pages
