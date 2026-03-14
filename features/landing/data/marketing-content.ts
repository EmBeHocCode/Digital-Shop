export const marketingSections = [
  {
    page: "LANDING",
    key: "hero",
    title: "Mua dịch vụ số. Tức thì.",
    subtitle: "Marketplace dịch vụ số hàng đầu Việt Nam",
    body:
      "Nền tảng marketplace kỹ thuật số toàn diện cho VPS, Cloud Server, Giftcard, Game Card, SIM số và dịch vụ viễn thông. Kích hoạt nhanh, quản trị tập trung và sẵn sàng cho flow AI hỗ trợ bán hàng.",
    ctaLabel: "Bắt đầu ngay",
    ctaHref: "/dashboard",
    sortOrder: 10,
  },
  {
    page: "LANDING",
    key: "services",
    title: "Danh mục dịch vụ số",
    subtitle: "Hạ tầng, digital goods và telecom trong cùng một nền tảng",
    body:
      "Từ product routes đến dashboard giao dịch, toàn bộ luồng đang được chuẩn bị để mở rộng thành marketplace dữ liệu thật thay vì chỉ là demo UI.",
    ctaLabel: "Xem dịch vụ",
    ctaHref: "/services",
    sortOrder: 20,
  },
  {
    page: "LANDING",
    key: "pricing",
    title: "Giá minh bạch, không phí ẩn",
    subtitle: "Bảng giá là nền cho reporting lợi nhuận và automation sau này",
    body:
      "Các plan và mức giá được thiết kế để sau này nối vào pricing history, profit analysis và gợi ý tối ưu cho doanh nghiệp.",
    ctaLabel: "Xem bảng giá",
    ctaHref: "/#pricing",
    sortOrder: 30,
  },
  {
    page: "SERVICES",
    key: "catalog",
    title: "Catalog public",
    subtitle: "Prisma-backed catalog với fallback an toàn",
    body:
      "Catalog hiện hỗ trợ hiển thị từ database khi môi trường sẵn sàng, đồng thời giữ fallback tĩnh để không làm lỗi UI trong giai đoạn triển khai từng bước.",
    ctaLabel: "Mở catalog",
    ctaHref: "/services",
    sortOrder: 10,
  },
] as const

export const marketingFaqs = [
  {
    page: "LANDING",
    question: "Sau khi thanh toán, bao lâu tôi nhận được dịch vụ?",
    answer:
      "Hầu hết digital goods được giao tức thì. VPS và Cloud Server thường khởi tạo trong vòng 30-60 giây. SIM số đẹp giao hàng toàn quốc trong 1-3 ngày làm việc.",
    sortOrder: 10,
  },
  {
    page: "LANDING",
    question: "NexCloud hỗ trợ những phương thức thanh toán nào?",
    answer:
      "Nền tảng hiện có foundation cho ví nội bộ, chuyển khoản ngân hàng và manual confirmation. Stripe hoặc VNPay có thể nối tiếp ở phase payment sau.",
    sortOrder: 20,
  },
  {
    page: "LANDING",
    question: "Tôi có thể nâng hoặc hạ cấu hình VPS không?",
    answer:
      "Flow hiện đã hỗ trợ chọn CPU, RAM, storage, region, OS và chu kỳ thanh toán. Provisioning lifecycle sẽ là phần mở rộng tiếp theo sau khi order flow ổn định.",
    sortOrder: 30,
  },
  {
    page: "SERVICES",
    question: "Catalog hiện lấy dữ liệu từ đâu?",
    answer:
      "Catalog ưu tiên đọc bảng Product trong PostgreSQL qua Prisma. Nếu database chưa sẵn sàng, hệ thống sẽ fallback về nội dung tĩnh để giữ web luôn hoạt động.",
    sortOrder: 10,
  },
] as const

export const testimonials = [
  {
    page: "LANDING",
    name: "Nguyen Trung",
    role: "Lap trinh vien Freelance",
    quote:
      "Mua VPS xong la chay ngay, khong phai cho duyet nhu cac cho khac. Toc do server on dinh va flow mua rat gon.",
    initials: "NT",
    rating: 5,
    sortOrder: 10,
  },
  {
    page: "LANDING",
    name: "Minh Lam",
    role: "Game thu",
    quote:
      "Mua the Steam tien, code ra ngay sau thanh toan. Neu sau nay them bot AI goi y ton kho va gia thi shop se con manh hon nua.",
    initials: "ML",
    rating: 5,
    sortOrder: 20,
  },
  {
    page: "LANDING",
    name: "Thanh Huong",
    role: "Co-founder & CTO",
    quote:
      "Diem dang gia la he thong dang dan chuyen sang du lieu that, nen de scale tu marketplace nho thanh nen tang commerce co analytics ro rang.",
    initials: "TH",
    rating: 5,
    sortOrder: 30,
  },
] as const

export const pricingPlans = [
  {
    slug: "vps-starter",
    page: "LANDING",
    name: "VPS Starter",
    description: "Phu hop website ca nhan va du an nho.",
    monthlyPrice: 99000,
    yearlyPrice: 79000,
    specs: "1 vCPU · 1 GB RAM · 20 GB SSD",
    features: [
      "Bang thong 1 TB/thang",
      "1 dia chi IPv4",
      "Snapshot mien phi",
      "Ho tro cong dong",
    ],
    ctaLabel: "Bat dau mien phi",
    ctaHref: "/services/vps",
    isFeatured: false,
    sortOrder: 10,
  },
  {
    slug: "vps-pro",
    page: "LANDING",
    name: "VPS Pro",
    description: "Toi uu cho ung dung va website thuong mai.",
    monthlyPrice: 249000,
    yearlyPrice: 199000,
    specs: "2 vCPU · 4 GB RAM · 80 GB SSD",
    features: [
      "Bang thong khong gioi han",
      "2 dia chi IPv4",
      "Backup tu dong hang ngay",
      "Ho tro uu tien",
      "Chong DDoS nang cao",
    ],
    ctaLabel: "Dung thu 7 ngay",
    ctaHref: "/services/vps",
    isFeatured: true,
    sortOrder: 20,
  },
  {
    slug: "cloud-business",
    page: "LANDING",
    name: "Cloud Business",
    description: "Danh cho doanh nghiep va he thong lon.",
    monthlyPrice: 599000,
    yearlyPrice: 479000,
    specs: "4 vCPU · 8 GB RAM · 200 GB SSD",
    features: [
      "Bang thong khong gioi han",
      "5 dia chi IPv4",
      "Backup thoi gian thuc",
      "Ho tro ky thuat 24/7",
      "SLA 99.9%",
      "Private Network",
    ],
    ctaLabel: "Lien he tu van",
    ctaHref: "/services/cloud-server",
    isFeatured: false,
    sortOrder: 30,
  },
] as const
