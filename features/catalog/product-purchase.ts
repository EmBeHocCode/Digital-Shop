import { z } from "zod"
import { formatCurrency } from "@/lib/utils"

export type ProductPurchaseKind =
  | "infrastructure"
  | "digital_goods"
  | "sim"
  | "topup"

export interface ProductPurchaseSubject {
  slug: string
  name: string
  priceValue: number
  priceLabel: string
  category: string
}

export interface ChoiceOption {
  id: string
  label: string
  description?: string
  priceAdjustment?: number
  badge?: string
  recommended?: boolean
}

export interface BillingCycleOption {
  id: string
  label: string
  months: number
  multiplier: number
  savings?: string
  recommended?: boolean
}

export interface DenominationOption {
  id: string
  label: string
  amount: number
  note?: string
  recommended?: boolean
}

export interface SimNumberOption {
  id: string
  providerId: string
  categoryId: string
  value: string
  price: number
  tags: string[]
}

interface ProductPurchaseBase {
  kind: ProductPurchaseKind
  headline: string
  description: string
  ctaLabel: string
  quickFacts: string[]
}

export interface InfrastructureExperience extends ProductPurchaseBase {
  kind: "infrastructure"
  cpuOptions: ChoiceOption[]
  ramOptions: ChoiceOption[]
  storageOptions: ChoiceOption[]
  regionOptions: ChoiceOption[]
  osOptions: ChoiceOption[]
  cycleOptions: BillingCycleOption[]
}

export interface DigitalGoodsExperience extends ProductPurchaseBase {
  kind: "digital_goods"
  brandOptions: ChoiceOption[]
  denominationOptions: DenominationOption[]
  deliveryMessage: string
  maxQuantity: number
}

export interface SimExperience extends ProductPurchaseBase {
  kind: "sim"
  providerOptions: ChoiceOption[]
  categoryOptions: ChoiceOption[]
  availableNumbers: SimNumberOption[]
}

export interface TopupExperience extends ProductPurchaseBase {
  kind: "topup"
  carrierOptions: ChoiceOption[]
  denominationOptions: DenominationOption[]
  helperText: string
}

export type ProductPurchaseExperience =
  | InfrastructureExperience
  | DigitalGoodsExperience
  | SimExperience
  | TopupExperience

const positiveQuantitySchema = z.number().int().min(1, "Số lượng phải lớn hơn 0.")

export const purchaseSelectionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("infrastructure"),
    cpu: z.string().min(1),
    ram: z.string().min(1),
    storage: z.string().min(1),
    region: z.string().min(1),
    os: z.string().min(1),
    cycle: z.string().min(1),
    quantity: positiveQuantitySchema.max(1),
  }),
  z.object({
    kind: z.literal("digital_goods"),
    brand: z.string().min(1),
    denomination: z.string().min(1),
    quantity: positiveQuantitySchema.max(20),
    deliveryNote: z.string().trim().max(160).optional().or(z.literal("")),
  }),
  z.object({
    kind: z.literal("sim"),
    provider: z.string().min(1),
    category: z.string().min(1),
    numberId: z.string().min(1),
    quantity: positiveQuantitySchema.max(1),
  }),
  z.object({
    kind: z.literal("topup"),
    carrier: z.string().min(1),
    denomination: z.string().min(1),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{9,11}$/, "Số điện thoại cần từ 9 đến 11 chữ số."),
    quantity: positiveQuantitySchema.max(1),
  }),
])

export type PurchaseSelection = z.infer<typeof purchaseSelectionSchema>

export interface ResolvedProductPurchase {
  kind: ProductPurchaseKind
  quantity: number
  unitPrice: number
  unitPriceLabel: string
  totalPrice: number
  totalPriceLabel: string
  title: string
  summaryLines: string[]
  ctaLabel: string
  allowQuantityAdjustment: boolean
}

const productPurchaseRegistry: Record<string, ProductPurchaseExperience> = {
  vps: {
    kind: "infrastructure",
    headline: "Cấu hình VPS theo nhu cầu workload",
    description:
      "Chọn tài nguyên lõi, khu vực triển khai và chu kỳ thanh toán để ra được gói phù hợp cho website, bot hoặc ứng dụng nội bộ.",
    ctaLabel: "Thêm cấu hình VPS",
    quickFacts: ["Provisioning gần tức thì", "Snapshot định kỳ", "Có thể nâng cấp sau khi mua"],
    cpuOptions: [
      { id: "2vcpu", label: "2 vCPU", description: "Website và tool cơ bản", recommended: true },
      { id: "4vcpu", label: "4 vCPU", description: "App nhiều worker", priceAdjustment: 45000 },
      { id: "8vcpu", label: "8 vCPU", description: "Tải cao và nhiều tiến trình", priceAdjustment: 90000, badge: "Scale" },
    ],
    ramOptions: [
      { id: "4gb", label: "4 GB RAM", description: "Khởi đầu ổn định", recommended: true },
      { id: "8gb", label: "8 GB RAM", description: "Dành cho app/API traffic tăng", priceAdjustment: 35000 },
      { id: "16gb", label: "16 GB RAM", description: "Worker, queue và cache", priceAdjustment: 70000 },
    ],
    storageOptions: [
      { id: "80gb", label: "80 GB NVMe", recommended: true },
      { id: "160gb", label: "160 GB NVMe", priceAdjustment: 20000 },
      { id: "320gb", label: "320 GB NVMe", priceAdjustment: 55000, badge: "Backup heavy" },
    ],
    regionOptions: [
      { id: "hcm", label: "Ho Chi Minh", description: "Độ trễ thấp tại VN", recommended: true },
      { id: "singapore", label: "Singapore", description: "Tối ưu khu vực SEA", priceAdjustment: 20000 },
    ],
    osOptions: [
      { id: "ubuntu-24", label: "Ubuntu 24.04 LTS", recommended: true },
      { id: "debian-12", label: "Debian 12", description: "Ổn định cho môi trường production" },
      { id: "windows-2022", label: "Windows Server 2022", priceAdjustment: 15000, badge: "License" },
    ],
    cycleOptions: [
      { id: "monthly", label: "1 tháng", months: 1, multiplier: 1, recommended: true },
      { id: "quarterly", label: "3 tháng", months: 3, multiplier: 2.85, savings: "Tiết kiệm 5%" },
      { id: "yearly", label: "12 tháng", months: 12, multiplier: 10.8, savings: "Tiết kiệm 10%" },
    ],
  },
  "cloud-server": {
    kind: "infrastructure",
    headline: "Cloud server tối ưu cho môi trường production",
    description:
      "Tập trung vào khả năng scale, backup và network riêng cho các workload cần độ ổn định cao hơn VPS phổ thông.",
    ctaLabel: "Lưu cấu hình cloud",
    quickFacts: ["Snapshot & backup", "Private network", "Hỗ trợ scale theo tải"],
    cpuOptions: [
      { id: "4vcpu", label: "4 vCPU", description: "Node ứng dụng hoặc API", recommended: true },
      { id: "8vcpu", label: "8 vCPU", description: "Service xử lý nền và HA cơ bản", priceAdjustment: 65000 },
      { id: "16vcpu", label: "16 vCPU", description: "Workload nặng / nhiều container", priceAdjustment: 160000, badge: "High IO" },
    ],
    ramOptions: [
      { id: "8gb", label: "8 GB RAM", recommended: true },
      { id: "16gb", label: "16 GB RAM", description: "Tốt cho app + cache", priceAdjustment: 55000 },
      { id: "32gb", label: "32 GB RAM", description: "Dành cho workload growth", priceAdjustment: 130000 },
    ],
    storageOptions: [
      { id: "160gb", label: "160 GB SSD", recommended: true },
      { id: "320gb", label: "320 GB SSD", priceAdjustment: 45000 },
      { id: "640gb", label: "640 GB SSD", priceAdjustment: 115000, badge: "Data-heavy" },
    ],
    regionOptions: [
      { id: "singapore", label: "Singapore", description: "Core region cho SEA", recommended: true },
      { id: "tokyo", label: "Tokyo", description: "Tối ưu APAC latency", priceAdjustment: 30000 },
      { id: "hcm", label: "Ho Chi Minh", description: "Kết nối nội địa nhanh", priceAdjustment: 18000 },
    ],
    osOptions: [
      { id: "ubuntu-24", label: "Ubuntu 24.04 LTS", recommended: true },
      { id: "rocky-9", label: "Rocky Linux 9", description: "Ổn định cho doanh nghiệp" },
      { id: "windows-2022", label: "Windows Server 2022", priceAdjustment: 25000, badge: "License" },
    ],
    cycleOptions: [
      { id: "monthly", label: "1 tháng", months: 1, multiplier: 1, recommended: true },
      { id: "semiannual", label: "6 tháng", months: 6, multiplier: 5.4, savings: "Tiết kiệm 10%" },
      { id: "yearly", label: "12 tháng", months: 12, multiplier: 10.2, savings: "Tiết kiệm 15%" },
    ],
  },
  giftcard: {
    kind: "digital_goods",
    headline: "Mua giftcard nhanh, giao mã tự động",
    description:
      "Chọn thương hiệu, mệnh giá và số lượng. Mã quà tặng sẽ được xử lý theo flow digital goods sau khi thanh toán.",
    ctaLabel: "Thêm giftcard vào giỏ",
    quickFacts: ["Giao mã tự động", "Dễ dùng cho reseller", "Phù hợp chiến dịch khuyến mãi"],
    deliveryMessage: "Mã giftcard sẽ được phát hành trong dashboard hoặc gửi qua email đã đăng ký.",
    maxQuantity: 20,
    brandOptions: [
      { id: "amazon", label: "Amazon", recommended: true },
      { id: "google-play", label: "Google Play" },
      { id: "itunes", label: "iTunes / App Store" },
      { id: "steam", label: "Steam Wallet", badge: "Hot" },
    ],
    denominationOptions: [
      { id: "100k", label: "100.000đ", amount: 100000, recommended: true },
      { id: "200k", label: "200.000đ", amount: 200000 },
      { id: "500k", label: "500.000đ", amount: 500000 },
      { id: "1000k", label: "1.000.000đ", amount: 1000000, note: "Ưu tiên tồn kho cho reseller" },
    ],
  },
  "game-cards": {
    kind: "digital_goods",
    headline: "Nạp game tự động cho các nền tảng phổ biến",
    description:
      "Thiết kế cho nhu cầu mua nhanh, số lượng linh hoạt và rõ mệnh giá để tối ưu conversion trên digital goods.",
    ctaLabel: "Thêm game cards",
    quickFacts: ["Realtime delivery", "Phù hợp game thủ và reseller", "Giao dịch 24/7"],
    deliveryMessage: "Hệ thống sẽ tạo record giao mã hoặc chờ xử lý theo từng nhà phát hành.",
    maxQuantity: 12,
    brandOptions: [
      { id: "garena", label: "Garena Shells", recommended: true },
      { id: "riot", label: "Riot Points" },
      { id: "roblox", label: "Robux" },
      { id: "steam", label: "Steam Wallet", badge: "Global" },
    ],
    denominationOptions: [
      { id: "50k", label: "50.000đ", amount: 50000, recommended: true },
      { id: "100k", label: "100.000đ", amount: 100000 },
      { id: "200k", label: "200.000đ", amount: 200000 },
      { id: "500k", label: "500.000đ", amount: 500000, note: "Ưu tiên khách hàng đã xác minh" },
    ],
  },
  sim: {
    kind: "sim",
    headline: "Chọn kho số đẹp theo nhà mạng và nhóm số",
    description:
      "Filter nhanh theo nhà mạng, nhóm số và chọn số minh họa ngay trên product page để đi tiếp sang checkout.",
    ctaLabel: "Giữ số vào giỏ",
    quickFacts: ["Kho số mô phỏng", "Lọc theo nhóm số", "Có thể điều hướng sang tư vấn"],
    providerOptions: [
      { id: "viettel", label: "Viettel", recommended: true },
      { id: "vinaphone", label: "Vinaphone" },
      { id: "mobifone", label: "Mobifone" },
    ],
    categoryOptions: [
      { id: "easy", label: "Dễ nhớ", recommended: true },
      { id: "business", label: "Kinh doanh" },
      { id: "feng-shui", label: "Phong thủy", badge: "Premium" },
    ],
    availableNumbers: [
      { id: "vt-6888", providerId: "viettel", categoryId: "easy", value: "0986 88 6688", price: 420000, tags: ["Lặp 88", "Dễ đọc"] },
      { id: "vt-biz", providerId: "viettel", categoryId: "business", value: "0979 79 7979", price: 780000, tags: ["Sale hotline", "Nhận diện cao"] },
      { id: "vn-phong", providerId: "vinaphone", categoryId: "feng-shui", value: "0912 68 8668", price: 1450000, tags: ["Lộc phát", "Phong thủy"] },
      { id: "vn-easy", providerId: "vinaphone", categoryId: "easy", value: "0945 55 2255", price: 560000, tags: ["Tứ quý giữa", "Dễ nhớ"] },
      { id: "mb-biz", providerId: "mobifone", categoryId: "business", value: "0908 08 8080", price: 1180000, tags: ["Hotline đẹp", "Đội sales"] },
      { id: "mb-easy", providerId: "mobifone", categoryId: "easy", value: "0933 66 5566", price: 490000, tags: ["Đối xứng", "Nhẹ ngân sách"] },
    ],
  },
  topup: {
    kind: "topup",
    headline: "Top-up theo nhà mạng và mệnh giá",
    description:
      "Nhập số điện thoại, chọn carrier và mệnh giá để tạo đơn telecom rõ ràng, phù hợp cả người dùng cuối lẫn điểm bán lẻ.",
    ctaLabel: "Thêm lệnh top-up",
    quickFacts: ["Realtime xử lý", "Dễ dùng trên mobile", "Sẵn sàng cho flow telecom reseller"],
    helperText: "Hệ thống hiện lưu order rõ carrier, mệnh giá và số nhận để sẵn sàng cho tích hợp telecom thật.",
    carrierOptions: [
      { id: "viettel", label: "Viettel", recommended: true },
      { id: "vinaphone", label: "Vinaphone" },
      { id: "mobifone", label: "Mobifone" },
      { id: "vietnamobile", label: "Vietnamobile" },
    ],
    denominationOptions: [
      { id: "20k", label: "20.000đ", amount: 20000 },
      { id: "50k", label: "50.000đ", amount: 50000, recommended: true },
      { id: "100k", label: "100.000đ", amount: 100000 },
      { id: "200k", label: "200.000đ", amount: 200000 },
    ],
  },
} satisfies Record<string, ProductPurchaseExperience>

function getRecommendedOptionId<
  TOption extends { id: string; recommended?: boolean }
>(options: readonly TOption[]) {
  return options.find((option) => option.recommended)?.id ?? options[0]?.id ?? ""
}

function getChoiceOption(options: readonly ChoiceOption[], id: string, label: string) {
  const option = options.find((item) => item.id === id)

  if (!option) {
    throw new Error(`Không tìm thấy tuỳ chọn ${label}.`)
  }

  return option
}

function getBillingCycleOption(options: readonly BillingCycleOption[], id: string) {
  const option = options.find((item) => item.id === id)

  if (!option) {
    throw new Error("Chu kỳ thanh toán không hợp lệ.")
  }

  return option
}

function getDenominationOption(options: readonly DenominationOption[], id: string) {
  const option = options.find((item) => item.id === id)

  if (!option) {
    throw new Error("Mệnh giá không hợp lệ.")
  }

  return option
}

function roundCurrency(value: number) {
  return Math.round(value)
}

export function getProductPurchaseExperience(slug: string): ProductPurchaseExperience | null {
  return productPurchaseRegistry[slug] ?? null
}

export function createDefaultPurchaseSelection(slug: string): PurchaseSelection | null {
  const experience = getProductPurchaseExperience(slug)

  if (!experience) {
    return null
  }

  switch (experience.kind) {
    case "infrastructure":
      return {
        kind: "infrastructure",
        cpu: getRecommendedOptionId(experience.cpuOptions),
        ram: getRecommendedOptionId(experience.ramOptions),
        storage: getRecommendedOptionId(experience.storageOptions),
        region: getRecommendedOptionId(experience.regionOptions),
        os: getRecommendedOptionId(experience.osOptions),
        cycle: getRecommendedOptionId(experience.cycleOptions),
        quantity: 1,
      }
    case "digital_goods":
      return {
        kind: "digital_goods",
        brand: getRecommendedOptionId(experience.brandOptions),
        denomination: getRecommendedOptionId(experience.denominationOptions),
        quantity: 1,
        deliveryNote: "",
      }
    case "sim":
      return {
        kind: "sim",
        provider: getRecommendedOptionId(experience.providerOptions),
        category: getRecommendedOptionId(experience.categoryOptions),
        numberId:
          experience.availableNumbers.find(
            (number: SimNumberOption) =>
              number.providerId === getRecommendedOptionId(experience.providerOptions) &&
              number.categoryId === getRecommendedOptionId(experience.categoryOptions)
          )?.id ?? experience.availableNumbers[0]?.id ?? "",
        quantity: 1,
      }
    case "topup":
      return {
        kind: "topup",
        carrier: getRecommendedOptionId(experience.carrierOptions),
        denomination: getRecommendedOptionId(experience.denominationOptions),
        phoneNumber: "",
        quantity: 1,
      }
    default:
      return null
  }
}

export function resolveProductPurchase(
  product: ProductPurchaseSubject,
  selection?: PurchaseSelection | null
): ResolvedProductPurchase {
  const experience = getProductPurchaseExperience(product.slug)

  if (!experience || !selection) {
    const totalPrice = roundCurrency(product.priceValue)

    return {
      kind: experience?.kind ?? "digital_goods",
      quantity: 1,
      unitPrice: totalPrice,
      unitPriceLabel: product.priceLabel || formatCurrency(totalPrice),
      totalPrice,
      totalPriceLabel: formatCurrency(totalPrice),
      title: product.name,
      summaryLines: [
        product.category,
        "Dùng cấu hình mặc định từ catalog hiện tại.",
      ],
      ctaLabel: "Thêm vào giỏ hàng",
      allowQuantityAdjustment: true,
    }
  }

  if (selection.kind !== experience.kind) {
    throw new Error("Loại cấu hình sản phẩm không khớp với dịch vụ hiện tại.")
  }

  switch (experience.kind) {
    case "infrastructure": {
      if (selection.kind !== "infrastructure") {
        throw new Error("Cấu hình infrastructure không hợp lệ.")
      }

      const cpu = getChoiceOption(experience.cpuOptions, selection.cpu, "CPU")
      const ram = getChoiceOption(experience.ramOptions, selection.ram, "RAM")
      const storage = getChoiceOption(experience.storageOptions, selection.storage, "Storage")
      const region = getChoiceOption(experience.regionOptions, selection.region, "Region")
      const os = getChoiceOption(experience.osOptions, selection.os, "OS")
      const cycle = getBillingCycleOption(experience.cycleOptions, selection.cycle)
      const monthlyBase =
        product.priceValue +
        (cpu.priceAdjustment ?? 0) +
        (ram.priceAdjustment ?? 0) +
        (storage.priceAdjustment ?? 0) +
        (region.priceAdjustment ?? 0) +
        (os.priceAdjustment ?? 0)
      const unitPrice = roundCurrency(monthlyBase * cycle.multiplier)

      return {
        kind: "infrastructure",
        quantity: 1,
        unitPrice,
        unitPriceLabel: formatCurrency(unitPrice),
        totalPrice: unitPrice,
        totalPriceLabel: formatCurrency(unitPrice),
        title: `${cpu.label} • ${ram.label} • ${storage.label}`,
        summaryLines: [
          `${region.label} • ${os.label}`,
          `Chu kỳ ${cycle.label}${cycle.savings ? ` • ${cycle.savings}` : ""}`,
          ...experience.quickFacts.slice(0, 1),
        ],
        ctaLabel: experience.ctaLabel,
        allowQuantityAdjustment: false,
      }
    }
    case "digital_goods": {
      if (selection.kind !== "digital_goods") {
        throw new Error("Cấu hình digital goods không hợp lệ.")
      }

      const brand = getChoiceOption(experience.brandOptions, selection.brand, "Brand")
      const denomination = getDenominationOption(
        experience.denominationOptions,
        selection.denomination
      )
      const quantity = selection.quantity
      const unitPrice = denomination.amount
      const totalPrice = roundCurrency(unitPrice * quantity)

      return {
        kind: "digital_goods",
        quantity,
        unitPrice,
        unitPriceLabel: formatCurrency(unitPrice),
        totalPrice,
        totalPriceLabel: formatCurrency(totalPrice),
        title: `${brand.label} • ${denomination.label}`,
        summaryLines: [
          experience.deliveryMessage,
          denomination.note ?? `Số lượng: ${quantity} mã`,
          ...(selection.deliveryNote ? [`Ghi chú: ${selection.deliveryNote}`] : []),
        ],
        ctaLabel: experience.ctaLabel,
        allowQuantityAdjustment: true,
      }
    }
    case "sim": {
      if (selection.kind !== "sim") {
        throw new Error("Cấu hình SIM không hợp lệ.")
      }

      const provider = getChoiceOption(experience.providerOptions, selection.provider, "Provider")
      const category = getChoiceOption(experience.categoryOptions, selection.category, "Category")
      const selectedNumber = experience.availableNumbers.find(
        (number: SimNumberOption) =>
          number.id === selection.numberId &&
          number.providerId === selection.provider &&
          number.categoryId === selection.category
      )

      if (!selectedNumber) {
        throw new Error("Kho số đã chọn không còn khả dụng.")
      }

      const unitPrice = selectedNumber.price

      return {
        kind: "sim",
        quantity: 1,
        unitPrice,
        unitPriceLabel: formatCurrency(unitPrice),
        totalPrice: unitPrice,
        totalPriceLabel: formatCurrency(unitPrice),
        title: selectedNumber.value,
        summaryLines: [
          `${provider.label} • ${category.label}`,
          selectedNumber.tags.join(" • "),
          experience.quickFacts[0] ?? "Có thể yêu cầu giữ số trong thời gian ngắn.",
        ],
        ctaLabel: experience.ctaLabel,
        allowQuantityAdjustment: false,
      }
    }
    case "topup": {
      if (selection.kind !== "topup") {
        throw new Error("Cấu hình top-up không hợp lệ.")
      }

      const carrier = getChoiceOption(experience.carrierOptions, selection.carrier, "Carrier")
      const denomination = getDenominationOption(
        experience.denominationOptions,
        selection.denomination
      )
      const unitPrice = denomination.amount

      return {
        kind: "topup",
        quantity: 1,
        unitPrice,
        unitPriceLabel: formatCurrency(unitPrice),
        totalPrice: unitPrice,
        totalPriceLabel: formatCurrency(unitPrice),
        title: `${carrier.label} • ${denomination.label}`,
        summaryLines: [
          `Số nhận: ${selection.phoneNumber}`,
          experience.helperText,
          denomination.note ?? "Đối soát theo carrier và số nhận đã nhập.",
        ],
        ctaLabel: experience.ctaLabel,
        allowQuantityAdjustment: false,
      }
    }
    default:
      return {
        kind: "digital_goods",
        quantity: 1,
        unitPrice: product.priceValue,
        unitPriceLabel: product.priceLabel || formatCurrency(product.priceValue),
        totalPrice: product.priceValue,
        totalPriceLabel: formatCurrency(product.priceValue),
        title: product.name,
        summaryLines: [product.category],
        ctaLabel: "Thêm vào giỏ hàng",
        allowQuantityAdjustment: true,
      }
  }
}
