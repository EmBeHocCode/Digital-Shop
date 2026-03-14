# Project Status Overview

Last updated: 2026-03-15

## Summary

Digital-Shop hiện là một dự án `Next.js App Router` với:

- public landing page
- public services catalog
- auth foundation + auth UI
- product configurator UI theo từng loại dịch vụ
- cart / checkout / order flow thật
- wallet + billing foundation đã có UI dashboard
- dashboard shell đã có bảo vệ session
- backend foundation với Prisma + PostgreSQL + Auth.js

Chiến lược triển khai đến hiện tại là refactor tăng dần theo phase, không rewrite toàn bộ app.

## Latest completed phases

### Phase 5

- real order creation từ checkout
- `Order` / `OrderItem` / `Transaction` flow thật
- wallet summary + transaction history + top-up request foundation
- protected dashboard pages:
  - `/dashboard/orders`
  - `/dashboard/wallet`
- APIs:
  - `/api/orders`
  - `/api/wallet`
  - `/api/wallet/topups`

### Phase 6

- product configurator cho:
  - VPS
  - Cloud Server
  - Giftcard
  - Game Cards
  - SIM
  - Phone Recharge / Top-up
- config-aware cart / checkout / order success UX
- dashboard pages mới:
  - `/dashboard/purchased-products`
  - `/dashboard/billing`
  - `/dashboard/settings`
- profile update API:
  - `/api/account/settings`

### Phase 7

- mở rộng Prisma schema cho:
  - marketing content
  - product options / denominations / SIM inventory
  - persisted cart
  - user preferences / security events / reset tokens
  - payment intent / refund / fulfillment
  - inventory / cost / price / sales / market / forecast snapshots
  - AI conversation / recommendation storage
- thêm shared data + seed foundation cho marketing content và business intelligence baseline
- thêm read services:
  - `getMarketingContent`
  - `getProductCommerceContext`
  - `getUserCart`
  - `getUserPreferences`
  - `getBusinessIntelligenceContext`
- không rewrite UI hiện tại; các service mới đều giữ fallback an toàn khi DB chưa sẵn sàng

### Phase 8

- thêm dashboard profile page:
  - `/dashboard/profile`
- hoàn thiện order detail page:
  - `/dashboard/orders/[orderId]`
- thêm purchased product detail page:
  - `/dashboard/purchased-products/[productId]`
- thêm reusable detail UI blocks cho dashboard:
  - status badge
  - metadata card
  - pricing breakdown card
  - configuration summary card
  - detail page skeleton
- nối navigation từ:
  - dashboard overview
  - orders list
  - purchased products list
  - sidebar footer user card
- refactor parser cho `OrderItem.metadata` để đọc lại cấu hình đã persist
- dọn quality gate repo:
  - exclude `src/` legacy khỏi `tsc`
  - exclude `scripts/` khỏi `eslint`
  - xóa `postcss.config.js` cũ
  - đổi `middleware.ts` sang `proxy.ts` theo Next 16 convention

## Current website map

### Public pages

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

### Protected pages

- `/dashboard`
- `/dashboard/profile`
- `/dashboard/orders`
- `/dashboard/orders/[orderId]`
- `/dashboard/wallet`
- `/dashboard/purchased-products`
- `/dashboard/purchased-products/[productId]`
- `/dashboard/billing`
- `/dashboard/settings`

### API routes

- `/api/auth/[...nextauth]`
- `/api/auth/register`
- `/api/orders`
- `/api/wallet`
- `/api/wallet/topups`
- `/api/account/settings`

## Current repo shape

```text
app/
  (auth)/
  (public)/
  dashboard/
  api/
components/
  layout/
  shared/
  ui/
features/
  account/
  auth/
  cart/
  catalog/
  dashboard/
  landing/
  orders/
  wallet/
lib/
  auth/
  constants/
  db/
  validations/
hooks/
docs/
prisma/
store/
agents/
```

## What exists on the web right now

### Home page `/`

- public header
- hero section
- logo cloud
- services section
- features section
- pricing section
- benefits section
- testimonials section
- FAQ section
- public footer

### Services catalog `/services`

- catalog landing page
- stats summary block
- product/service cards
- links sang từng trang chi tiết
- safe fallback UI nếu database chưa có product active

### Service detail pages `/services/[slug]`

Hiện đã có các page thật:

- `/services/vps`
- `/services/cloud-server`
- `/services/giftcard`
- `/services/game-cards`
- `/services/sim`
- `/services/topup`

Mỗi page hiện có:

- service hero / summary
- feature list
- highlights
- ideal-for section
- operational advantages
- configurator riêng theo product type:
  - VPS / Cloud Server: CPU, RAM, storage, region, OS, billing cycle
  - Giftcard / Game Cards: brand, denomination, quantity, delivery note
  - SIM: provider, category, searchable number list
  - Top-up: carrier, denomination, phone input
- dynamic pricing summary
- add-to-cart action theo cấu hình
- loading state cho service detail route

### Auth pages

#### `/login`

- login form dùng React Hook Form + Zod
- credentials auth qua Auth.js
- redirect theo `callbackUrl`

#### `/register`

- register form dùng React Hook Form + Zod
- registration flow thật
- hash password
- chặn email trùng
- tạo `User`
- tạo `Wallet`

### Cart + checkout flow

#### `/cart`

- local cart state bằng Zustand
- add item
- remove item
- update quantity
- clear cart
- subtotal
- cấu hình sản phẩm được mang theo trong cart item
- empty state

#### `/checkout`

- customer info section
- order summary
- payment method section
- confirm order tạo `Order`, `OrderItem`, `Transaction`
- server-side price recalculation theo config

#### `/order/success`

- success state
- summary message
- CTA quay lại catalog
- CTA sang dashboard
- hiển thị payment status và item summary

### Dashboard `/dashboard`

- dashboard shell
- protected by session
- redirect to `/login` nếu chưa đăng nhập
- sidebar
- dashboard header
- analytics cards
- revenue chart
- weekly activity chart
- recent activity
- quick links sang billing và purchased products

### Dashboard account pages

#### `/dashboard/orders`

- order summary cards
- orders table
- payment status badges
- product name summary trên từng đơn
- CTA sang order detail page
- empty state

#### `/dashboard/orders/[orderId]`

- order summary hero
- order status + payment status
- purchased items list
- pricing breakdown
- payment instructions
- customer info + timestamps
- transaction list
- persisted product configuration display
- not-found / unauthorized empty state

#### `/dashboard/wallet`

- balance cards
- billing summary cards
- transaction history
- top-up request form
- implementation notes card

#### `/dashboard/purchased-products`

- purchased products grouped theo domain
- service summary cards
- total spent / order count / last purchased info
- CTA quay lại service detail, orders, và purchased product detail

#### `/dashboard/purchased-products/[productId]`

- product hậu mua summary
- domain badge + latest lifecycle state
- service provisioning summary cho infrastructure products
- delivery record summary cho digital goods / telecom
- latest persisted configuration block
- line item history linked về order detail
- pricing / commerce summary
- not-found / unauthorized empty state

#### `/dashboard/billing`

- billing overview cards
- transaction activity feed
- payment method foundation card
- invoice / history placeholder foundation
- CTA sang wallet và checkout

#### `/dashboard/settings`

- profile/account settings form
- update name + phone qua API thật
- security posture card
- preferences placeholder card
- account summary card

#### `/dashboard/profile`

- account overview hero
- avatar + name + role + active state
- wallet / billing / order metrics
- contact info card
- user preferences card
- account activity summary
- embedded profile editing form

## Completed phases

### Phase 0: Stabilize the project

Goal:

- làm project chạy lại ổn định
- fix lỗi environment / TypeScript / dependency

What was done:

- restored `next-env.d.ts`
- cài lại dependencies
- thêm script `dev:3001`
- verify local build và typecheck

Pages/routes impacted:

- không thêm page mới
- khôi phục khả năng chạy ổn định toàn project

Outcome:

- repo chạy lại được
- editor errors do thiếu môi trường được dọn sạch

### Phase 1: Refactor structure + public product routes

Goal:

- chỉnh cấu trúc repo theo hướng scale tốt hơn
- không làm vỡ landing page và dashboard hiện tại
- biến service section trên landing thành page thật

What was done:

- refactor repo sang shape `app + components + features`
- tạo `app/(public)` và `app/dashboard`
- chuyển layout components vào `components/layout`
- chuyển shared/theme components vào `components/shared`
- chuyển landing sections sang `features/landing/components`
- chuyển dashboard widgets/charts sang `features/dashboard/components`
- dọn docs vào `docs/`
- gộp hook trùng, bỏ CSS thừa
- thêm public catalog đầu tiên
- nối link từ landing vào service pages thật
- chỉnh dashboard charts để đồng bộ dark/light tốt hơn

Pages/routes added in Phase 1:

- `/services`
- `/services/vps`
- `/services/cloud-server`
- `/services/giftcard`
- `/services/game-cards`
- `/services/sim`
- `/services/topup`

Main features delivered:

- public services catalog
- service detail pages
- landing-to-catalog navigation thật
- giữ nguyên homepage và dashboard flow cũ

Outcome:

- app có cấu trúc sạch hơn nhưng không bị rewrite
- landing page vẫn hoạt động
- dashboard vẫn hoạt động
- project có catalog public thật thay vì chỉ là section trên landing

### Phase 2: Auth + database foundation

Goal:

- chuẩn bị backend foundation thật
- chưa ép toàn bộ UI phải đổi theo backend

What was done:

- added Prisma 7
- added PostgreSQL adapter với `pg`
- added Auth.js credentials foundation
- tạo Prisma schema cho:
  - `User`
  - `Product`
  - `Order`
  - `OrderItem`
  - `Wallet`
  - `Transaction`
- tạo Prisma config
- tạo Prisma client singleton
- thêm auth route handler
- thêm password hashing helpers
- thêm auth validation
- thêm `.env.example`
- thêm tài liệu backend foundation

Pages/routes added in Phase 2:

- chưa thêm page UI mới
- thêm API route: `/api/auth/[...nextauth]`

Main features delivered:

- database foundation
- auth foundation
- schema nền cho product / order / wallet / transaction

Outcome:

- project có nền backend thật
- public UI vẫn build/run bình thường

### Phase 3: Auth UI + protected dashboard + cart flow

Goal:

- mở auth flow thật cho người dùng
- bảo vệ `/dashboard`
- tạo flow cart / checkout đầu tiên mà không cần payment integration thật

What was done:

- tạo route group `(auth)`
- build `/login`
- build `/register`
- triển khai registration flow với hash password
- validate duplicate email
- auto-create wallet khi register thành công
- thêm session provider vào app
- bảo vệ `/dashboard`
- redirect unauthenticated user sang `/login`
- thêm Zustand cart store
- nối add-to-cart từ catalog
- build `/cart`
- build `/checkout`
- build `/order/success`
- cập nhật public header để link sang login/register/cart thật
- chỉnh một lượt UI Phase 3 để dark/light đồng bộ hơn

Pages/routes added in Phase 3:

- `/login`
- `/register`
- `/cart`
- `/checkout`
- `/order/success`
- `/api/auth/register`

Main features delivered:

- login form
- register form
- registration backend flow
- session-protected dashboard
- client cart state
- cart page
- checkout page
- order success page

Outcome:

- auth flow đã usable
- dashboard không còn public
- public catalog đã nối được sang cart/checkout flow

### Phase 4: Prisma-backed catalog + domain services foundation

Goal:

- chuyển catalog sang đọc được từ Prisma
- giữ fallback an toàn để không làm vỡ UI/build khi DB chưa sẵn sàng
- chuẩn bị query/service modules cho các domain phase sau

What was done:

- mở rộng `Product` schema với:
  - `domain`
  - `tagline`
  - `priceLabel`
  - `isFeatured`
  - `sortOrder`
- chuẩn hóa product domains:
  - `INFRASTRUCTURE`
  - `DIGITAL_GOODS`
  - `TELECOM`
- tách catalog content/source/types/validation rõ ràng
- thêm product query layer:
  - `getAllProducts`
  - `getFeaturedProducts`
  - `getProductBySlug`
  - `getProductsByCategory`
  - `getProductsByDomain`
- chuyển public catalog pages sang query layer mới
- thêm safe fallback nếu `DATABASE_URL` chưa có hoặc DB chưa có product active
- tạo seed strategy cho products
- thêm `db:seed`
- tạo service foundation cho:
  - orders
  - wallet
  - purchased products
  - billing
  - settings

Pages/routes added in Phase 4:

- không thêm page public mới
- giữ nguyên route structure hiện có

Main features delivered:

- catalog có thể đọc từ Prisma-backed product data
- có seed setup cho product catalog
- có service foundation để phase sau làm orders/wallet/account pages

Outcome:

- UI catalog không đổi hướng hiển thị
- app đã sẵn sàng chuyển dần từ mock/static data sang database data

### Phase 5: Real orders + wallet flow + payment foundation

Goal:

- biến checkout thành order flow thật
- hoàn thiện wallet flow ở mức backend foundation
- đảm bảo order creation an toàn trong transaction
- chuẩn bị payment integration layer cho phase sau

What was done:

- tạo order thật từ checkout
- tạo `Order`, `OrderItem`, `Transaction`
- gắn order vào user đã đăng nhập
- dùng Prisma transaction để bảo đảm atomicity
- thêm payment method / provider / payment status handling
- thêm payment foundation services
- thêm wallet summary, transaction history, top-up request foundation
- tạo dashboard routes:
  - `/dashboard/orders`
  - `/dashboard/wallet`
- thêm API routes:
  - `/api/orders`
  - `/api/wallet`
  - `/api/wallet/topups`

Pages/routes added in Phase 5:

- `/dashboard/orders`
- `/dashboard/wallet`
- `/api/orders`
- `/api/wallet`
- `/api/wallet/topups`

Main features delivered:

- real order creation flow
- real order reading flow
- wallet summary
- transaction history
- top-up request foundation
- transaction-safe checkout/order flow
- payment provider foundation cho future Stripe / VNPay integration

Outcome:

- checkout không còn chỉ là UI demo
- dashboard bắt đầu dùng dữ liệu thật của order / wallet / transaction

### Phase 6: Product configurator + full account experience

Goal:

- làm product pages giống flow mua dịch vụ số thực tế hơn
- mở rộng dashboard/account thành khu vực user-facing đầy đủ hơn
- tăng polish cho product + dashboard UI mà không rewrite app

What was done:

- thêm shared product purchase engine dùng chung client/server
- thêm configurator UI riêng cho:
  - VPS
  - Cloud Server
  - Giftcard
  - Game Cards
  - SIM
  - Phone Recharge / Top-up
- cart giờ mang theo configuration summary
- checkout gửi config payload lên order API
- order service tự tính lại giá theo config trước khi persist
- thêm dashboard pages:
  - `/dashboard/purchased-products`
  - `/dashboard/billing`
  - `/dashboard/settings`
- thêm settings API:
  - `/api/account/settings`
- thêm loading polish cho dashboard và service detail pages
- cập nhật dashboard navigation để route mới đồng bộ với sidebar

Pages/routes added in Phase 6:

- `/dashboard/purchased-products`
- `/dashboard/billing`
- `/dashboard/settings`
- `/api/account/settings`

Main features delivered:

- realistic product buying/configuration UI
- configuration-aware cart / checkout / order success UX
- user-facing purchased products page
- user-facing billing page
- user-facing settings page
- basic profile update flow
- loading skeletons cho dashboard và product detail

Outcome:

- product experience tiến gần hơn mô hình digital marketplace thật
- dashboard/account area không còn chỉ là shell + 2 page cơ bản
- Phase 6 hoàn thành mà không cần đổi schema Prisma

### Phase 7: AI-ready data foundation + commerce schema expansion

Goal:

- xây nền database cho toàn web theo scope map
- chuẩn bị dữ liệu cho bot AI sau này mà không phải đập lại schema
- thêm service entry points rõ ràng cho marketing, product commerce, cart persistence và business intelligence

What was done:

- mở rộng Prisma schema thêm các nhóm model:
  - marketing content:
    - `MarketingSection`
    - `MarketingFaq`
    - `Testimonial`
    - `PricingPlan`
  - product commerce:
    - `ProductOptionGroup`
    - `ProductOptionValue`
    - `ProductDenomination`
    - `ProductInventoryNumber`
  - cart persistence:
    - `Cart`
    - `CartItem`
  - account/security:
    - `UserPreference`
    - `SecurityEvent`
    - `PasswordResetToken`
  - payment/refund/fulfillment:
    - `PaymentIntent`
    - `PaymentWebhookEvent`
    - `RefundRequest`
    - `ServiceProvision`
    - `DigitalDelivery`
  - inventory/profit/market:
    - `InventoryBalance`
    - `InventoryMovement`
    - `ProductCostSnapshot`
    - `ProductPriceSnapshot`
    - `ProductSalesMetric`
    - `MarketTrendSnapshot`
    - `ForecastSnapshot`
  - AI memory/recommendation:
    - `AiConversationSession`
    - `AiConversationMessage`
    - `AiRecommendation`
- tạo shared data source cho marketing content
- mở rộng seed để nạp:
  - products
  - marketing content
  - option groups / denominations / SIM inventory
  - inventory baseline
  - cost / price / sales / market / forecast snapshots
- thêm service foundation:
  - [get-marketing-content.ts](/D:/IT-DEVELOPER/Digital-Shop/features/landing/services/get-marketing-content.ts)
  - [get-product-commerce-context.ts](/D:/IT-DEVELOPER/Digital-Shop/features/catalog/services/get-product-commerce-context.ts)
  - [get-user-cart.ts](/D:/IT-DEVELOPER/Digital-Shop/features/cart/services/get-user-cart.ts)
  - [get-user-preferences.ts](/D:/IT-DEVELOPER/Digital-Shop/features/account/services/get-user-preferences.ts)
  - [get-business-intelligence-context.ts](/D:/IT-DEVELOPER/Digital-Shop/features/ai/services/get-business-intelligence-context.ts)

Pages/routes added in Phase 7:

- không thêm route UI mới
- không đổi route structure hiện có

Main features delivered:

- database scope đã bao phủ gần như toàn bộ miền dữ liệu chính của web
- bot AI về sau có thể đọc một business intelligence context thống nhất thay vì truy vấn trực tiếp từng bảng
- landing, product commerce và cart persistence đều đã có service layer để chuyển dần sang DB-backed runtime

Outcome:

- schema đã sẵn cho giai đoạn commerce + AI tiếp theo
- web hiện tại vẫn hoạt động ổn vì chưa ép rewrite database-first
- local/dev vẫn an toàn nhờ fallback khi chưa có PostgreSQL live

### Phase 8: Dashboard detail pages + repo quality gate cleanup

Goal:

- làm dashboard/account area đầy đủ hơn cho end user
- thêm các route chi tiết cần thiết mà không rewrite dashboard shell hiện có
- dọn quality gate để lint / typecheck / build phản ánh đúng app đang ship

What was done:

- build `/dashboard/profile`
- hoàn thiện `/dashboard/orders/[orderId]`
- build `/dashboard/purchased-products/[productId]`
- thêm reusable dashboard detail components:
  - `DetailStatusBadge`
  - `DetailMetadataCard`
  - `PricingBreakdownCard`
  - `ConfigurationSummaryCard`
  - `DetailPageSkeleton`
- thêm service:
  - `getPurchasedProductDetail`
- tách parser cho `OrderItem.metadata`
- nối link điều hướng từ overview, orders list, purchased products list, và sidebar footer
- dọn repo config:
  - exclude `src/` legacy khỏi TypeScript
  - exclude `scripts/` khỏi ESLint
  - xóa `postcss.config.js` cũ
  - đổi `middleware.ts` thành `proxy.ts`

Pages/routes added in Phase 8:

- `/dashboard/profile`
- `/dashboard/orders/[orderId]`
- `/dashboard/purchased-products/[productId]`

Main features delivered:

- hồ sơ user-facing riêng trong dashboard
- order detail page đọc dữ liệu thật và cấu hình đã persist
- purchased product detail page cho hậu mua
- empty/loading states nhất quán hơn cho account area
- navigation dashboard/account hoàn chỉnh hơn
- quality gates của repo được đưa về trạng thái pass ổn định

Outcome:

- dashboard/account area bớt cảm giác shell demo, tiến gần hơn một user workspace hoàn chỉnh
- order và purchased product flows đã có trang detail thực tế
- repo hiện pass `lint`, `tsc`, `build` sau khi dọn legacy config gây nhiễu

## Phase summary

- Phase 1: refactor vừa đủ + public services catalog
- Phase 2: Prisma + PostgreSQL + Auth.js foundation
- Phase 3: auth UI + protected dashboard + cart/checkout flow
- Phase 4: Prisma-backed catalog + product seed + service foundation cho orders/wallet/account
- Phase 5: real order flow + wallet flow + payment foundation
- Phase 6: product configurator + purchased products / billing / settings UI
- Phase 7: AI-ready data foundation + commerce schema expansion
- Phase 8: dashboard profile + detail pages + quality gate cleanup

## Current technical status

- `corepack pnpm exec prisma generate`: passing
- `corepack pnpm exec tsc --noEmit`: passing
- `corepack pnpm lint`: passing
- `corepack pnpm build`: passing
- public site vẫn hoạt động
- auth pages đã hoạt động
- dashboard đã được bảo vệ bằng session
- dashboard hiện có profile page và detail pages cho orders / purchased products
- services catalog vẫn hoạt động
- catalog có fallback an toàn nếu DB chưa sẵn sàng
- seed command đã có nhưng chưa bắt buộc phải chạy để UI hoạt động
- Phase 7 đã đổi schema Prisma, nên cần `db:push` hoặc migration trước khi dùng DB live

## Not done yet

- migrate / push schema vào PostgreSQL thật nếu muốn dùng DB live
- chạy seed vào database thật
- persist product configuration vào bảng/query layer riêng nếu muốn analytics sâu hơn ngoài `OrderItem.metadata`
- wallet top-up settlement thật
- admin/product management
- payment integration thật
- invoice/export flow
- password change / advanced security UI
- AI chat UI / AI API route
- scheduled jobs để cập nhật market / forecast data tự động

## Recommended next phases

### Phase 9

- apply schema mới vào PostgreSQL thật
- seed database thật bằng `db:seed`
- nối dần landing/product/cart runtime sang service layer mới
- thêm AI chat/API dùng `getBusinessIntelligenceContext`
- thêm admin/product management có role gating
- invoice history / export
- payment provider thật như Stripe hoặc VNPay

## Notes

- Tất cả refactor đến hiện tại đều theo hướng incremental, không rewrite toàn bộ.
- Các module mới chỉ được tạo khi đã có use case thật, tránh over-engineering.
- UI public hiện tại được giữ ổn định trong suốt các phase vừa triển khai.
