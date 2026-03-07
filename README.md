# MeowMarket

MeowMarket là website marketplace bán dịch vụ số cho thị trường Việt Nam, được xây dựng theo hướng dễ mở rộng thành nền tảng production sau này.

UI theo định hướng:
- cute
- dễ thương
- thân thiện
- nhưng vẫn chuyên nghiệp như một startup công nghệ

Brand concept:
- tông màu mềm mại với pink, soft blue, accent vàng
- hình ảnh và chi tiết visual gợi nhớ chủ đề mèo
- layout marketplace rõ ràng, dễ tìm kiếm, dễ mua và dễ quản lý đơn

## Tính năng chính

### Public site
- Trang chủ có hero banner, danh mục nổi bật, sản phẩm hot, khuyến mãi, hướng dẫn mua hàng, review, FAQ, CTA
- Trang danh sách sản phẩm có filter sidebar, sort, search, pagination
- Trang chi tiết sản phẩm có thông tin giá, cấu hình, mô tả, FAQ, review, sản phẩm tương tự
- Giỏ hàng với coupon và tổng tiền
- Checkout với thông tin khách, payment method, order summary
- Search sản phẩm tại header
- Trang hỗ trợ, liên hệ, chính sách, tra cứu đơn hàng
- Login / register với validation

### User dashboard
- Thông tin tài khoản
- Đổi mật khẩu
- Đơn hàng
- Lịch sử thanh toán
- Sản phẩm đã mua
- Ticket hỗ trợ
- Wishlist
- My Services cho VPS đã provision

### Admin dashboard
- Dashboard overview
- Product management
- Order management
- User management
- Ticket support
- Coupon management
- Banner management
- System settings
- Charts bằng `recharts`

### Backend-ready architecture
- Tách `types`, `mock`, `services`, `components`, `layouts`, `modules`
- Có `Next.js API routes` để mock backend layer ban đầu
- Có `Prisma schema` cho PostgreSQL
- Có `middleware` cho protected routes và role-based access
- Sẵn sàng để tách backend riêng sau này, ví dụ NestJS

## Nhóm sản phẩm

- VPS
  - VPS Basic
  - VPS Gaming
  - VPS Premium
- Cloud
  - Cloud Server
  - Cloud GPU
  - Cloud Gaming
- Gift Card
  - Steam Wallet
  - Google Play
  - App Store
  - PSN
  - Xbox
  - Nintendo
- Thẻ Game
  - Garena
  - Zing
  - Vcoin
  - SohaCoin
  - Funcard

## Tech stack

### Frontend
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- FontAwesome
- Zustand
- React Hook Form
- Zod

### Data / backend layer
- Next.js API Routes
- Prisma ORM
- PostgreSQL

### Dashboard / charts
- Recharts

### Deployment target
- Frontend: Vercel
- Backend / database: VPS hoặc infrastructure riêng

## Cấu trúc thư mục

```text
/src
  /app
    /(public)
    /(auth)
    /(dashboard)
    /(admin)
    /api
  /components
    /ui
    /layout
    /product
    /dashboard
    /forms
  /layouts
  /modules
  /services
  /lib
  /hooks
  /types
  /mock
  /config
  /utils
/prisma
```

## Route chính

### Public
- `/`
- `/products`
- `/products/[slug]`
- `/search`
- `/cart`
- `/checkout`
- `/support`
- `/contact`
- `/policies`
- `/order-lookup`
- `/login`
- `/register`

### User dashboard
- `/profile`
- `/profile/account`
- `/profile/security`
- `/profile/orders`
- `/profile/payments`
- `/profile/purchases`
- `/profile/tickets`
- `/profile/wishlist`
- `/profile/services`

### Admin dashboard
- `/admin`
- `/admin/products`
- `/admin/orders`
- `/admin/users`
- `/admin/tickets`
- `/admin/coupons`
- `/admin/banners`
- `/admin/settings`

### API routes
- `/api/products`
- `/api/orders`
- `/api/search`
- `/api/support`
- `/api/gift-cards`
- `/api/vps`

## Mock systems

### Gift card inventory
Project đã có mock fulfillment logic cho gift card:
- model logic: `GiftCardCode`
- status:
  - `AVAILABLE`
  - `SOLD`
  - `USED`
- khi order hoàn tất:
  - cấp code từ inventory
  - hiển thị code trong order detail / order lookup flow
  - mock thông tin gửi email code cho user

File liên quan:
- `src/services/mock-fulfillment-service.ts`
- `prisma/schema.prisma`

### VPS provisioning
Project đã có mock VPS flow:
- Product type `VPS` có thêm:
  - CPU
  - RAM
  - Storage
  - Bandwidth
  - OS
- sau khi thanh toán:
  - tạo VPS instance mock
  - hiển thị trong `My Services`
- thông tin hiển thị:
  - IP address
  - Username
  - Password
  - Status
  - Control panel button

## Authentication mock

Hiện tại project đang dùng mock auth để demo protected routes:
- cookie `meowmarket-session`
- cookie `meowmarket-role`
- middleware bảo vệ:
  - `/profile/*`
  - `/admin/*`

Đăng nhập demo:
- User:
  - email: `user@meowmarket.vn`
  - password: `123456`
- Admin:
  - email: `admin@meowmarket.vn`
  - password: `123456`

Có thể thay bằng:
- NextAuth
- JWT auth
- session service riêng

## Database schema

Prisma schema đã được thiết kế cho các entity:
- `User`
- `Product`
- `Category`
- `Order`
- `OrderItem`
- `Payment`
- `Coupon`
- `SupportTicket`
- `TicketMessage`
- `Review`
- `Banner`
- `GiftCardCode`
- `VpsInstance`
- `WishlistItem`

Enums chính:
- `UserRole`
- `ProductType`
- `OrderStatus`
- `PaymentStatus`
- `PaymentMethod`
- `TicketStatus`
- `GiftCardCodeStatus`
- `VpsInstanceStatus`

## Cài đặt và chạy local

### 1. Cài dependency

```bash
npm install
```

### 2. Tạo file môi trường

```bash
copy .env.example .env
```

Nội dung mẫu:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meowmarket"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Chạy project

```bash
npm run dev
```

Mở trên:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
```

## Code organization

### `src/mock`
Chứa mock data tách riêng:
- products
- users
- orders
- tickets
- banner
- reviews
- faqs

### `src/services`
Service layer để sau này thay bằng API thật:
- `api-service.ts`
- `product-service.ts`
- `order-service.ts`
- `auth-service.ts`
- `payment-service.ts`
- `ticket-service.ts`
- `search-service.ts`
- `mock-fulfillment-service.ts`

### `src/modules`
Gồm page-level UI logic:
- home
- products
- checkout
- support
- profile
- admin

### `src/components`
Phân tách component theo domain:
- `ui`
- `layout`
- `product`
- `dashboard`
- `forms`

## SEO

Project đã có metadata cơ bản:
- global metadata trong `src/app/layout.tsx`
- page metadata cho các route chính

## Performance direction

Project đang theo hướng:
- ưu tiên server components khi có thể
- phân tách client components cho form, chart, state store
- pagination cho danh sách
- image layer có thể mở rộng bằng `next/image`
- dễ lazy-load thêm cho dashboard widgets lớn nếu cần

## Payment integration direction

Structure đã sẵn sàng để gắn thêm payment gateways:
- VNPay
- Momo
- ZaloPay
- Crypto payment

Khi nâng cấp production, nên thêm:
- payment adapter abstraction
- webhook verification
- transaction logs
- retry strategy
- idempotency handling

## Deployment

### Frontend
- deploy lên Vercel

### Backend / database
- PostgreSQL và backend layer có thể deploy trên VPS
- sau này có thể tách API backend riêng khỏi Next.js frontend

## Trạng thái hiện tại

Đã hoàn thành:
- scaffold full project structure
- public pages
- auth pages
- user dashboard
- admin dashboard
- mock API routes
- Prisma schema
- middleware protect routes
- lint pass
- production build pass

## Hướng mở rộng tiếp theo

- tích hợp auth thật bằng NextAuth hoặc JWT
- kết nối PostgreSQL thật và seed data Prisma
- thêm upload banner / product image
- thêm order detail page đầy đủ
- thêm email service thật cho gift card delivery
- thêm VPS provisioning adapter thật
- thêm webhook payment cho VNPay, Momo, ZaloPay
- thêm test automation

