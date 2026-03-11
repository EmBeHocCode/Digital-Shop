# MeowMarket

MeowMarket là một marketplace dịch vụ số cho người dùng Việt Nam, xây dựng bằng Next.js App Router với PostgreSQL qua Prisma. Project hiện có đầy đủ storefront, auth, khu tài khoản người dùng, staff dashboard, admin dashboard và bộ dữ liệu seed để chạy local nhanh.

## Project hiện đang có gì

### Storefront
- landing page tại `/`
- marketplace homepage tại `/marketplace`
- danh sách sản phẩm, chi tiết sản phẩm, tìm kiếm, lọc và sắp xếp
- cart, checkout, payment result pages
- promotions, support center, order lookup, about, contact, policies

### Auth và khu tài khoản
- đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu
- profile overview, account, security
- orders, payments, purchases, wishlist, services, tickets, notifications

### Staff dashboard
- dashboard dành cho staff
- quản lý orders, payments, tickets, giftcards, services, notifications

### Admin dashboard
- overview dashboard
- products, categories, banners
- orders, payments, users, tickets, coupons, giftcards, services
- media library, notifications, SEO, settings, audit log, AI tools
- permissions, providers, inventory, reviews, FAQs, campaigns, email templates, jobs, integrations
- SQL Manager với các tab `Data / Schema / Relations / Query / Activity`

### Những phần đang ở trạng thái demo hoặc mock
- payment gateway thật chưa được tích hợp, hiện là flow mô phỏng
- AI tools là module concept / planned
- một số vận hành nội bộ như fulfillment/provider integration vẫn đang ở mức mock-ready

## Tech stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Zustand
- React Hook Form + Zod
- Framer Motion
- Recharts
- FontAwesome

## Kiến trúc thư mục chính

```text
src/
  app/          route groups + API routes
  components/   UI primitives, layout, storefront, dashboard, admin
  layouts/      shell cho public / user / staff / admin
  modules/      page-level modules
  services/     data access + business-facing service layer
  hooks/        client state hooks
  utils/        helper utilities
  types/        domain types
  config/       app config / navigation
prisma/
public/
scripts/
```

## Dữ liệu và persistence

Project đọc dữ liệu lõi từ PostgreSQL thông qua Prisma:
- users, sessions, password reset tokens
- categories, products, variants, product FAQs, product features
- banners, FAQs, reviews, favorites
- carts, orders, payments, coupons
- support tickets, notifications
- gift card codes, service records, VPS instances
- media assets, audit logs, site settings

Seed hiện đã có sẵn dữ liệu mẫu để storefront và dashboard không bị trống sau khi chạy local.

## Chạy local nhanh

### Yêu cầu
- Node.js + npm
- Docker Desktop hoặc PostgreSQL local

### 1. Cài dependency

```bash
npm install
```

### 2. Tạo file môi trường

```bash
copy .env.example .env
```

Ví dụ:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meowmarket"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Chạy project

```bash
npm run dev
```

Script `npm run dev` hiện sẽ:
- đảm bảo PostgreSQL sẵn sàng
- chạy `prisma db push`
- seed dữ liệu nếu database đang trống
- đảm bảo có tài khoản demo
- mở Prisma Studio tại `http://127.0.0.1:5555`
- chạy web tại `http://localhost:3000`

### Nếu muốn reset môi trường dev

```bash
npm run dev:reset
npm run dev
```

Lệnh này hữu ích khi gặp lỗi kiểu stale chunk, missing vendor chunk hoặc cache `.next`.

## Thiết lập database thủ công

Nếu bạn muốn chạy từng bước:

```bash
npm run db:start
npm run prisma:generate
npm run db:push
npm run prisma:seed
```

## Tài khoản demo

- User
  - email: `user@meowmarket.vn`
  - password: `123456`

- Staff
  - email: `staff@meowmarket.vn`
  - password: `123456`

- Admin
  - email: `admin@meowmarket.vn`
  - password: `123456`

## Scripts quan trọng

```bash
npm run dev
npm run dev:reset
npm run dev:fresh
npm run dev:raw
npm run build
npm run start
npm run lint
npm run db:start
npm run db:stop
npm run db:down
npm run db:push
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Chất lượng hiện tại

Đã kiểm tra:
- `npm run lint`
- `npm run build`

Ở trạng thái hiện tại, cả hai đều pass.

## Ghi chú

- Đây là codebase marketplace dịch vụ số, không phải ecommerce vật lý truyền thống.
- Nếu bạn muốn dùng giao diện hiện tại làm nền cho project mới, snapshot UI đã được export tại `ui-snapshots/meowmarket-current-ui`.
- Nếu tích hợp payment gateway thật hoặc provider thật, nên thay mock flow hiện tại bằng webhook/callback và queue xử lý riêng.

## License

MIT
