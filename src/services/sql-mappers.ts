import { Prisma } from "@prisma/client";
import type {
  AuditLog,
  Banner,
  Category,
  FAQItem,
  GiftCardCode,
  MediaAsset,
  Notification,
  Order,
  Payment,
  Product,
  ProductConfigurationOption,
  Review,
  ServiceRecord,
  SiteSetting,
  SupportTicket,
  User,
  VpsService
} from "@/types/domain";

function getUserAvatarInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function decimalToNumber(value?: Prisma.Decimal | null) {
  return value ? Number(value) : 0;
}

export function mapPrismaUser(user: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "USER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  notificationsEnabled: boolean;
  createdAt: Date;
}): User {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatarUrl ?? getUserAvatarInitials(user.fullName),
    role: user.role,
    status: user.status,
    notificationsEnabled: user.notificationsEnabled,
    joinedAt: user.createdAt.toISOString()
  };
}

export function mapPrismaCategory(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  isVisible: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  children?: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    bannerUrl: string | null;
    isVisible: boolean;
    sortOrder: number;
    seoTitle: string | null;
    seoDescription: string | null;
    ogImage: string | null;
    children?: never[];
  }>;
}): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    icon: category.iconUrl ?? "server",
    banner: category.bannerUrl ?? undefined,
    isVisible: category.isVisible,
    sortOrder: category.sortOrder,
    seoTitle: category.seoTitle ?? undefined,
    seoDescription: category.seoDescription ?? undefined,
    ogImage: category.ogImage ?? undefined,
    children: category.children?.map((child) => mapPrismaCategory(child))
  };
}

export function mapPrismaBanner(banner: {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaLink: string | null;
  placement: "HERO" | "SIDEBAR" | "PROMOTION";
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}): Banner {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    description: banner.description ?? "",
    image: banner.imageUrl ?? undefined,
    ctaLabel: banner.ctaLabel ?? "Xem chi tiết",
    ctaLink: banner.ctaLink ?? "/products",
    placement: banner.placement,
    isActive: banner.isActive,
    seoTitle: banner.seoTitle ?? undefined,
    seoDescription: banner.seoDescription ?? undefined
  };
}

export function mapPrismaFaq(item: {
  id: string;
  question: string;
  answer: string;
  category: string;
}): FAQItem {
  return {
    id: item.id,
    question: item.question,
    answer: item.answer,
    category: item.category
  };
}

export function mapPrismaReview(review: {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  user?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}): Review {
  return {
    id: review.id,
    productId: review.productId,
    userId: review.user?.id,
    userName: review.user?.fullName ?? "Khách hàng MeowMarket",
    avatar: review.user?.avatarUrl ?? undefined,
    rating: review.rating,
    title: review.title ?? "Đánh giá từ khách hàng",
    content: review.content,
    verifiedPurchase: review.verifiedPurchase,
    createdAt: review.createdAt.toISOString()
  };
}

export function mapPrismaProduct(product: {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliveryNotes: string | null;
  refundNotes: string | null;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  type: "VPS" | "CLOUD" | "GIFTCARD" | "GAMECARD" | "DIGITAL";
  categoryId: string;
  defaultImageUrl: string | null;
  rating: number;
  reviewsCount: number;
  stock: number;
  isFeatured: boolean;
  isHot: boolean;
  isPromotion: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  bandwidth: string | null;
  operatingSystem: string | null;
  metadata: Prisma.JsonValue | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  images?: Array<{
    id: string;
    productId: string;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
  }>;
}): Product {
  const metadata = product.metadata as
    | {
        denominationOptions?: Array<{ label: string; value: number }>;
        configurationOptions?: ProductConfigurationOption[];
      }
    | null;

  const configurationOptions = metadata?.configurationOptions?.map((option) => ({
    ...option,
    specs: option.specs ?? undefined,
    highlights: option.highlights ?? []
  }));

  const minConfiguredPrice = configurationOptions?.length
    ? Math.min(...configurationOptions.map((option) => option.price))
    : undefined;

  const maxConfiguredPrice = configurationOptions?.length
    ? Math.max(...configurationOptions.map((option) => option.price))
    : undefined;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    deliveryNotes: product.deliveryNotes ?? undefined,
    refundNotes: product.refundNotes ?? undefined,
    price: decimalToNumber(product.price),
    compareAtPrice: product.compareAtPrice ? decimalToNumber(product.compareAtPrice) : undefined,
    type: product.type,
    categoryId: product.categoryId,
    image: product.defaultImageUrl ?? "/images/defaults/product-placeholder.svg",
    images: product.images?.map((image) => ({
      id: image.id,
      productId: image.productId,
      url: image.imageUrl,
      alt: image.altText ?? product.name,
      isPrimary: image.isPrimary
    })),
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    stock: product.stock,
    minPrice: minConfiguredPrice,
    maxPrice: maxConfiguredPrice,
    isFeatured: product.isFeatured,
    isHot: product.isHot,
    isPromotion: product.isPromotion,
    isPublished: product.isPublished,
    isLowStock: product.stock > 0 && product.stock < 20,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    tags: product.tags,
    denominationOptions: metadata?.denominationOptions,
    configurationOptions,
    seoTitle: product.seoTitle ?? undefined,
    seoDescription: product.seoDescription ?? undefined,
    ogImage: product.ogImage ?? undefined,
    specs:
      product.cpu || product.ram || product.storage || product.bandwidth || product.operatingSystem
        ? {
            cpu: product.cpu ?? undefined,
            ram: product.ram ?? undefined,
            storage: product.storage ?? undefined,
            bandwidth: product.bandwidth ?? undefined,
            os: product.operatingSystem ?? undefined
          }
        : undefined
  };
}

export function mapPrismaPayment(payment: {
  id: string;
  orderId: string;
  gateway: "VNPAY" | "MOMO" | "ZALOPAY" | "CRYPTO";
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  amount: Prisma.Decimal;
  transactionCode: string | null;
  callbackLog: Prisma.JsonValue | null;
  createdAt: Date;
}): Payment {
  const callbackLog = Array.isArray(payment.callbackLog)
    ? payment.callbackLog.map((entry) => String(entry))
    : undefined;

  return {
    id: payment.id,
    orderId: payment.orderId,
    method: payment.gateway,
    status: payment.status,
    amount: decimalToNumber(payment.amount),
    transactionCode: payment.transactionCode ?? undefined,
    gateway: payment.gateway,
    createdAt: payment.createdAt.toISOString(),
    callbackLog
  };
}

export function mapPrismaGiftCardCode(code: {
  id: string;
  productId: string;
  code: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "USED" | "EXPIRED";
  createdAt: Date;
  orderId: string | null;
  reservedAt: Date | null;
  soldAt: Date | null;
}): GiftCardCode {
  return {
    id: code.id,
    productId: code.productId,
    code: code.code,
    status: code.status,
    createdAt: code.createdAt.toISOString(),
    orderId: code.orderId ?? undefined,
    reservedAt: code.reservedAt?.toISOString(),
    soldAt: code.soldAt?.toISOString()
  };
}

export function mapPrismaServiceRecord(record: {
  id: string;
  type: "VPS" | "CLOUD" | "DIGITAL";
  serviceName: string;
  status: string;
  deliveryLog: Prisma.JsonValue | null;
  createdAt: Date;
  renewAt: Date | null;
  userId: string;
  orderId: string;
  productId: string;
  product: { name: string };
  vpsInstance?: {
    ipAddress: string;
    username: string;
    password: string;
    controlPanelUrl: string | null;
  } | null;
}): ServiceRecord | VpsService {
  const deliveryLog = Array.isArray(record.deliveryLog)
    ? record.deliveryLog.map((item) => String(item))
    : undefined;

  const baseRecord: ServiceRecord = {
    id: record.id,
    userId: record.userId,
    orderId: record.orderId,
    productId: record.productId,
    productName: record.product.name,
    type: record.type,
    serviceName: record.serviceName,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    renewAt: record.renewAt?.toISOString(),
    deliveryLog
  };

  if (!record.vpsInstance) {
    return baseRecord;
  }

  return {
    ...baseRecord,
    ipAddress: record.vpsInstance.ipAddress,
    username: record.vpsInstance.username,
    password: record.vpsInstance.password,
    panelUrl: record.vpsInstance.controlPanelUrl ?? "#"
  };
}

export function buildOrderTimeline(order: {
  id: string;
  orderCode: string;
  createdAt: Date;
  completedAt?: Date | null;
  adminNote: string | null;
  payment?: {
    createdAt: Date;
    status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
    paidAt: Date | null;
    gateway: "VNPAY" | "MOMO" | "ZALOPAY" | "CRYPTO";
  } | null;
  giftCardCodes?: Array<{ id: string; soldAt: Date | null }>;
  serviceRecords?: Array<{ id: string; createdAt: Date; status: string }>;
}) {
  const events: Array<{
    id: string;
    label: string;
    detail: string;
    createdAt: string;
    type: "ORDER" | "PAYMENT" | "FULFILLMENT" | "ADMIN";
  }> = [
    {
      id: `${order.id}-created`,
      label: "Đơn hàng được tạo",
      detail: `Hệ thống ghi nhận đơn ${order.orderCode}.`,
      createdAt: order.createdAt.toISOString(),
      type: "ORDER" as const
    }
  ];

  if (order.payment) {
    events.push({
      id: `${order.id}-payment`,
      label:
        order.payment.status === "SUCCESS"
          ? "Thanh toán thành công"
          : order.payment.status === "FAILED"
            ? "Thanh toán thất bại"
            : "Thanh toán được tạo",
      detail:
        order.payment.status === "SUCCESS"
          ? `Cổng ${order.payment.gateway} đã xác nhận thanh toán thành công.`
          : `Giao dịch ${order.payment.gateway} đang ở trạng thái ${order.payment.status}.`,
      createdAt: (order.payment.paidAt ?? order.payment.createdAt).toISOString(),
      type: "PAYMENT" as const
    });
  }

  const fulfillmentAt =
    order.giftCardCodes?.find((entry) => entry.soldAt)?.soldAt ??
    order.serviceRecords?.[0]?.createdAt ??
    order.completedAt;

  if (fulfillmentAt) {
    events.push({
      id: `${order.id}-fulfillment`,
      label: "Fulfillment hoàn tất",
      detail: "Mã số hoặc dịch vụ đã được ghi vào dashboard người dùng.",
      createdAt: fulfillmentAt.toISOString(),
      type: "FULFILLMENT" as const
    });
  }

  if (order.adminNote) {
    events.push({
      id: `${order.id}-admin`,
      label: "Ghi chú quản trị",
      detail: order.adminNote,
      createdAt: (order.completedAt ?? order.createdAt).toISOString(),
      type: "ADMIN" as const
    });
  }

  return events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function mapPrismaOrder(order: {
  id: string;
  orderCode: string;
  userId: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED" | "REFUNDED";
  createdAt: Date;
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  total: Prisma.Decimal;
  note: string | null;
  adminNote: string | null;
  payment?: {
    id: string;
    orderId: string;
    gateway: "VNPAY" | "MOMO" | "ZALOPAY" | "CRYPTO";
    status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
    amount: Prisma.Decimal;
    transactionCode: string | null;
    callbackLog: Prisma.JsonValue | null;
    createdAt: Date;
    paidAt: Date | null;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    metadata: Prisma.JsonValue | null;
    product: {
      name: string;
      slug: string;
      type: "VPS" | "CLOUD" | "GIFTCARD" | "GAMECARD" | "DIGITAL";
    };
    quantity: number;
    unitPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
  }>;
  giftCardCodes?: Array<{
    id: string;
    productId: string;
    code: string;
    status: "AVAILABLE" | "RESERVED" | "SOLD" | "USED" | "EXPIRED";
    createdAt: Date;
    orderId: string | null;
    reservedAt: Date | null;
    soldAt: Date | null;
  }>;
  serviceRecords?: Array<{
    id: string;
    type: "VPS" | "CLOUD" | "DIGITAL";
    serviceName: string;
    status: string;
    deliveryLog: Prisma.JsonValue | null;
    createdAt: Date;
    renewAt: Date | null;
    userId: string;
    orderId: string;
    productId: string;
    product: { name: string };
    vpsInstance?: {
      ipAddress: string;
      username: string;
      password: string;
      controlPanelUrl: string | null;
    } | null;
  }>;
  completedAt?: Date | null;
  supportTickets?: Array<{ id: string }>;
}): Order {
  const payment = order.payment
    ? mapPrismaPayment(order.payment)
    : {
        id: `${order.id}-payment`,
        orderId: order.id,
        method: "VNPAY" as const,
        status: "PENDING" as const,
        amount: decimalToNumber(order.total),
        createdAt: order.createdAt.toISOString()
      };

  const assignedCodes = order.giftCardCodes?.map(mapPrismaGiftCardCode);
  const serviceRecords = order.serviceRecords?.map(mapPrismaServiceRecord);
  const provisionedVps = serviceRecords?.filter(
    (entry): entry is VpsService => "ipAddress" in entry
  );

  return {
    id: order.id,
    orderCode: order.orderCode,
    userId: order.userId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    subtotal: decimalToNumber(order.subtotal),
    total: decimalToNumber(order.total),
    discount: decimalToNumber(order.discount),
    note: order.note ?? undefined,
    adminNote: order.adminNote ?? undefined,
    supportTicketId: order.supportTickets?.[0]?.id,
    items: order.items.map((item) => {
      const configuration = (item.metadata as
        | {
            configuration?: {
              id?: string;
              label?: string;
              summary?: string;
            };
          }
        | null)?.configuration;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        type: item.product.type,
        quantity: item.quantity,
        unitPrice: decimalToNumber(item.unitPrice),
        totalPrice: decimalToNumber(item.totalPrice),
        configurationId: configuration?.id,
        configurationLabel: configuration?.label,
        configurationSummary: configuration?.summary
      };
    }),
    payment,
    assignedCodes,
    serviceRecords,
    provisionedVps,
    timeline: buildOrderTimeline(order)
  };
}

export function mapPrismaSupportTicket(ticket: {
  id: string;
  userId: string;
  orderId: string | null;
  subject: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: Date;
  messages?: Array<{
    id: string;
    senderType: string;
    body: string;
    createdAt: Date;
  }>;
}): SupportTicket {
  return {
    id: ticket.id,
    userId: ticket.userId,
    orderId: ticket.orderId ?? undefined,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    messages:
      ticket.messages?.map((message) => ({
        id: message.id,
        sender: message.senderType === "ADMIN" ? "ADMIN" : "USER",
        body: message.body,
        createdAt: message.createdAt.toISOString()
      })) ?? []
  };
}

export function mapPrismaNotification(notification: {
  id: string;
  userId: string | null;
  title: string;
  description: string;
  type: string;
  level: string;
  isRead: boolean;
  createdAt: Date;
  link: string | null;
}): Notification {
  return {
    id: notification.id,
    userId: notification.userId ?? undefined,
    title: notification.title,
    description: notification.description,
    type: notification.type as Notification["type"],
    level: notification.level as Notification["level"],
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    link: notification.link ?? undefined
  };
}

export function mapPrismaMediaAsset(asset: {
  id: string;
  fileName: string;
  fileUrl: string;
  altText: string | null;
  uploadedBy: string;
  createdAt: Date;
  fileType: string;
  size: number;
  usageType:
    | "LOGO"
    | "BANNER"
    | "PRODUCT_IMAGE"
    | "CATEGORY_ICON"
    | "AVATAR"
    | "PAYMENT_ICON"
    | "PLACEHOLDER";
  driver: "LOCAL" | "CLOUDINARY" | "S3";
}): MediaAsset {
  return {
    id: asset.id,
    fileName: asset.fileName,
    fileUrl: asset.fileUrl,
    altText: asset.altText ?? asset.fileName,
    uploadedBy: asset.uploadedBy,
    createdAt: asset.createdAt.toISOString(),
    fileType: asset.fileType,
    size: asset.size,
    usageType: asset.usageType,
    driver: asset.driver
  };
}

export function mapPrismaAuditLog(log: {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  detail: string | null;
  createdAt: Date;
  actor: {
    fullName: string;
    role: "USER" | "STAFF" | "ADMIN";
  };
}): AuditLog {
  return {
    id: log.id,
    actorName: log.actor.fullName,
    actorRole: log.actor.role,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    createdAt: log.createdAt.toISOString(),
    detail: log.detail ?? ""
  };
}

export function mapPrismaSiteSetting(setting: {
  id: string;
  siteName: string;
  supportEmail: string;
  hotline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
}): SiteSetting {
  return {
    id: setting.id,
    siteName: setting.siteName,
    supportEmail: setting.supportEmail,
    hotline: setting.hotline,
    logoUrl: setting.logoUrl ?? undefined,
    faviconUrl: setting.faviconUrl ?? undefined,
    primaryColor: setting.primaryColor ?? undefined,
    secondaryColor: setting.secondaryColor ?? undefined,
    seoTitle: setting.seoTitle ?? undefined,
    seoDescription: setting.seoDescription ?? undefined,
    ogImage: setting.ogImage ?? undefined
  };
}
