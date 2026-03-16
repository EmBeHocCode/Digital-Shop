# Current Project Audit

Last updated: 2026-03-16

Scope of this audit:

- main target is the root web application
- active app lives under [`app`](../app), [`components`](../components), [`features`](../features), [`lib`](../lib), [`prisma`](../prisma), [`store`](../store), [`types`](../types), and [`docs`](../docs)
- [`bot-AI/apps`](../bot-AI/apps) is a separate AI bot workspace and is not treated as the main web app here

Documentation authority note:

- this file is the deepest current-state implementation audit
- [`PROJECT_STATUS_OVERVIEW.md`](./PROJECT_STATUS_OVERVIEW.md) is the shorter snapshot
- [`DATABASE_SCOPE_MAP.md`](./DATABASE_SCOPE_MAP.md) focuses on data-source/runtime/schema mapping rather than route truth

Inspection method:

- route tree inspection of the root App Router
- service/component review of active feature modules
- schema review of [`prisma/schema.prisma`](../prisma/schema.prisma)
- review of auth/role helpers, APIs, and admin pages
- documentation comparison against actual code

## 1. Executive Summary

Digital-Shop is currently an advanced MVP / pre-production marketplace application. It is no longer just a marketing demo or UI prototype. The root web app already includes a public storefront, strong product configuration flows, authentication, account lifecycle pieces, real order creation, wallet and billing foundations, Stripe payment initiation with webhook synchronization, and a role-aware internal admin area.

Current maturity level:

- storefront: substantial
- account and order flow: substantial
- internal operations: substantial foundation
- payments: partially real, not fully operationally complete
- fulfillment: schema-ready, runtime still incomplete
- AI/web integration: data-ready, UI/runtime not yet present

Biggest strengths:

- strong product purchase UX for all supported product types
- deep Prisma schema with room for scale
- real order, transaction, payment-intent, and email-token lifecycle
- role-aware customer and admin separation in the active root app
- admin operations foundation already migrated into the root App Router

Biggest risks:

- documentation was behind code and could mislead maintainers
- legacy inactive code under [`src`](../src) still exists and can be mistaken for the active app
- [`proxy.ts`](../proxy.ts) is stale relative to the current NextAuth/`/dashboard` architecture
- product operational data management is still shallower than the underlying schema
- fulfillment, invoicing, reconciliation, and security lifecycle are not fully closed

## 2. Route Map

### Public routes

| Route | Intended role | Status | Notes |
| --- | --- | --- | --- |
| `/` | public | Fully implemented | Strong landing/marketing page with role-aware CTA behavior. |
| `/access-denied` | public | Fully implemented | Used for blocked role or access cases. |
| `/services` | public | Fully implemented | Prisma-backed catalog with fallback content. |
| `/services/[slug]` | public | Substantial | Strong product detail/configurator UX; still mostly driven by code-defined purchase configuration. |
| `/login` | public | Fully implemented | NextAuth credentials login plus anti-bot challenge. |
| `/register` | public | Fully implemented | Registration creates user + wallet and routes toward account/profile flow. |
| `/forgot-password` | public | Fully implemented | Email-driven reset request flow. |
| `/reset-password` | public | Fully implemented | Secure token validation and password reset. |
| `/verify-email` | public | Fully implemented | Token-based verification page and success/error states. |
| `/verify-email/pending` | public | Fully implemented | Waiting/resend verification UX. |
| `/cart` | public or signed-in user | Fully implemented | Local cart with persisted configuration. |
| `/checkout` | signed-in buyer for order creation | Substantial | Real order initiation, but billing/invoice/reconciliation remain incomplete. |
| `/order/success` | signed-in buyer | Substantial | Reads real order/payment state, but downstream fulfillment can still be empty. |
| `/payment/stripe/cancel` | internal payment redirect | Fully implemented | Stripe cancellation callback route. |

### Authenticated customer/account routes

| Route | Intended role | Status | Notes |
| --- | --- | --- | --- |
| `/dashboard` | management dashboard; customer redirect | Partial | Management users see overview; customers are redirected to profile. This works today but keeps customer and management semantics under the same prefix. |
| `/dashboard/profile` | customer + management | Fully implemented | Best current default account home for all signed-in users. |
| `/dashboard/orders` | customer + management | Fully implemented | Real order list with summary and detail links. |
| `/dashboard/orders/[orderId]` | customer + management | Fully implemented | Strong order detail view with persisted configuration display. |
| `/dashboard/wallet` | customer + management | Substantial | Wallet history and top-up request flow exist; top-up settlement is still manual/review. |
| `/dashboard/purchased-products` | customer + management | Substantial | Good ownership/history view, but depends on available fulfillment records. |
| `/dashboard/purchased-products/[productId]` | customer + management | Partial to substantial | Strong UI, but runtime depth depends on provisioning/delivery data that may not yet exist. |
| `/dashboard/billing` | customer + management | Partial to substantial | Billing summaries and invoice-like history exist, but no export/PDF/tax-grade invoices. |
| `/dashboard/settings` | customer + management | Partial | Only name/phone update is currently actionable. |

### Internal management/admin routes

| Route | Intended role | Status | Notes |
| --- | --- | --- | --- |
| `/dashboard/admin` | staff+ | Fully implemented | Root admin hub with role-aware shortcuts. |
| `/dashboard/admin/orders` | staff+ | Fully implemented | Search/filter/action surface for order operations. |
| `/dashboard/admin/orders/[orderId]` | staff+ | Fully implemented | Rich order detail for operations. |
| `/dashboard/admin/users` | admin+ | Fully implemented | Search/filter/update role or activation state. |
| `/dashboard/admin/users/[userId]` | admin+ | Fully implemented | User detail with orders, wallet, preferences, and security events. |
| `/dashboard/admin/wallet` | manager+ | Fully implemented | Wallet exposure, transaction review, manual adjustment foundation. |
| `/dashboard/admin/products` | manager+ | Partial | Good top-level product manager, but not deep enough for option groups/media/inventory operations. |
| `/dashboard/admin/sql-manager` | admin/superadmin | Substantial | Powerful internal database tool with row/column/table CRUD and query execution; lacks audit/guardrail depth. |

### API routes

| Route area | Status | Notes |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | Fully implemented | Credentials auth via NextAuth. |
| `/api/auth/register` | Fully implemented | Creates user + wallet. |
| `/api/auth/verify-email` | Fully implemented | Token verification endpoint. |
| `/api/auth/resend-verification` | Fully implemented | Resend verification email flow. |
| `/api/auth/forgot-password` | Fully implemented | Reset request endpoint. |
| `/api/auth/reset-password` | Fully implemented | Password reset endpoint. |
| `/api/orders` | Fully implemented | Order creation + current-user order retrieval. |
| `/api/payments/stripe/webhook` | Fully implemented | Real Stripe webhook sync path. |
| `/api/wallet` | Fully implemented | Wallet summary retrieval. |
| `/api/wallet/topups` | Substantial | Creates top-up requests; settlement still manual. |
| `/api/account/settings` | Partial | Only supports basic profile update. |
| `/api/admin/orders/[orderId]` | Fully implemented | Admin order status/payment lifecycle actions. |
| `/api/admin/users/[userId]` | Fully implemented | Admin role/state changes. |
| `/api/admin/wallet/adjustments` | Fully implemented | Manual wallet adjustment foundation. |
| `/api/admin/products` and `/api/admin/products/[productId]` | Partial | CRUD for top-level product fields only. |
| `/api/admin/database/*` | Substantial | Internal DB tooling, high power, needs operational guardrails. |

## 3. Feature Inventory

| Domain | Current state | Notes |
| --- | --- | --- |
| Landing/marketing | Implemented | Strong, polished, still mostly content-driven from code/data files. |
| Services catalog | Implemented | DB-backed when active products exist, with safe fallback. |
| Product detail/configurator | Strong | High realism in UI; source of truth is still mostly code-defined purchase config. |
| Auth | Strong | Login, register, verify email, forgot/reset password, anti-bot login. |
| Profile/settings | Partial to strong | Profile is good; settings mutation scope is still narrow. |
| Cart | Strong | Supports multiple configurations for same slug and persists locally. |
| Checkout | Strong foundation | Real order creation and payment initiation; still not fully enterprise-grade billing. |
| Orders | Strong | User list/detail and admin ops both exist. |
| Wallet | Strong foundation | Summary/history good; top-up settlement still incomplete. |
| Purchased products | Substantial | Good aggregation and detail pages; fulfillment data can still be sparse. |
| Billing/invoices | Partial | Billing overview exists; invoices are derived, not standalone/exportable. |
| Admin/internal tools | Substantial | Orders, users, wallet, products, SQL manager are present. |
| Role gating | Strong | Centralized helpers and route-aware nav visibility. |
| Payment integration | Substantial | Stripe card flow is real; other providers remain foundational/manual. |
| Fulfillment foundation | Partial | Schema exists, runtime automation not in place. |
| AI/service integration | Foundation only | DB and services exist, but root web app has no AI assistant UI/API yet. |

## 4. Product Experience Audit

| Product type | UI completeness | Data richness | Configuration depth | Realism | What is still missing |
| --- | --- | --- | --- | --- | --- |
| VPS | Strong | High in UI, medium in DB runtime | CPU, RAM, storage, region, OS, billing cycle | High for an MVP storefront | Provisioning automation, availability/stock rules, admin editing of option data |
| Cloud Server | Strong | High in UI, medium in DB runtime | Similar depth to VPS | High | Same gap as VPS; no real infra provisioning state yet |
| Giftcard | Strong | Medium-high | Brand, denomination, quantity, delivery note | Good | Real stock/provider integration, delivery fulfillment records, provider reconciliation |
| Game Cards | Strong | Medium-high | Brand, denomination, quantity | Good | Same gaps as giftcard plus real code delivery workflows |
| SIM numbers | Strong | Medium-high | Provider, category, searchable number list | Good | Real SIM inventory management and reservation workflow |
| Phone Recharge / Top-up | Strong | Medium | Carrier, denomination, target phone number | Good | Provider integration, confirmation/retry/reconciliation workflow |

Overall assessment:

- UI completeness is one of the strongest parts of the product
- realism is high for the storefront layer
- operational data is still shallower than the purchase UX
- admin cannot yet manage all deep commerce structures that the storefront depends on

## 5. Profile / Account Audit

### Implemented

- profile page and account overview
- settings page with live update of `name` and `phone`
- login/register
- email verification issuance and verification
- resend verification
- forgot password
- reset password
- role-aware default signed-in path
- access gating between customer and management/admin users

### Partial

- avatar/media support:
  - display exists via `image`
  - upload/edit flow is not implemented in the active root app
- notification preferences:
  - `UserPreference` exists in schema
  - UI editing is not implemented
- security lifecycle:
  - email verification and reset exist
  - in-account password change, session/device management, and MFA do not
- billing identity/contact info:
  - order contact fields exist
  - no dedicated billing profile or invoice identity management form

### Missing

- password change page for signed-in users
- device/session history
- avatar upload
- communication preferences editing
- account deletion / closure workflow

## 6. Orders / Wallet / Billing Audit

### Orders

- order list: implemented
- order detail: implemented
- pricing breakdown: implemented
- payment status flow: implemented
- persisted product configuration: implemented via `OrderItem.metadata`
- refund support: foundational, not fully closed operationally

### Wallet

- wallet summary: implemented
- transaction history: implemented
- manual top-up request: implemented
- top-up settlement: partial/manual
- manual adjustment foundation: implemented for admin

### Billing

- billing summary: implemented
- billing transaction view: implemented
- invoice history: partial, derived from paid orders
- invoice export: missing
- reconciliation tooling: missing as a dedicated admin feature

### Payment status flow

- wallet payments: implemented
- Stripe card payment initiation: implemented
- Stripe webhook sync: implemented
- manual bank transfer/manual confirmation: foundational
- payment cancel/failure handling: implemented for Stripe path

## 7. Admin / Internal Operations Audit

### Route structure

The active admin area in the root app is now real, not just a placeholder:

- `/dashboard/admin`
- `/dashboard/admin/orders`
- `/dashboard/admin/users`
- `/dashboard/admin/wallet`
- `/dashboard/admin/products`
- `/dashboard/admin/sql-manager`

### Role hierarchy

Current roles in schema and helpers:

- `CUSTOMER`
- `STAFF`
- `MANAGER`
- `ADMIN`
- `SUPERADMIN`

Strength:

- permissions are centralized in [`lib/auth/role-helpers.ts`](../lib/auth/role-helpers.ts)

Gap:

- a dedicated billing/admin finance section is still missing even though permissions helper support exists

### Domain-by-domain

| Area | Current state | Notes |
| --- | --- | --- |
| Admin dashboard shell/navigation | Strong | Role-aware and aligned with current dashboard style. |
| Order operations | Strong | Search/filter/status actions/detail view present. |
| User/customer management | Strong | Role updates, active/inactive controls, detail page present. |
| Wallet/transaction operations | Strong foundation | Good review surface and manual adjustment foundation. |
| Product management | Partial | Good for top-level records; shallow for rich commerce data. |
| Billing/payment management | Partial/missing | No dedicated admin billing page or reconciliation workspace. |
| SQL manager | Powerful but high-risk | Capable internal tool, but lacks audit/approval safeguards. |

### Legacy migration note

There is still a broad legacy admin tree under [`src/app/(admin)`](../src/app/%28admin%29) plus legacy staff/public/profile trees. These do not appear to be the active shipping app, but they increase maintenance friction and migration confusion.

## 8. Data Model / Schema Audit

### Strengths

- comprehensive role support
- strong commerce core:
  - `User`
  - `Product`
  - `Order`
  - `OrderItem`
  - `Wallet`
  - `Transaction`
- good account/security foundation:
  - `UserPreference`
  - `SecurityEvent`
  - `PasswordResetToken`
  - `EmailVerificationToken`
- payment foundation:
  - `PaymentIntent`
  - `PaymentWebhookEvent`
  - `RefundRequest`
- fulfillment foundation:
  - `ServiceProvision`
  - `DigitalDelivery`
- product operations foundation:
  - media
  - FAQs
  - option groups
  - denominations
  - inventory numbers
- AI/BI foundation is already richer than most MVP schemas

### Risks

- schema breadth is ahead of runtime/admin tooling in several domains
- product configuration persistence relies heavily on JSON metadata
- billing/invoice model is still weaker than payment/order model
- mixed strategy of static config + DB catalog can drift if not governed carefully

### Overbuilt areas

- BI/AI and analytics entities are ahead of what the root web app currently exposes
- legacy `src/` route trees duplicate concerns that are already handled in the root App Router

### Underbuilt areas

- invoice/export support
- provisioning/digital-delivery runtime
- customer security/session lifecycle
- deep admin product operations
- billing/reconciliation operations

## 9. UI/UX Audit

### Strengths

- public storefront has a coherent premium direction
- dark/light support is present across the main surfaces
- product configurators feel realistic and commerce-oriented
- account detail pages use consistent cards, status badges, and metadata blocks
- access denied and loading states exist in important areas

### Friction points

- customer routes still live under `/dashboard/*`, which semantically reads as management even though the UX has been improved
- some copy in account pages still references older “future phase” assumptions and is now stale relative to current features
- admin SQL manager is powerful, but dense on medium-width screens and still less spreadsheet-like than tools such as phpMyAdmin
- management overview and customer account live in the same high-level route namespace, which can blur mental models

### Compatibility assessment

- responsiveness: generally good, with some admin-tool density issues
- dark/light compatibility: generally good
- loading/empty/access-denied states: present in key surfaces
- interaction polish: good in storefront and account pages; operational tooling is functional but less refined

## 10. Missing Things Checklist

1. Fulfillment automation for `ServiceProvision` and `DigitalDelivery`
2. Dedicated admin billing/reconciliation page
3. Real invoice model, export, and printable/PDF invoice flow
4. Signed-in password change flow
5. Avatar upload/media management for customer profile
6. Notification preferences editing and communication controls
7. Deep admin product operations for option groups, denominations, media, FAQs, and inventory numbers
8. Wallet top-up approval/settlement workflow
9. Customer-facing refund lifecycle and richer post-payment support flow
10. Root-app AI assistant UI/API that uses the existing BI foundation

## 11. Prioritized Recommendations

### P0 critical

- align documentation with the current codebase and keep it updated
- remove or replace stale runtime guard logic in [`proxy.ts`](../proxy.ts)
- add a dedicated billing/reconciliation admin surface so real payment states are operationally reviewable

### P1 very important

- implement fulfillment automation for paid orders
- deepen admin product operations to manage the actual commerce structures used by the storefront
- add password change and richer account security lifecycle for signed-in users

### P2 useful next

- improve SQL manager guardrails and audit trail
- clarify customer vs management mental model, either through wording or a cleaner route strategy
- add invoice export and legal/trust pages

### P3 optional polish

- improve inline data editing ergonomics in SQL manager
- add richer empty states and guidance around provisioning/delivery history
- connect the AI/BI foundation to admin insight surfaces

## 12. Recommended Next Phases

### Phase A: Fulfillment & Finance Operations

Goal:

- close the loop after payment so paid orders actually move through provisioning, delivery, billing review, and supportable post-payment states

Scope:

- automate `ServiceProvision` / `DigitalDelivery`
- add `/dashboard/admin/billing`
- add invoice export foundation
- add refund review workflow
- add wallet top-up review/approval flow

### Phase B: Product Operations Deepening

Goal:

- make admin product management strong enough to operate the storefront without code edits

Scope:

- manage product option groups and option values
- manage denominations
- manage SIM inventory numbers
- manage product media and FAQs
- connect admin product editor to runtime product-commerce data

### Phase C: Account Security & Trust

Goal:

- make the customer account lifecycle production-leaning, not just functional

Scope:

- add signed-in password change
- add avatar upload
- add notification preferences UI
- add session/device management foundation
- add trust/support/legal pages and billing identity cleanup

## Appendix: Important Observations

### Active app vs legacy app

The active application is the root App Router under [`app`](../app). The tree under [`src/app`](../src/app) appears to be a legacy/older route structure and should not be confused with the current production path.

### Stale proxy layer

[`proxy.ts`](../proxy.ts) still targets `/profile`, `/staff`, and `/admin` with old cookie names and does not reflect the active NextAuth + `/dashboard` structure. This appears to be stale. That statement is grounded in direct file inspection.

