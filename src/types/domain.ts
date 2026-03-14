export type UserRole = "USER" | "STAFF" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type ProductType =
  | "VPS"
  | "CLOUD"
  | "GIFTCARD"
  | "GAMECARD"
  | "DIGITAL";
export type ServiceType = "VPS" | "CLOUD" | "DIGITAL";
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED";
export type PaymentMethod = "VNPAY" | "MOMO" | "ZALOPAY" | "CRYPTO";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type GiftCardCodeStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "USED"
  | "EXPIRED";
export type VpsInstanceStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED"
  | "EXPIRED";
export type NotificationType =
  | "ORDER"
  | "PAYMENT"
  | "TICKET"
  | "SYSTEM"
  | "STOCK"
  | "ADMIN";
export type NotificationLevel = "INFO" | "SUCCESS" | "WARNING" | "DANGER";
export type MediaUsageType =
  | "LOGO"
  | "BANNER"
  | "PRODUCT_IMAGE"
  | "CATEGORY_ICON"
  | "AVATAR"
  | "PAYMENT_ICON"
  | "PLACEHOLDER";
export type MediaStorageDriver = "LOCAL" | "CLOUDINARY" | "S3";

export interface SeoFields {
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface Category extends SeoFields {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  banner?: string;
  isVisible?: boolean;
  sortOrder?: number;
  children?: Category[];
}

export interface ProductSpecs {
  cpu?: string;
  ram?: string;
  storage?: string;
  bandwidth?: string;
  os?: string;
  gpu?: string;
  region?: string;
}

export interface ProductConfigurationOption {
  id: string;
  label: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  isPopular?: boolean;
  specs?: ProductSpecs;
  highlights?: string[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface Product extends SeoFields {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliveryNotes?: string;
  refundNotes?: string;
  price: number;
  compareAtPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  type: ProductType;
  categoryId: string;
  image: string;
  images?: ProductImage[];
  rating: number;
  reviewsCount: number;
  stock?: number;
  denominationOptions?: Array<{ label: string; value: number }>;
  configurationOptions?: ProductConfigurationOption[];
  isFeatured: boolean;
  isHot: boolean;
  isPromotion: boolean;
  isPublished?: boolean;
  isLowStock?: boolean;
  popularityScore?: number;
  createdAt?: string;
  updatedAt?: string;
  tags: string[];
  specs?: ProductSpecs;
}

export interface Banner extends SeoFields {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  ctaLabel: string;
  ctaLink: string;
  placement: "HERO" | "SIDEBAR" | "PROMOTION";
  badge?: string;
  isActive?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  avatar?: string;
  rating: number;
  title: string;
  content: string;
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  status?: UserStatus;
  joinedAt: string;
  notificationsEnabled?: boolean;
}

export interface Account {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionCode?: string;
  gateway?: string;
  createdAt: string;
  callbackLog?: string[];
}

export interface GiftCardCode {
  id: string;
  productId: string;
  code: string;
  status: GiftCardCodeStatus;
  createdAt: string;
  orderId?: string;
  reservedAt?: string;
  soldAt?: string;
}

export interface ServiceRecord {
  id: string;
  userId: string;
  orderId: string;
  productId: string;
  productName: string;
  type: ServiceType;
  serviceName: string;
  status: string;
  createdAt: string;
  renewAt?: string;
  deliveryLog?: string[];
}

export interface VpsService extends ServiceRecord {
  productName: string;
  type: ServiceType;
  serviceName: string;
  status: string;
  ipAddress: string;
  username: string;
  password: string;
  panelUrl: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  type?: ProductType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  configurationId?: string;
  configurationLabel?: string;
  configurationSummary?: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
  type: "ORDER" | "PAYMENT" | "FULFILLMENT" | "ADMIN";
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  subtotal?: number;
  discount: number;
  note?: string;
  adminNote?: string;
  supportTicketId?: string;
  items: OrderItem[];
  payment: Payment;
  assignedCodes?: GiftCardCode[];
  provisionedVps?: VpsService[];
  serviceRecords?: ServiceRecord[];
  timeline?: TimelineEvent[];
}

export interface TicketMessage {
  id: string;
  sender: "USER" | "ADMIN";
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  category: string;
  priority?: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  messages: TicketMessage[];
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  usageLimit?: number;
  isActive: boolean;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  usedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  type: ProductType;
  image?: string;
  configurationId?: string;
  configurationLabel?: string;
  configurationSummary?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  description: string;
  type: NotificationType;
  level: NotificationLevel;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface MediaAsset {
  id: string;
  fileName: string;
  fileUrl: string;
  altText: string;
  uploadedBy: string;
  createdAt: string;
  fileType: string;
  size: number;
  usageType: MediaUsageType;
  driver?: MediaStorageDriver;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string;
  detail: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface SiteSetting extends SeoFields {
  id: string;
  siteName: string;
  supportEmail: string;
  hotline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface AiInsight {
  id: string;
  title: string;
  description: string;
  value: string;
  status: "READY" | "RUNNING" | "WARNING";
  trend?: string;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  type?: ProductType;
  promotion?: boolean;
  priceMin?: number;
  priceMax?: number;
  tag?: string;
  sort?:
    | "featured"
    | "price-asc"
    | "price-desc"
    | "rating"
    | "popularity"
    | "newest";
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
