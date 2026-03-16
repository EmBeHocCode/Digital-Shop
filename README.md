# Digital-Shop

Digital-Shop is the main root web application for a digital-services marketplace built with Next.js App Router. The current platform combines a public storefront, product configuration flows, customer account tools, internal admin operations, and a deep Prisma/PostgreSQL schema that is already prepared for payments, fulfillment, analytics, and future AI integrations.

The repository also contains:

- [`bot-AI/apps`](./bot-AI/apps): a separate AI bot workspace for future integration
- [`ai-service`](./ai-service): supporting AI service/infrastructure code

Those workspaces are intentionally separate. The main shipping web application lives in the repository root.

## Current Platform Scope

### Public storefront

- marketing landing page
- services catalog
- detailed service pages for:
  - VPS
  - Cloud Server
  - Giftcard
  - Game Cards
  - SIM numbers
  - Phone recharge / top-up

### Commerce and account

- login and registration
- email verification
- forgot/reset password
- cart and checkout
- order creation and order history
- wallet summary and transaction history
- purchased products
- billing overview
- profile and settings

### Internal operations

- role-aware management area under `/dashboard/admin`
- admin orders management
- admin users/customer management
- admin wallet/transaction operations
- admin products management
- internal SQL manager tooling

### Platform/data foundation

- Prisma + PostgreSQL
- NextAuth credentials auth
- Stripe payment initiation and webhook synchronization
- wallet/manual payment paths
- fulfillment and digital-delivery schema foundation
- analytics, inventory, market, and AI-ready data models

## Current Feature Summary

| Domain | Current state |
| --- | --- |
| Public landing | Implemented and visually polished |
| Services catalog | Implemented with Prisma-backed reads plus safe fallback content |
| Product configurator | Strong for all six product types, but still largely code-driven |
| Auth | Implemented: login, register, anti-bot login challenge, email verification, forgot/reset password |
| Customer account | Implemented: profile, settings, orders, wallet, billing, purchased products |
| Checkout and orders | Implemented with server-side price recalculation and persisted order item configuration |
| Wallet | Implemented foundation with balances, transactions, and top-up request flow |
| Billing | Implemented foundation with payment history and invoice-like records derived from paid orders |
| Payment | Stripe payment initiation and webhook sync are implemented; wallet and manual transfer flows also exist |
| Admin/operations | Implemented foundation for orders, users, wallet, products, and SQL manager |
| Fulfillment | Schema foundation exists, runtime automation is still partial |
| AI/data foundation | Strong schema/services foundation, but no root-app AI UI yet |

## Current Route Map

### Public routes

- `/`
- `/access-denied`
- `/services`
- `/services/[slug]`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/verify-email/pending`
- `/cart`
- `/checkout`
- `/order/success`
- `/payment/stripe/cancel`

### Authenticated customer/account routes

- `/dashboard`
- `/dashboard/profile`
- `/dashboard/orders`
- `/dashboard/orders/[orderId]`
- `/dashboard/wallet`
- `/dashboard/purchased-products`
- `/dashboard/purchased-products/[productId]`
- `/dashboard/billing`
- `/dashboard/settings`

### Internal admin routes

- `/dashboard/admin`
- `/dashboard/admin/orders`
- `/dashboard/admin/orders/[orderId]`
- `/dashboard/admin/users`
- `/dashboard/admin/users/[userId]`
- `/dashboard/admin/wallet`
- `/dashboard/admin/products`
- `/dashboard/admin/sql-manager`

### Important API areas

- `/api/auth/[...nextauth]`
- `/api/auth/register`
- `/api/auth/verify-email`
- `/api/auth/resend-verification`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/orders`
- `/api/payments/stripe/webhook`
- `/api/wallet`
- `/api/wallet/topups`
- `/api/account/settings`
- `/api/admin/orders/[orderId]`
- `/api/admin/users/[userId]`
- `/api/admin/wallet/adjustments`
- `/api/admin/products`
- `/api/admin/products/[productId]`
- `/api/admin/database/*`

## Architecture Overview

The active application is organized around the root App Router and feature modules:

```text
app/
  (auth)/
  (public)/
  api/
  dashboard/
components/
  layout/
  shared/
  ui/
features/
  account/
  admin/
  ai/
  auth/
  cart/
  catalog/
  dashboard/
  landing/
  orders/
  payment/
  wallet/
lib/
  auth/
  constants/
  db/
  mail/
  payments/
prisma/
store/
types/
docs/
```

Key notes:

- [`app`](./app) is the active web application
- [`src`](./src) still contains legacy/older route trees and admin code, but it is not the active shipping app
- [`bot-AI/apps`](./bot-AI/apps) is a separate AI bot workspace
- [`ai-service`](./ai-service) is separate service/infrastructure code

## Documentation Map

- [`README.md`](./README.md): public overview, repository boundary, setup, and honest current-state summary
- [`docs/CURRENT_PROJECT_AUDIT.md`](./docs/CURRENT_PROJECT_AUDIT.md): deepest implementation audit and current-state source of truth
- [`docs/PROJECT_STATUS_OVERVIEW.md`](./docs/PROJECT_STATUS_OVERVIEW.md): shorter snapshot of the current root web app
- [`docs/DATABASE_SCOPE_MAP.md`](./docs/DATABASE_SCOPE_MAP.md): data-source, schema, and runtime-usage map

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives
- Recharts

### Backend

- Next.js route handlers
- Prisma 7
- PostgreSQL
- NextAuth credentials auth
- Nodemailer
- Stripe

### State and forms

- Zustand
- React Hook Form
- Zod

### Tooling

- pnpm
- ESLint
- TypeScript typecheck
- Prisma seed/generate/db push scripts
- Docker Compose for local Postgres

## Role Model

The current root web app supports these practical roles:

- `CUSTOMER`: storefront and customer account usage
- `STAFF`: limited internal operational access
- `MANAGER`: broader internal operational and commercial access
- `ADMIN`: full management access in the root app
- `SUPERADMIN`: highest internal role, currently treated close to admin for most root-app operations

Current compatibility note:

- customer pages still live under `/dashboard/*`
- management/admin pages live under `/dashboard/admin/*`
- this works today, but it is still a semantically mixed route model and remains a likely future cleanup target

## Setup and Run

### 1. Install dependencies

```bash
corepack enable
corepack pnpm install
```

### 2. Configure environment

Copy [`/.env.example`](./.env.example) to `.env.local` and fill in the values you need.

Important variables include:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MAIL_FROM`
- `MAIL_REPLY_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

### 3. Start local database

If you use the provided Docker setup:

```bash
corepack pnpm run db:up
```

### 4. Sync schema and seed data

```bash
corepack pnpm run db:push
corepack pnpm run db:seed
```

### 5. Run the app

```bash
corepack pnpm run dev:3001
```

Open:

- `http://localhost:3001`
- or your current LAN URL if you are testing across devices

## Common Commands

```bash
corepack pnpm run dev:3001
corepack pnpm run build
corepack pnpm run lint
corepack pnpm exec tsc --noEmit
corepack pnpm run db:generate
corepack pnpm run db:push
corepack pnpm run db:migrate
corepack pnpm run db:seed
corepack pnpm run db:studio
corepack pnpm run db:down
```

## Current Status and Known Gaps

The project is beyond prototype stage and is now an advanced MVP / pre-production operations build. The strongest areas are the storefront, configurators, account flows, order/wallet foundation, and the breadth of the Prisma schema.

The biggest current gaps are:

- fulfillment automation is not fully implemented
- invoice/export/tax-grade billing is still incomplete
- wallet top-up settlement is still review/manual
- customer settings do not yet support password change, avatar upload, or device/session management
- admin product management does not yet manage deep commerce data such as option groups, denominations, SIM inventory, media, or FAQs
- there is no dedicated admin billing/reconciliation page yet
- the root app has AI-ready data/services, but no end-user AI assistant UI yet
- legacy code still exists under [`src`](./src) and can confuse maintenance if not clearly treated as inactive

Payment state clarification:

- Stripe payment initiation and webhook synchronization are implemented
- billing history is present
- invoice export, reconciliation, and fuller finance operations are still incomplete

## Recommended Next Steps

1. Build fulfillment automation around `ServiceProvision` and `DigitalDelivery`.
2. Add billing/reconciliation operations and real invoice export.
3. Expand admin product operations to manage options, inventory, media, and FAQs from the root app.
4. Improve account security lifecycle with password change, session/device management, and richer preferences.
5. Decide whether the customer area should eventually move from `/dashboard/*` to a clearer `/account/*` model while preserving compatibility.

## Documentation

- [Current project audit](./docs/CURRENT_PROJECT_AUDIT.md)
- [Project status overview](./docs/PROJECT_STATUS_OVERVIEW.md)
- [Database scope map](./docs/DATABASE_SCOPE_MAP.md)
- [Agents guide](./AGENTS.md)

