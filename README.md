# Digital-Shop

Digital-Shop là một dự án `Next.js App Router` đang được nâng cấp dần từ UI prototype thành một digital services marketplace có backend thật, auth, order flow, wallet flow, product configurator, và nền dữ liệu sẵn sàng cho AI.

Repo này đang được phát triển theo hướng incremental:

- không rewrite toàn bộ app
- refactor theo phase
- giữ UI public hoạt động ổn định trong lúc mở rộng backend và data layer

## Trạng thái hiện tại

Main app hiện đã có:

- public landing page
- public services catalog
- service detail pages với configurator theo từng loại sản phẩm
- login / register
- anti-bot check ở login
- protected dashboard
- cart / checkout / order success flow
- order + wallet foundation có API thật
- Prisma + PostgreSQL + Auth.js foundation
- schema và service foundation mở rộng cho inventory / profitability / market intelligence / AI

Các lệnh kiểm tra hiện đang pass:

- `corepack pnpm lint`
- `corepack pnpm exec tsc --noEmit`
- `corepack pnpm build`

Lưu ý:

- `bot-AI/` là workspace riêng, không phải phần build chính của web app
- web app chính nằm ở root repo này

## Những gì đang có trên web

### Public routes

- `/`
- `/services`
- `/services/vps`
- `/services/cloud-server`
- `/services/giftcard`
- `/services/game-cards`
- `/services/sim`
- `/services/topup`
- `/login`
- `/register`
- `/cart`
- `/checkout`
- `/order/success`

### Protected routes

- `/dashboard`
- `/dashboard/orders`
- `/dashboard/wallet`
- `/dashboard/purchased-products`
- `/dashboard/billing`
- `/dashboard/settings`

### API routes

- `/api/auth/[...nextauth]`
- `/api/auth/register`
- `/api/orders`
- `/api/wallet`
- `/api/wallet/topups`
- `/api/account/settings`

## Tính năng đã có

### 1. Public landing + catalog

- landing page với hero, services, features, pricing, benefits, testimonials, FAQ
- catalog công khai cho 6 nhóm dịch vụ
- service detail pages thật, không còn chỉ là section trên landing
- routing public đã nối đồng bộ giữa header, CTA, catalog và dashboard

### 2. Product configurator

Hiện app đã support trải nghiệm mua hàng riêng cho:

- VPS
- Cloud Server
- Giftcard
- Game Cards
- SIM numbers
- Phone recharge / top-up

Các product pages hiện có:

- summary / highlights / ideal-for / operations
- option selectors theo loại sản phẩm
- dynamic pricing summary
- add-to-cart theo cấu hình
- loading states cho route detail

### 3. Auth + account

- credentials login qua Auth.js
- register flow thật
- password hashing
- duplicate email validation
- auto-create wallet khi đăng ký
- dashboard bảo vệ bằng session
- login anti-bot challenge
- settings page cập nhật profile thật

### 4. Cart / checkout / orders

- cart state bằng Zustand
- add / remove / update quantity / clear cart
- support nhiều cấu hình cho cùng một `slug`
- checkout tạo `Order`, `OrderItem`, `Transaction`
- server-side recalculation giá
- order success page
- config mua hàng đã persist vào `OrderItem`

### 5. Wallet / billing / purchased products

- wallet summary
- transaction history
- top-up request foundation
- billing overview
- purchased products page
- dashboard orders page

### 6. Data + AI foundation

Schema hiện đã mở rộng cho:

- marketing content
- product options / denominations / SIM inventory
- persisted cart foundation
- user preferences / security events / reset tokens
- payment intents / refunds / fulfillment
- inventory / cost / price / sales / market / forecast snapshots
- AI conversation / recommendation storage

Service foundation hiện có:

- `getMarketingContent`
- `getProductCommerceContext`
- `getUserCart`
- `getUserPreferences`
- `getBusinessIntelligenceContext`

Mục tiêu của foundation này là để sau này tích hợp bot AI vào web mà không phải query raw tables trực tiếp từ UI hoặc automation.

## Kiến trúc hiện tại

High-level repo shape:

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
  ai/
  auth/
  cart/
  catalog/
  dashboard/
  landing/
  orders/
  payment/
  wallet/
hooks/
lib/
  auth/
  constants/
  db/
  validations/
prisma/
store/
docs/
agents/
bot-AI/
```

Nguyên tắc tổ chức hiện tại:

- routing ở `app/`
- reusable primitives ở `components/ui`
- layout shells ở `components/layout`
- logic theo domain ở `features/*`
- data access ở `features/*/services` hoặc `lib/*`
- mở rộng dần theo use case thật, tránh over-engineering

## Tiến trình theo phase

### Phase 0 - Ổn định dự án

- khôi phục môi trường chạy
- sửa dependency / TypeScript issues
- thêm script `dev:3001`
- đưa project về trạng thái build được

### Phase 1 - Refactor structure + public product routes

- refactor repo sang `app + components + features`
- tạo `app/(public)` và `app/dashboard`
- chuyển layout/shared/dashboard/landing components vào đúng chỗ
- tạo `/services` và `/services/[slug]`
- nối landing sang page dịch vụ thật
- chỉnh charts đồng bộ dark/light

### Phase 2 - Auth + database foundation

- thêm Prisma + PostgreSQL + Auth.js
- tạo schema nền:
  - `User`
  - `Product`
  - `Order`
  - `OrderItem`
  - `Wallet`
  - `Transaction`
- thêm Prisma config, Prisma client singleton, auth route, password helpers

### Phase 3 - Auth UI + protected dashboard + cart flow

- build `/login`
- build `/register`
- triển khai registration flow thật
- bảo vệ `/dashboard`
- thêm cart store
- build `/cart`
- build `/checkout`
- build `/order/success`

### Phase 4 - Prisma-backed catalog + query/services foundation

- catalog đọc từ Prisma khi DB sẵn sàng
- fallback an toàn khi DB chưa có data
- thêm seed products
- thêm query/service layer cho:
  - catalog
  - orders
  - wallet
  - billing
  - settings

### Phase 5 - Orders + wallet + payment foundation

- real order creation từ checkout
- `Order` / `OrderItem` / `Transaction` flow thật
- wallet summary + transaction history + top-up request foundation
- protected dashboard pages cho orders và wallet
- payment foundation nhưng chưa gắn gateway thật

### Phase 6 - Product configurator + full account experience

- configurator cho 6 loại sản phẩm
- config-aware cart / checkout / order success
- thêm dashboard pages:
  - `purchased-products`
  - `billing`
  - `settings`
- update profile qua API thật

### Phase 7 - Database scope expansion + AI-ready foundation

- mở rộng Prisma schema cho marketing, product options, inventory, account preferences, payment, fulfillment, analytics, AI
- thêm shared data / seed foundation
- thêm service entry points cho marketing, commerce context, cart, preferences, business intelligence
- giữ fallback an toàn để web không bị buộc database-first quá sớm

## Dữ liệu hiện đang nằm ở đâu

Hiện web đang dùng 3 nguồn dữ liệu chính:

1. `PostgreSQL qua Prisma`
- user
- auth
- product catalog khi DB sẵn sàng
- order / wallet / transaction / billing / settings
- inventory / analytics / AI-ready foundation

2. `File code tĩnh`
- landing marketing content
- fallback catalog content
- product configurator options
- một phần chart/demo dashboard data

3. `Browser localStorage`
- cart runtime state
- local fallback cho một số UX trong cart/order success

Chi tiết hơn xem ở:

- [docs/DATABASE_SCOPE_MAP.md](./docs/DATABASE_SCOPE_MAP.md)

## Local development

Yêu cầu:

- Node.js
- `pnpm` qua `corepack`
- PostgreSQL local hoặc Docker

### Cách chạy local nhanh nhất

1. Bật PostgreSQL hoặc start container Docker đang dùng cho local.
2. Tạo file `.env.local`.
3. Đồng bộ schema:

```bash
corepack pnpm run db:push
```

4. Seed dữ liệu nền:

```bash
corepack pnpm run db:seed
```

5. Chạy app:

```bash
corepack pnpm run dev:3001
```

6. Mở một trong các địa chỉ:

- `http://localhost:3001`
- `http://192.168.1.2:3001`

### Script hữu ích

```bash
corepack pnpm run dev:3001
corepack pnpm run build
corepack pnpm run lint
corepack pnpm run db:generate
corepack pnpm run db:push
corepack pnpm run db:migrate
corepack pnpm run db:seed
corepack pnpm run db:studio
```

## Tài liệu liên quan

- [Project status overview](./docs/PROJECT_STATUS_OVERVIEW.md)
- [Database scope map](./docs/DATABASE_SCOPE_MAP.md)
- [AGENTS guide](./AGENTS.md)

## Hướng tiếp theo hợp lý

Các hướng phát triển tiếp theo đã được chuẩn bị nền:

- admin / product management
- inventory optimization
- profitability analytics
- market trend forecasting
- AI assistant / AI bot tích hợp trực tiếp vào web

Mục tiêu dài hạn của repo không còn là demo UI, mà là một nền tảng digital commerce có dữ liệu thật và sẵn sàng cho automation + AI.
