import "server-only";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  SqlManagerFieldInput,
  SqlManagerFieldMeta,
  SqlManagerModelMeta,
  SqlManagerModelOverview,
  SqlManagerRecordListResponse
} from "@/types/sql-manager";

type DmmfModel = (typeof Prisma.dmmf.datamodel.models)[number];
type DmmfField = DmmfModel["fields"][number];

const modelLabelMap: Record<string, { label: string; description: string }> = {
  User: { label: "Người dùng", description: "Quản lý tài khoản, vai trò và trạng thái người dùng." },
  Session: { label: "Phiên đăng nhập", description: "Theo dõi các phiên đăng nhập đang tồn tại." },
  Account: { label: "Liên kết tài khoản", description: "Các tài khoản xác thực đã liên kết với người dùng." },
  Category: { label: "Danh mục", description: "Nhóm dịch vụ và sản phẩm hiển thị trên marketplace." },
  Product: { label: "Sản phẩm", description: "Danh sách dịch vụ số đang bán trên hệ thống." },
  ProductImage: { label: "Ảnh sản phẩm", description: "Ảnh đại diện và gallery của từng sản phẩm." },
  Banner: { label: "Banner", description: "Banner hero, khuyến mãi và các vị trí nổi bật." },
  FaqItem: { label: "FAQ", description: "Các câu hỏi thường gặp hiển thị trên website." },
  Review: { label: "Đánh giá", description: "Phản hồi của khách hàng cho sản phẩm và dịch vụ." },
  Favorite: { label: "Yêu thích", description: "Sản phẩm người dùng đã lưu vào wishlist." },
  Cart: { label: "Giỏ hàng", description: "Thông tin giỏ hàng đang lưu theo tài khoản." },
  CartItem: { label: "Sản phẩm trong giỏ", description: "Từng dòng sản phẩm đã thêm vào giỏ." },
  Order: { label: "Đơn hàng", description: "Đơn hàng phát sinh từ marketplace." },
  OrderItem: { label: "Chi tiết đơn", description: "Các dòng sản phẩm thuộc một đơn hàng." },
  Payment: { label: "Thanh toán", description: "Lịch sử thanh toán và trạng thái giao dịch." },
  Coupon: { label: "Mã giảm giá", description: "Các coupon áp dụng trong quá trình thanh toán." },
  CouponUsage: { label: "Lượt dùng coupon", description: "Theo dõi coupon đã được dùng cho đơn nào." },
  SupportTicket: { label: "Phiếu hỗ trợ", description: "Ticket hỗ trợ của khách hàng và nhân viên." },
  TicketMessage: { label: "Tin nhắn ticket", description: "Nội dung trao đổi trong từng ticket hỗ trợ." },
  Notification: { label: "Thông báo", description: "Thông báo hệ thống, đơn hàng và thanh toán." },
  GiftCardCode: { label: "Kho mã gift card", description: "Danh sách mã gift card và trạng thái cấp phát." },
  ServiceRecord: { label: "Bản ghi dịch vụ", description: "Dịch vụ VPS, cloud và dịch vụ số đã cấp cho khách." },
  VpsInstance: { label: "VPS instance", description: "Thông tin VPS/Cloud instance đã provision." },
  MediaAsset: { label: "Media asset", description: "Tệp media đã upload và metadata sử dụng." },
  AuditLog: { label: "Nhật ký hệ thống", description: "Lịch sử thao tác của admin và các thay đổi chính." },
  PasswordResetToken: { label: "Token đặt lại mật khẩu", description: "Token đặt lại mật khẩu đã phát hành." },
  SiteSetting: { label: "Cài đặt website", description: "Cấu hình chung của thương hiệu và tích hợp." }
};

const fieldLabelMap: Record<string, string> = {
  id: "ID",
  email: "Email",
  passwordHash: "Mật khẩu",
  fullName: "Họ tên",
  phone: "Số điện thoại",
  avatarUrl: "Ảnh đại diện",
  role: "Vai trò",
  status: "Trạng thái",
  notificationsEnabled: "Bật thông báo",
  createdAt: "Tạo lúc",
  updatedAt: "Cập nhật lúc",
  expires: "Hết hạn",
  sessionToken: "Session token",
  provider: "Nhà cung cấp",
  providerAccountId: "Mã tài khoản nhà cung cấp",
  refreshToken: "Refresh token",
  accessToken: "Access token",
  expiresAt: "Hết hạn lúc",
  tokenType: "Kiểu token",
  scope: "Phạm vi",
  idToken: "ID token",
  sessionState: "Trạng thái phiên",
  name: "Tên",
  slug: "Slug",
  description: "Mô tả",
  shortDescription: "Mô tả ngắn",
  deliveryNotes: "Ghi chú giao hàng",
  refundNotes: "Chính sách hoàn tiền",
  type: "Loại",
  price: "Giá",
  compareAtPrice: "Giá so sánh",
  stock: "Tồn kho",
  rating: "Đánh giá",
  reviewsCount: "Số đánh giá",
  isPublished: "Đang hiển thị",
  isFeatured: "Nổi bật",
  isHot: "Hot",
  isPromotion: "Khuyến mãi",
  tags: "Tags",
  defaultImageUrl: "Ảnh mặc định",
  cpu: "CPU",
  ram: "RAM",
  storage: "Dung lượng",
  bandwidth: "Băng thông",
  operatingSystem: "Hệ điều hành",
  metadata: "Metadata",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
  ogImage: "OG image",
  imageUrl: "URL ảnh",
  altText: "Alt text",
  sortOrder: "Thứ tự",
  isPrimary: "Ảnh chính",
  title: "Tiêu đề",
  subtitle: "Phụ đề",
  ctaLabel: "Nhãn CTA",
  ctaLink: "Link CTA",
  placement: "Vị trí",
  isActive: "Kích hoạt",
  question: "Câu hỏi",
  answer: "Câu trả lời",
  category: "Danh mục",
  content: "Nội dung",
  verifiedPurchase: "Đã xác minh mua hàng",
  userId: "ID người dùng",
  productId: "ID sản phẩm",
  parentId: "ID danh mục cha",
  categoryId: "ID danh mục",
  cartId: "ID giỏ hàng",
  quantity: "Số lượng",
  orderCode: "Mã đơn hàng",
  subtotal: "Tạm tính",
  discount: "Giảm giá",
  total: "Tổng tiền",
  note: "Ghi chú khách hàng",
  adminNote: "Ghi chú quản trị",
  completedAt: "Hoàn tất lúc",
  orderId: "ID đơn hàng",
  unitPrice: "Đơn giá",
  totalPrice: "Thành tiền",
  gateway: "Cổng thanh toán",
  transactionCode: "Mã giao dịch",
  callbackLog: "Callback log",
  refundStatus: "Trạng thái hoàn tiền",
  paidAt: "Thanh toán lúc",
  discountType: "Loại giảm giá",
  discountValue: "Giá trị giảm",
  minOrderValue: "Đơn tối thiểu",
  usageLimit: "Giới hạn sử dụng",
  usedCount: "Đã dùng",
  startsAt: "Bắt đầu lúc",
  endsAt: "Kết thúc lúc",
  usedAt: "Đã dùng lúc",
  subject: "Tiêu đề phiếu",
  priority: "Mức ưu tiên",
  senderType: "Người gửi",
  body: "Nội dung tin nhắn",
  level: "Mức độ",
  isRead: "Đã đọc",
  link: "Liên kết",
  code: "Mã",
  reservedAt: "Giữ mã lúc",
  soldAt: "Bán lúc",
  renewAt: "Gia hạn lúc",
  serviceName: "Tên dịch vụ",
  deliveryLog: "Nhật ký cấp phát",
  ipAddress: "IP address",
  username: "Username",
  password: "Mật khẩu VPS",
  renewDate: "Ngày gia hạn",
  controlPanelUrl: "URL panel",
  serviceRecordId: "ID bản ghi dịch vụ",
  fileName: "Tên tệp",
  fileUrl: "URL tệp",
  fileType: "Loại tệp",
  size: "Dung lượng",
  usageType: "Loại sử dụng",
  driver: "Driver lưu trữ",
  uploadedBy: "Người tải lên",
  action: "Hành động",
  resource: "Tài nguyên",
  resourceId: "ID tài nguyên",
  detail: "Chi tiết",
  actorId: "ID người thao tác",
  token: "Token",
  logoUrl: "Logo URL",
  faviconUrl: "Favicon URL",
  primaryColor: "Màu chính",
  secondaryColor: "Màu phụ",
  robotsContent: "Robots",
  sitemapConfig: "Sitemap config",
  paymentConfig: "Payment config",
  aiIntegration: "AI integration",
  emailConfig: "Email config"
};

const modelOrder = [
  "User",
  "Category",
  "Product",
  "Order",
  "Payment",
  "SupportTicket",
  "GiftCardCode",
  "ServiceRecord",
  "MediaAsset",
  "Banner",
  "Coupon",
  "Notification",
  "FaqItem",
  "Review",
  "Favorite",
  "Cart",
  "CartItem",
  "OrderItem",
  "CouponUsage",
  "TicketMessage",
  "VpsInstance",
  "SiteSetting",
  "AuditLog",
  "PasswordResetToken",
  "Session",
  "Account",
  "ProductImage"
];

function getDelegate(modelName: string) {
  const delegateKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return (prisma as Record<string, any>)[delegateKey];
}

function getModelDefinition(modelName: string) {
  const model = Prisma.dmmf.datamodel.models.find((item) => item.name === modelName);
  if (!model) {
    throw new Error(`Không tìm thấy model ${modelName} trong Prisma schema.`);
  }

  return model;
}

function prettifyFieldLabel(fieldName: string) {
  return (
    fieldLabelMap[fieldName] ??
    fieldName
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^./, (value) => value.toUpperCase())
  );
}

function getModelLabel(modelName: string) {
  return (
    modelLabelMap[modelName] ?? {
      label: modelName.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
      description: "Bản ghi dữ liệu từ cơ sở dữ liệu PostgreSQL."
    }
  );
}

function getEnumOptions(field: DmmfField) {
  if (field.kind !== "enum") {
    return undefined;
  }

  const enumDefinition = Prisma.dmmf.datamodel.enums.find((item) => item.name === field.type);
  if (!enumDefinition) {
    return undefined;
  }

  return enumDefinition.values.map((value) => ({
    label: value.name,
    value: value.name
  }));
}

function getFieldInput(field: DmmfField): SqlManagerFieldInput {
  if (field.name === "passwordHash") {
    return "password";
  }

  if (field.kind === "enum") {
    return "select";
  }

  if (field.type === "Boolean") {
    return "boolean";
  }

  if (field.type === "DateTime") {
    return "datetime";
  }

  if (field.type === "Json") {
    return "json";
  }

  if (field.isList && field.type === "String") {
    return "string-array";
  }

  if (field.type === "Int") {
    return "number";
  }

  if (field.type === "Float" || field.type === "Decimal") {
    return "decimal";
  }

  if (
    ["description", "content", "answer", "detail", "callbackLog", "metadata", "paymentConfig", "aiIntegration", "emailConfig", "sitemapConfig", "deliveryLog", "note", "adminNote"].includes(
      field.name
    )
  ) {
    return "textarea";
  }

  return "text";
}

function isReadOnlyField(field: DmmfField) {
  if (field.isUpdatedAt) {
    return true;
  }

  if (field.name === "createdAt" || field.name === "updatedAt") {
    return true;
  }

  if (field.isId && field.hasDefaultValue) {
    return true;
  }

  return false;
}

function getPrimaryField(model: DmmfModel) {
  const preferredFields = [
    "fullName",
    "name",
    "title",
    "email",
    "orderCode",
    "code",
    "subject",
    "serviceName",
    "fileName"
  ];

  return preferredFields.find((fieldName) =>
    model.fields.some((field) => field.name === fieldName && field.kind === "scalar")
  ) ?? "id";
}

function getTableColumns(model: DmmfModel, primaryField: string) {
  const preferredFields = [
    primaryField,
    "status",
    "role",
    "type",
    "email",
    "code",
    "price",
    "total",
    "gateway",
    "category",
    "createdAt"
  ];

  const available = model.fields
    .filter((field) => field.kind === "scalar")
    .map((field) => field.name)
    .filter((field) => field !== "passwordHash" && field !== "callbackLog");

  const uniqueColumns = preferredFields.filter((field, index, all) => {
    return available.includes(field) && all.indexOf(field) === index;
  });

  if (!uniqueColumns.includes("id") && available.includes("id")) {
    uniqueColumns.unshift("id");
  }

  return uniqueColumns.slice(0, 6);
}

function buildFieldMeta(field: DmmfField): SqlManagerFieldMeta {
  const input = getFieldInput(field);
  const readOnly = isReadOnlyField(field);

  return {
    name: field.name,
    label: prettifyFieldLabel(field.name),
    type: field.type,
    input,
    required: field.name === "passwordHash" ? true : field.isRequired && !field.hasDefaultValue && !readOnly,
    readOnly,
    hasDefaultValue: field.hasDefaultValue,
    isList: field.isList,
    isJson: field.type === "Json",
    options: getEnumOptions(field),
    helperText: field.name.endsWith("Id")
      ? "Nhập ID bản ghi liên kết tương ứng trong bảng liên quan."
      : input === "json"
        ? "Nhập dữ liệu JSON hợp lệ."
        : input === "string-array"
          ? "Mỗi dòng là một giá trị."
          : undefined
  };
}

function sortModels(models: SqlManagerModelOverview[]) {
  return [...models].sort((a, b) => {
    const aIndex = modelOrder.indexOf(a.name);
    const bIndex = modelOrder.indexOf(b.name);

    if (aIndex === -1 && bIndex === -1) {
      return a.label.localeCompare(b.label, "vi");
    }

    if (aIndex === -1) {
      return 1;
    }

    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, serializeValue(entryValue)])
    );
  }

  return value;
}

function normalizeRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, serializeValue(value)])
  );
}

function buildOrderBy(model: DmmfModel) {
  const fieldNames = model.fields.map((field) => field.name);

  if (fieldNames.includes("createdAt")) {
    return { createdAt: "desc" } as const;
  }

  if (fieldNames.includes("updatedAt")) {
    return { updatedAt: "desc" } as const;
  }

  if (fieldNames.includes("sortOrder")) {
    return { sortOrder: "asc" } as const;
  }

  if (fieldNames.includes("name")) {
    return { name: "asc" } as const;
  }

  return { id: "desc" } as const;
}

function getSearchableFields(model: DmmfModel) {
  return model.fields
    .filter((field) => field.kind === "scalar" && field.type === "String" && !field.isList)
    .map((field) => field.name)
    .filter((fieldName) => !["passwordHash", "refreshToken", "accessToken", "idToken", "token"].includes(fieldName))
    .slice(0, 6);
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }

  return false;
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  const stringValue = String(value ?? "").trim();
  if (!stringValue) {
    return [];
  }

  if (stringValue.startsWith("[")) {
    const parsed = JSON.parse(stringValue);
    if (!Array.isArray(parsed)) {
      throw new Error("Trường mảng phải là JSON array hoặc danh sách mỗi dòng một giá trị.");
    }

    return parsed.map((item) => String(item).trim()).filter(Boolean);
  }

  return stringValue
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function parseFieldValue(modelName: string, field: SqlManagerFieldMeta, rawValue: unknown, mode: "create" | "update") {
  const isEmpty =
    rawValue === undefined ||
    rawValue === null ||
    (typeof rawValue === "string" && rawValue.trim() === "");

  if (field.name === "passwordHash") {
    if (mode === "update" && isEmpty) {
      return undefined;
    }

    if (isEmpty) {
      throw new Error("Mật khẩu không được để trống.");
    }

    return bcrypt.hash(String(rawValue), 10);
  }

  if (field.isList) {
    return parseStringArray(rawValue);
  }

  if (field.type === "Boolean") {
    return parseBoolean(rawValue);
  }

  if (field.type === "Int") {
    if (isEmpty) {
      return field.required ? 0 : null;
    }

    const value = Number.parseInt(String(rawValue), 10);
    if (Number.isNaN(value)) {
      throw new Error(`${field.label} phải là số nguyên hợp lệ.`);
    }

    return value;
  }

  if (field.type === "Float" || field.type === "Decimal") {
    if (isEmpty) {
      return field.required ? 0 : null;
    }

    const value = Number(String(rawValue));
    if (Number.isNaN(value)) {
      throw new Error(`${field.label} phải là số hợp lệ.`);
    }

    return value;
  }

  if (field.type === "DateTime") {
    if (isEmpty) {
      return field.required ? new Date().toISOString() : null;
    }

    const value = new Date(String(rawValue));
    if (Number.isNaN(value.getTime())) {
      throw new Error(`${field.label} phải là ngày giờ hợp lệ.`);
    }

    return value;
  }

  if (field.type === "Json") {
    if (isEmpty) {
      return null;
    }

    if (typeof rawValue === "object") {
      return rawValue;
    }

    try {
      return JSON.parse(String(rawValue));
    } catch {
      throw new Error(`${field.label} phải là JSON hợp lệ.`);
    }
  }

  if (field.input === "select") {
    if (isEmpty && field.required) {
      throw new Error(`${field.label} không được để trống.`);
    }

    return isEmpty ? null : String(rawValue);
  }

  if (isEmpty) {
    return field.required ? "" : null;
  }

  return String(rawValue);
}

function getEditableFields(meta: SqlManagerModelMeta, mode: "create" | "update") {
  return meta.fields.filter((field) => {
    if (field.readOnly) {
      return false;
    }

    if (mode === "update" && field.name === "passwordHash") {
      return true;
    }

    return true;
  });
}

async function buildMutationPayload(
  modelName: string,
  meta: SqlManagerModelMeta,
  data: Record<string, unknown>,
  mode: "create" | "update"
) {
  const payload: Record<string, unknown> = {};

  for (const field of getEditableFields(meta, mode)) {
    const parsedValue = await parseFieldValue(modelName, field, data[field.name], mode);

    if (mode === "update" && parsedValue === undefined) {
      continue;
    }

    payload[field.name] = parsedValue;
  }

  return payload;
}

export function getSqlModelMeta(modelName: string): SqlManagerModelMeta {
  const model = getModelDefinition(modelName);
  const modelLabel = getModelLabel(modelName);
  const primaryField = getPrimaryField(model);

  return {
    name: model.name,
    label: modelLabel.label,
    description: modelLabel.description,
    primaryField,
    fields: model.fields
      .filter((field) => field.kind === "scalar")
      .map((field) => buildFieldMeta(field)),
    tableColumns: getTableColumns(model, primaryField)
  };
}

export async function getSqlModelOverviewList() {
  const models = await Promise.all(
    Prisma.dmmf.datamodel.models.map(async (model) => {
      const meta = getSqlModelMeta(model.name);
      const delegate = getDelegate(model.name);
      const count = delegate ? await delegate.count() : 0;

      return {
        ...meta,
        count
      } satisfies SqlManagerModelOverview;
    })
  );

  return sortModels(models);
}

export async function getSqlModelRecords({
  modelName,
  page = 1,
  pageSize = 10,
  query = ""
}: {
  modelName: string;
  page?: number;
  pageSize?: number;
  query?: string;
}) {
  const model = getModelDefinition(modelName);
  const delegate = getDelegate(modelName);

  if (!delegate) {
    throw new Error(`Model ${modelName} hiện chưa có delegate Prisma khả dụng.`);
  }

  const searchableFields = getSearchableFields(model);
  const where =
    query.trim() && searchableFields.length
      ? {
          OR: searchableFields.map((fieldName) => ({
            [fieldName]: {
              contains: query.trim(),
              mode: "insensitive"
            }
          }))
        }
      : undefined;

  const totalItems = await delegate.count({ where });
  const currentPage = Math.max(1, page);
  const normalizedPageSize = Math.min(Math.max(pageSize, 5), 50);
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));

  const items = await delegate.findMany({
    where,
    orderBy: buildOrderBy(model),
    skip: (currentPage - 1) * normalizedPageSize,
    take: normalizedPageSize
  });

  return {
    items: items.map((item: Record<string, unknown>) => normalizeRecord(item)),
    totalItems,
    totalPages,
    currentPage,
    pageSize: normalizedPageSize
  } satisfies SqlManagerRecordListResponse;
}

export async function getSqlModelRecordById(modelName: string, id: string) {
  const delegate = getDelegate(modelName);

  if (!delegate) {
    throw new Error(`Model ${modelName} hiện chưa có delegate Prisma khả dụng.`);
  }

  const record = await delegate.findUnique({
    where: { id }
  });

  return record ? normalizeRecord(record) : null;
}

export async function createSqlModelRecord(modelName: string, data: Record<string, unknown>) {
  const delegate = getDelegate(modelName);
  const meta = getSqlModelMeta(modelName);

  if (!delegate) {
    throw new Error(`Model ${modelName} hiện chưa có delegate Prisma khả dụng.`);
  }

  const payload = await buildMutationPayload(modelName, meta, data, "create");
  const record = await delegate.create({
    data: payload
  });

  return normalizeRecord(record);
}

export async function updateSqlModelRecord(
  modelName: string,
  id: string,
  data: Record<string, unknown>
) {
  const delegate = getDelegate(modelName);
  const meta = getSqlModelMeta(modelName);

  if (!delegate) {
    throw new Error(`Model ${modelName} hiện chưa có delegate Prisma khả dụng.`);
  }

  const payload = await buildMutationPayload(modelName, meta, data, "update");
  const record = await delegate.update({
    where: { id },
    data: payload
  });

  return normalizeRecord(record);
}

export async function deleteSqlModelRecord(modelName: string, id: string) {
  const delegate = getDelegate(modelName);

  if (!delegate) {
    throw new Error(`Model ${modelName} hiện chưa có delegate Prisma khả dụng.`);
  }

  await delegate.delete({
    where: { id }
  });
}
