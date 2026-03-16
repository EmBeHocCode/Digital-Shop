# Database Scope Map

Last updated: 2026-03-16

## Purpose

Tài liệu này liệt kê toàn bộ dữ liệu đang xuất hiện trên web `Digital-Shop`, dữ liệu đó hiện đang nằm ở đâu, và dữ liệu nào cần được đưa vào PostgreSQL để web có nền dữ liệu thật thay vì chỉ dựa vào file tĩnh hoặc local store.

Important note:

- file này tập trung vào bản đồ dữ liệu và nguồn dữ liệu
- nó mô tả root web app và root schema làm nguồn trạng thái chính
- [`bot-AI/apps`](../bot-AI/apps) là workspace bot riêng, không phải main web app được audit ở đây
- nó không còn là tài liệu route/feature audit đầy đủ của root web app
- các luồng runtime mới hơn như:
  - email verification
  - forgot/reset password
  - Stripe webhook/payment sync
  - admin operations trong root app router
  - order detail / purchased-product detail / admin routes
  đã được mô tả chính xác hơn trong [CURRENT_PROJECT_AUDIT.md](./CURRENT_PROJECT_AUDIT.md)
- khi nội dung của file này và audit report mới có khác biệt, hãy coi audit report mới là nguồn trạng thái hiện hành

Mục tiêu của tài liệu:

- xác định phần nào của web đang dùng dữ liệu tĩnh
- xác định phần nào đã nối Prisma/PostgreSQL
- xác định phần nào còn thiếu schema hoặc thiếu luồng dữ liệu thật
- làm nền cho thiết kế database toàn hệ thống

---

## Current Data Sources

Hiện tại web dùng 3 nguồn dữ liệu chính:

1. `File code tĩnh`
- dùng cho landing content
- dùng cho product marketing content
- dùng cho product configuration options
- dùng cho dashboard demo charts/stats

2. `Browser localStorage`
- dùng cho cart state
- dùng cho local fallback của order success page

3. `PostgreSQL qua Prisma`
- dùng cho user/auth/account lifecycle
- dùng cho product catalog khi `DATABASE_URL` có thật và DB chạy được
- dùng cho order, wallet, transaction, payment, billing, admin operations, settings

---

## Implemented Foundation Snapshot

Tính đến `2026-03-16`, database foundation đã được mở rộng thêm cho:

- marketing content / landing CMS foundation
- product configuration và inventory foundation
- persisted cart và account preferences
- payment/refund/fulfillment foundation
- AI/BI foundation hỗ trợ tồn kho, lợi nhuận và xu hướng thị trường

### Schema groups đã có

- `MarketingSection`, `MarketingFaq`, `Testimonial`, `PricingPlan`
- `ProductOptionGroup`, `ProductOptionValue`, `ProductDenomination`, `ProductInventoryNumber`
- `Cart`, `CartItem`
- `UserPreference`, `SecurityEvent`, `PasswordResetToken`, `EmailVerificationToken`
- `PaymentIntent`, `PaymentWebhookEvent`, `RefundRequest`
- `ServiceProvision`, `DigitalDelivery`
- `InventoryBalance`, `InventoryMovement`
- `ProductCostSnapshot`, `ProductPriceSnapshot`, `ProductSalesMetric`
- `MarketTrendSnapshot`, `ForecastSnapshot`
- `AiConversationSession`, `AiConversationMessage`, `AiRecommendation`

### Service entry points đã có

- [get-marketing-content.ts](../features/landing/services/get-marketing-content.ts)
- [get-product-commerce-context.ts](../features/catalog/services/get-product-commerce-context.ts)
- [get-user-cart.ts](../features/cart/services/get-user-cart.ts)
- [get-user-preferences.ts](../features/account/services/get-user-preferences.ts)
- [get-business-intelligence-context.ts](../features/ai/services/get-business-intelligence-context.ts)

### Important note

- UI hiện vẫn ưu tiên runtime an toàn:
  - public pages chưa bị ép database-first
  - catalog, marketing content và AI context đều có fallback
- nghĩa là foundation DB đã có, nhưng web hiện tại không bị buộc rewrite.

---

## 1. Public Landing (`/`)

### Pages / sections

- Hero
- Logo cloud
- Services section
- Features section
- Pricing section
- Benefits section
- Testimonials section
- FAQ section

### Current source

Các section landing hiện đang là content tĩnh trong component files:

- [hero.tsx](../features/landing/components/hero.tsx)
- [services.tsx](../features/landing/components/services.tsx)
- [features.tsx](../features/landing/components/features.tsx)
- [pricing.tsx](../features/landing/components/pricing.tsx)
- [benefits.tsx](../features/landing/components/benefits.tsx)
- [logo-cloud.tsx](../features/landing/components/logo-cloud.tsx)
- [testimonials.tsx](../features/landing/components/testimonials.tsx)
- [faq.tsx](../features/landing/components/faq.tsx)

Thư mục [features/landing/data](../features/landing/data) hiện đã có source dữ liệu chia sẻ:

- [marketing-content.ts](../features/landing/data/marketing-content.ts)

### Data currently shown on web

- headline, subheadline, CTA text
- stat counters kiểu `50,000+`, `99.9%`, `24/7`
- bảng giá landing
- testimonials
- FAQ

### Database status

Đã có DB foundation:

- `MarketingSection`
- `MarketingFaq`
- `Testimonial`
- `PricingPlan`

và query layer:

- [get-marketing-content.ts](../features/landing/services/get-marketing-content.ts)

UI landing hiện vẫn render từ component/static content để giữ giao diện ổn định.

### Recommended DB scope

Nếu muốn CMS hóa landing sau này, nên có:

- `MarketingPage`
- `MarketingSection`
- `FaqItem`
- `Testimonial`
- `PricingPlan`
- `SiteSetting`

### Priority

Thấp đến trung bình.

Lý do:
- landing hiện chưa phải điểm nghẽn kỹ thuật
- dữ liệu này ổn khi để tĩnh ở giai đoạn hiện tại
- chỉ nên vào DB khi cần CMS, A/B test, hoặc marketing team tự sửa nội dung

---

## 2. Public Services Catalog (`/services`, `/services/[slug]`)

### Current routes

- `/services`
- `/services/vps`
- `/services/cloud-server`
- `/services/giftcard`
- `/services/game-cards`
- `/services/sim`
- `/services/topup`

### Current source

Catalog đang chạy kiểu hybrid:

1. `DB nếu có DATABASE_URL và DB chạy được`
- query service: [get-products.ts](../features/catalog/services/get-products.ts)

2. `Fallback về file tĩnh nếu DB chưa sẵn sàng`
- content: [catalog-content.ts](../features/catalog/data/catalog-content.ts)
- mapping/icon/summary: [catalog-data.ts](../features/catalog/data/catalog-data.ts)

### Data currently shown on web

Mỗi sản phẩm hiện có:

- `slug`
- `name`
- `tagline`
- `description`
- `priceValue`
- `priceLabel`
- `category`
- `domain`
- `isFeatured`
- `sortOrder`
- `imageUrl`
- `features[]`
- `highlights[]`
- `idealFor[]`
- `operations[]`

### Current DB status

Đã có schema thật trong `Product`:

- `id`
- `slug`
- `name`
- `tagline`
- `description`
- `price`
- `priceLabel`
- `currency`
- `domain`
- `category`
- `isFeatured`
- `sortOrder`
- `status`
- `imageUrl`
- `metadata`

Schema nằm ở [schema.prisma](../prisma/schema.prisma).

Seed hiện có ở [seed.ts](../prisma/seed.ts), seed từ `catalogProductContent`.

### Important note

Catalog hiện chỉ đọc DB khi:

- có `DATABASE_URL`
- DB chạy được
- bảng `Product` có dữ liệu `ACTIVE`

Nếu không, web sẽ fallback về file tĩnh để không vỡ UI.

### Recommended DB scope

`Product` hiện đã đủ cho mức catalog public cơ bản.

Nếu muốn scale thật hơn sau này, nên mở rộng thêm:

- `ProductVariant` hoặc `ProductOptionSet`
- `ProductMedia`
- `ProductFaq`
- `ProductStatusHistory`
- `Inventory` hoặc `DigitalStock`

---

## 3. Product Configuration Experience

### Current source

Toàn bộ option configurator hiện nằm trong file tĩnh:

- [product-purchase.ts](../features/catalog/product-purchase.ts)

### Data currently shown on web

#### VPS / Cloud Server

- CPU options
- RAM options
- storage options
- region options
- OS options
- billing cycle options
- price adjustment per option

#### Giftcard / Game Cards

- brand/provider options
- denomination options
- delivery note helper text
- max quantity

#### SIM

- provider options
- category options
- danh sách số mô phỏng
- giá từng số
- tags

#### Top-up

- carrier options
- denomination options
- helper text

### Current DB status

Đã có schema nền cho lớp dữ liệu bán hàng:

- `ProductOptionGroup`
- `ProductOptionValue`
- `ProductDenomination`
- `ProductInventoryNumber`
- `InventoryBalance`

và query layer:

- [get-product-commerce-context.ts](../features/catalog/services/get-product-commerce-context.ts)

UI configurator hiện vẫn render từ code/purchase engine tĩnh, nhưng data model đã sẵn để chuyển dần sang database.

### Recommended DB scope

Nếu muốn đưa toàn bộ product buying experience vào DB, nên có:

- `ProductOptionGroup`
- `ProductOptionValue`
- `ProductPreset`
- `ProductInventoryNumber` cho SIM
- `ProductDenomination`
- `Carrier`
- `TelecomProvider`

### Practical recommendation

Ở giai đoạn hiện tại chưa cần đẩy toàn bộ option này vào DB ngay.

Nên tách 2 lớp:

1. lớp marketing/catalog summary
- đã có thể sống tốt trong `Product`

2. lớp cấu hình bán hàng thực tế
- chỉ đưa vào DB khi chuẩn bị làm:
  - admin product management
  - fulfillment thật
  - pricing rules thật
  - inventory/digital stock thật

---

## 4. Auth (`/login`, `/register`)

### Current source

Frontend:
- [login-form.tsx](../features/auth/components/login-form.tsx)
- [register-form.tsx](../features/auth/components/register-form.tsx)

Validation:
- [validations.ts](../features/auth/validations.ts)

Backend:
- [auth-options.ts](../lib/auth/auth-options.ts)
- [register-user.ts](../features/auth/actions/register-user.ts)
- [route.ts](../app/api/auth/register/route.ts)

### DB entities used

`User`

Fields hiện có:

- `id`
- `email`
- `name`
- `passwordHash`
- `role`
- `image`
- `phone`
- `emailVerified`
- `isActive`
- `createdAt`
- `updatedAt`

### Registration side effects

Khi register thành công:

- tạo `User`
- tạo `Wallet`

### Current DB status

Đã có foundation thật.

### Runtime status

Hiện root web app đã dùng DB/schema này cho:

- register + create wallet
- credentials login gating theo:
  - `emailVerified`
  - `isActive`
- email verification token flow
- forgot/reset password token flow
- security event recording cho verification/reset

### Missing DB-related pieces

- chưa có `Account` / `Session` tables kiểu adapter-based Auth.js adapter
- chưa có trusted devices / MFA
- chưa có device/session management runtime trong root app

---

## 5. Cart (`/cart`)

### Current source

Cart đang không dùng DB.

Nguồn là Zustand persisted store:

- [use-cart-store.ts](../store/use-cart-store.ts)

### Data stored locally

Mỗi line item hiện giữ:

- `id` = `lineId` theo cấu hình
- `slug`
- `name`
- `category`
- `priceValue`
- `priceLabel`
- `tagline`
- `quantity`
- `configuration`

`configuration` gồm:

- `kind`
- `title`
- `summaryLines`
- `selection`
- `allowQuantityAdjustment`

### DB status

Đã có bảng:

- `Cart`
- `CartItem`

và service foundation:

- [get-user-cart.ts](../features/cart/services/get-user-cart.ts)

Hiện web vẫn dùng Zustand + `localStorage` cho cart đang thao tác để giữ UX nhẹ và không phụ thuộc DB ở local dev.

### Recommended DB scope

Nếu muốn giỏ hàng đồng bộ đa thiết bị sau này, nên thêm:

- `Cart`
- `CartItem`

Nhưng ở giai đoạn hiện tại, local cart là đủ và nhẹ hơn.

---

## 6. Checkout (`/checkout`)

### Current source

Checkout lấy dữ liệu từ:

- local cart store
- session user nếu đã login
- order backend API

### Data currently used

- customer name
- email
- phone
- note
- payment method
- line items từ cart
- product configuration được gửi kèm trong payload

### DB status

Checkout không có bảng riêng.

Dữ liệu checkout được chuyển thẳng thành:

- `Order`
- `OrderItem`
- `Transaction`

### Practical recommendation

Không cần `Checkout` table riêng ở giai đoạn này, trừ khi sau này cần:

- abandoned checkout recovery
- draft order
- quote flow
- multi-step persisted checkout

---

## 7. Orders

### Current source

Order creation:
- [create-user-order.ts](../features/orders/services/create-user-order.ts)

Order reads:
- [get-user-orders.ts](../features/orders/services/get-user-orders.ts)

Routes / pages:
- `/api/orders`
- `/dashboard/orders`
- `/dashboard/orders/[orderId]`
- `/dashboard/admin/orders`
- `/dashboard/admin/orders/[orderId]`
- `/order/success`

### DB entities used

`Order`

Fields hiện có:

- `id`
- `userId`
- `status`
- `totalAmount`
- `currency`
- `customerName`
- `customerEmail`
- `customerPhone`
- `paymentMethod`
- `paymentProvider`
- `paymentStatus`
- `paymentReference`
- `note`
- `createdAt`
- `updatedAt`

`OrderItem`

Fields hiện có:

- `id`
- `orderId`
- `productId`
- `productName`
- `unitPrice`
- `quantity`
- `totalPrice`
- `metadata`
- `createdAt`

### Important note

`OrderItem.metadata` hiện là nơi persist config mua hàng:

- `lineId`
- `configuration.kind`
- `configuration.title`
- `configuration.summaryLines`
- `configuration.selection`
- `configuration.allowQuantityAdjustment`

### Current DB status

Đây là phần đã có DB foundation mạnh nhất ngoài auth.

### Missing DB-related pieces

- chưa có invoice table riêng
- `ServiceProvision` và `DigitalDelivery` đã có trong schema nhưng chưa được nối vào runtime fulfillment thật
- chưa có invoice/export flow hoàn chỉnh

---

## 8. Wallet

### Current source

Services:

- [get-wallet-summary.ts](../features/wallet/services/get-wallet-summary.ts)
- [get-transaction-history.ts](../features/wallet/services/get-transaction-history.ts)
- [create-topup-request.ts](../features/wallet/services/create-topup-request.ts)

Pages:

- `/dashboard/wallet`
- `/api/wallet`
- `/api/wallet/topups`

### DB entities used

`Wallet`

Fields hiện có:

- `id`
- `userId`
- `balance`
- `currency`
- `status`
- `createdAt`
- `updatedAt`

### Current behavior

- ví được tạo khi user register hoặc khi flow cần tới ví
- top-up hiện tạo `Transaction` pending
- chưa cộng tiền vào ví ngay
- payment bằng ví sẽ trừ số dư atomically khi create order

### Current DB status

Đã vào DB.

### Missing DB-related pieces

- chưa có top-up approval workflow riêng
- chưa có wallet ledger chi tiết tách khỏi `Transaction`
- chưa có freeze/reserve amount

---

## 9. Transactions / Billing

### Current source

Services:

- [get-billing-overview.ts](../features/account/services/get-billing-overview.ts)
- [get-transaction-history.ts](../features/wallet/services/get-transaction-history.ts)

Pages:

- `/dashboard/billing`
- `/dashboard/wallet`
- `/dashboard/admin/wallet`
- dashboard overview

### DB entity used

`Transaction`

Fields hiện có:

- `id`
- `userId`
- `walletId`
- `orderId`
- `type`
- `paymentMethod`
- `paymentProvider`
- `status`
- `amount`
- `currency`
- `description`
- `reference`
- `metadata`
- `createdAt`
- `updatedAt`

### Current transaction types

- `TOPUP`
- `PAYMENT`
- `REFUND`
- `ADJUSTMENT`

### Current DB status

Đã vào DB.

### Runtime status

Hiện root web app đã có:

- billing overview dùng dữ liệu payment/order/transaction thật
- invoice-like history suy ra từ order đã thanh toán
- Stripe payment webhook synchronization
- `PaymentWebhookEvent` để lưu raw webhook payload/meta cho Stripe path hiện tại

### Missing DB-related pieces

- chưa có invoice entity riêng
- chưa có payout entity
- chưa có settlement / reconciliation table
- chưa có export/PDF invoice runtime

---

## 10. Purchased Products

### Current source

Service:
- [get-purchased-products.ts](../features/account/services/get-purchased-products.ts)

Page:
- `/dashboard/purchased-products`

### Current behavior

Purchased products được suy ra từ:

- `OrderItem`
- join với `Order`
- chỉ lấy các `Order` có `COMPLETED`

### Current DB status

Không có bảng riêng `PurchasedProduct`.

Trang này đang aggregate runtime từ:

- `OrderItem`
- `Order`
- `Product`

### Recommendation

Giữ như hiện tại là hợp lý ở phase này.

Chỉ tạo bảng riêng nếu sau này cần:

- entitlement thật
- access key/license
- service provisioning lifecycle
- digital delivery status

---

## 11. Settings / Account

### Current source

Service:
- [get-user-settings.ts](../features/account/services/get-user-settings.ts)

API:
- [route.ts](../app/api/account/settings/route.ts)

Page:
- `/dashboard/settings`

### Current DB entity used

`User`

Fields đang dùng ở settings:

- `id`
- `email`
- `name`
- `phone`
- `image`
- `role`
- `isActive`
- `emailVerified`
- `createdAt`
- `updatedAt`

### Current DB status

Đã vào DB cho profile cơ bản.

### Runtime status

Root web app hiện đã có:

- profile/settings page
- update `name` + `phone` qua API thật
- profile/account overview đọc trực tiếp từ DB
- billing/profile/account summary cards lấy từ dữ liệu thật

### Missing DB-related pieces

Đã có foundation thêm trong schema:

- `UserPreference`
- `SecurityEvent`
- `PasswordResetToken`

và service:

- [get-user-preferences.ts](../features/account/services/get-user-preferences.ts)

Nhưng UI settings hiện mới chỉ dùng profile cơ bản. Nếu scale account/settings tiếp, nên cân nhắc thêm:

- `NotificationPreference`
- `TrustedDevice`
- `PasswordHistory`

---

## 12. Dashboard Overview

### Current state

Dashboard overview hiện là mix giữa:

1. `DB-backed summary thật`
- wallet summary
- billing overview
- recent orders
- purchased products
- transaction history

2. `Mock/demo data`
- analytics cards
- revenue chart
- sessions chart
- recent activity demo

### DB-backed parts

Page:
- [app/dashboard/page.tsx](../app/dashboard/page.tsx)

Các service thật đang cấp dữ liệu:

- `getWalletSummary`
- `getBillingOverview`
- `getUserOrders`
- `getPurchasedProducts`
- `getTransactionHistory`

### Mock/demo parts

- [analytics-cards.tsx](../features/dashboard/components/analytics-cards.tsx)
- [revenue-chart.tsx](../features/dashboard/components/revenue-chart.tsx)
- [sessions-chart.tsx](../features/dashboard/components/sessions-chart.tsx)
- [recent-activity.tsx](../features/dashboard/components/recent-activity.tsx)

### Recommendation

Nếu muốn dashboard toàn bộ dùng dữ liệu thật, cần thêm lớp analytics tables hoặc materialized summaries, ví dụ:

- `DailyMetric`
- `TrafficMetric`
- `RevenueMetric`
- `UserActivity`

Hiện tại chưa cần vì web chưa có nguồn traffic/event thật.

---

## 13. AI Bot / Inventory / Profit / Market Intelligence

### Purpose

Đây là lớp dữ liệu để sau này gắn bot AI vào web cho các use case:

- tối ưu tồn kho
- phân tích lợi nhuận thực tế
- dự báo xu hướng thị trường
- gợi ý giá bán, ưu tiên restock, ưu tiên marketing

### Current service entry point

- [get-business-intelligence-context.ts](../features/ai/services/get-business-intelligence-context.ts)

### Current schema foundation

- `InventoryBalance`
- `InventoryMovement`
- `ProductCostSnapshot`
- `ProductPriceSnapshot`
- `ProductSalesMetric`
- `MarketTrendSnapshot`
- `ForecastSnapshot`
- `AiConversationSession`
- `AiConversationMessage`
- `AiRecommendation`

### Current status

Đã có schema + fallback intelligence service.

Chưa có:

- AI chat UI
- AI API route
- scheduled jobs để cập nhật market/forecast tự động
- approval workflow cho recommendation trước khi áp dụng

---

## 14. Payment Foundation

### Current source

- `payment method` và `provider` hiện là enum + helper trong feature payment
- order và transaction đã có field để hỗ trợ wallet/manual flows và Stripe path hiện tại
- Stripe runtime hiện có:
  - checkout session creation
  - webhook synchronization
  - cancel/failure handling

### DB readiness

Đã có các field:

- `Order.paymentMethod`
- `Order.paymentProvider`
- `Order.paymentStatus`
- `Order.paymentReference`
- `Transaction.paymentMethod`
- `Transaction.paymentProvider`

Đã có foundation thêm:

- `PaymentIntent`
- `PaymentWebhookEvent`
- `RefundRequest`

### Runtime status

Hiện root web app đã có payment provider integration ở mức runtime cho Stripe:

- real payment initiation từ checkout
- persisted `PaymentIntent`
- persisted `PaymentWebhookEvent`
- order/payment/transaction sync sau webhook

### Missing DB pieces if going live sâu hơn

- settlement / reconciliation tables
- provider-specific raw event mapping cho nhiều provider hơn
- retry / dead-letter handling cho webhook failures
- invoice/export layer đầy đủ

---

## 15. Admin / Product Management

### Current state

Root web app hiện đã có admin module thật trong App Router, gồm:

- `/dashboard/admin`
- `/dashboard/admin/orders`
- `/dashboard/admin/users`
- `/dashboard/admin/wallet`
- `/dashboard/admin/products`
- `/dashboard/admin/sql-manager`

Với product management hiện tại, DB đã được dùng cho:

- list products
- create/edit product cấp cao
- publish/archive product
- featured sort order
- filter theo domain / status

### Existing DB table used

`Product`

### Missing in current admin product/runtime depth

- `ProductAuditLog`
- `ProductCategory`
- `ProductTag`
- `ProductMedia` và `ProductFaq` đã có trong schema, nhưng chưa có admin UI để quản lý
- `DigitalStock`
- `SimInventory`
- `ProvisioningTemplate`
- admin UI cho option groups / option values / denominations / inventory numbers

---

## 16. What Is In DB Today vs Not Yet

### Already designed for DB

- user
- auth credentials
- wallet
- transaction
- order
- order item
- product
- product media / FAQ foundation
- product option groups / values
- product denominations / SIM inventory
- cart persistence foundation
- user preferences / security events
- marketing content foundation
- inventory / cost / sales / forecast snapshots
- AI conversation / recommendation foundation
- billing summary inputs
- purchased products aggregate inputs
- settings profile

### Still not DB-backed

- landing UI runtime
- product configurator runtime
- cart sync runtime
- SIM number inventory thật từ nhà cung cấp ngoài
- giftcard/game card stock thật từ provider
- chart analytics data
- recent activity feed
- AI chat runtime / automation jobs

---

## 17. Recommended Database Build Order

Nếu mục tiêu là đưa "toàn web" dần dần vào DB mà không overbuild, thứ tự hợp lý là:

### Phase A

- bật PostgreSQL thật
- apply schema hiện tại
- seed `Product`
- bật register/login/order/wallet/billing thật

### Phase B

- đưa product configuration có tính vận hành vào DB:
  - denomination
  - SIM inventory
  - option presets

### Phase C

- đưa fulfillment vào DB:
  - digital delivery
  - service provisioning
  - entitlement/access

### Phase D

- đưa landing/marketing content vào DB nếu thực sự cần CMS

### Phase E

- thêm analytics/event tables nếu dashboard cần số liệu thật

---

## 18. Practical Conclusion

Nếu hỏi ngắn gọn "dữ liệu cơ sở dữ liệu cho toàn web nên ưu tiên phần nào", câu trả lời là:

Ưu tiên số 1:

- `User`
- `Product`
- `Order`
- `OrderItem`
- `Wallet`
- `Transaction`

Ưu tiên số 2:

- `Product options / inventory / stock`

Ưu tiên số 3:

- `Settings / preferences / account security`

Ưu tiên số 4:

- `Landing CMS / analytics / marketing content`

Nói cách khác:

- phần commerce cốt lõi nên vào DB trước
- phần marketing content không nên làm trước phần order/wallet/product inventory

