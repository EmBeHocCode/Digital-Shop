# Project Status Overview

Last updated: 2026-03-16

Authoritative deep audit:

- [Current project audit](./CURRENT_PROJECT_AUDIT.md)

## Current Snapshot

Digital-Shop is now an advanced MVP / pre-production marketplace in the root web app. The project already has:

- public storefront and services catalog
- realistic product configurators for six product types
- login/register, email verification, forgot/reset password
- cart, checkout, orders, wallet, billing, profile, and settings
- Stripe card-payment integration foundation with webhook sync
- role-aware customer area and internal admin area
- admin operations for orders, users, wallet, products, and SQL tooling
- a deep Prisma/PostgreSQL schema prepared for fulfillment, analytics, and AI

## Repository Boundary

The main web app lives in the repository root:

- [app](../app)
- [components](../components)
- [features](../features)
- [lib](../lib)
- [prisma](../prisma)
- [store](../store)
- [types](../types)

Separate workspaces:

- [bot-AI/apps](../bot-AI/apps)
- [ai-service](../ai-service)

## Current Route Groups

### Public

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

### Customer / account

- `/dashboard`
- `/dashboard/profile`
- `/dashboard/orders`
- `/dashboard/orders/[orderId]`
- `/dashboard/wallet`
- `/dashboard/purchased-products`
- `/dashboard/purchased-products/[productId]`
- `/dashboard/billing`
- `/dashboard/settings`

### Admin / internal

- `/dashboard/admin`
- `/dashboard/admin/orders`
- `/dashboard/admin/orders/[orderId]`
- `/dashboard/admin/users`
- `/dashboard/admin/users/[userId]`
- `/dashboard/admin/wallet`
- `/dashboard/admin/products`
- `/dashboard/admin/sql-manager`

## Current Strengths

- strong storefront and configurator experience
- real order/payment/wallet data flow
- real email verification and password reset lifecycle
- centralized role helpers and route-aware navigation
- internal admin operations are now present in the active root app
- Prisma schema is broad enough to support the next operational phases

## Current Gaps

- fulfillment automation is not complete
- invoice/export/reconciliation support is still incomplete
- wallet top-up still needs settlement/review workflow
- settings/security UX is still narrower than the schema foundation
- admin products management does not yet cover deep option/inventory/media operations
- root-app AI features are still foundation-only

## Operational Health

Latest verification status:

- `corepack pnpm lint`
- `corepack pnpm exec tsc --noEmit`
- `corepack pnpm build`

Current infrastructure notes:

- local Postgres can run through Docker helpers
- Stripe env keys are expected for real card checkout
- SMTP env config is expected for production email delivery
- development mail falls back to preview logging when SMTP is not configured

## Important Architecture Notes

- [`src`](../src) still contains a large legacy route tree and legacy admin/public/dashboard code, but it is not the active root app
- [`proxy.ts`](../proxy.ts) appears stale relative to the current NextAuth + `/dashboard` architecture and should be treated carefully

## Recommended Next Phases

### Phase A: Fulfillment & Billing Operations

- automate provisioning and digital delivery
- add admin billing/reconciliation workflows
- add invoice export
- add refund/top-up review lifecycle

### Phase B: Product Operations Deepening

- manage option groups, denominations, inventory numbers, FAQs, and media in admin
- reduce dependence on hardcoded purchase configuration definitions

### Phase C: Account Security & Trust

- add signed-in password change
- add avatar upload and richer preferences
- add session/device management and trust/legal/support surfaces

## Related Docs

- [README](../README.md)
- [Current project audit](./CURRENT_PROJECT_AUDIT.md)
- [Database scope map](./DATABASE_SCOPE_MAP.md)

