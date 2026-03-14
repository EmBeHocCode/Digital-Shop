import type { Product } from "@/types/domain";

export const products: Product[] = [
  {
    id: "prod-vps-basic",
    name: "VPS Basic",
    slug: "vps-basic",
    shortDescription: "Khởi chạy website và bot ổn định với chi phí dễ tiếp cận.",
    description:
      "Gói VPS Basic phù hợp cho blog, landing page, tool nội bộ và các tác vụ cần uptime tốt. Hạ tầng tối ưu cho thị trường Việt Nam với tốc độ truy cập ổn định.",
    deliveryNotes: "Chọn cấu hình, node và hệ điều hành theo phong cách website hosting phổ biến trên thị trường.",
    price: 189000,
    minPrice: 189000,
    maxPrice: 419000,
    compareAtPrice: 229000,
    type: "VPS",
    categoryId: "cat-vps-basic",
    image: "/images/vps-basic.svg",
    rating: 4.8,
    reviewsCount: 124,
    isFeatured: true,
    isHot: true,
    isPromotion: true,
    tags: ["SSD NVMe", "IPv4 riêng", "Backup tuần"],
    specs: {
      cpu: "2 vCPU",
      ram: "4 GB",
      storage: "80 GB NVMe",
      bandwidth: "3 TB",
      os: "Ubuntu 22.04 / Windows Server"
    },
    configurationOptions: [
      {
        id: "vps-basic-starter",
        label: "Starter",
        description: "Website giới thiệu, bot nhỏ và môi trường dev cá nhân.",
        price: 189000,
        compareAtPrice: 229000,
        specs: {
          cpu: "2 vCPU",
          ram: "4 GB",
          storage: "80 GB NVMe",
          bandwidth: "3 TB",
          region: "Ha Noi"
        },
        highlights: ["Auto deploy 15 phút", "Backup tuần", "1 IPv4 riêng"]
      },
      {
        id: "vps-basic-business",
        label: "Business",
        description: "Landing page, CRM nhẹ và website nhiều lượt truy cập hơn.",
        price: 289000,
        compareAtPrice: 339000,
        isPopular: true,
        specs: {
          cpu: "4 vCPU",
          ram: "6 GB",
          storage: "120 GB NVMe",
          bandwidth: "4 TB",
          region: "Ha Noi / Ho Chi Minh"
        },
        highlights: ["Snapshot nhanh", "Priority queue", "Free migration cơ bản"]
      },
      {
        id: "vps-basic-scale",
        label: "Scale",
        description: "Tối ưu cho workload tăng trưởng hoặc chạy nhiều site cùng lúc.",
        price: 419000,
        compareAtPrice: 459000,
        specs: {
          cpu: "6 vCPU",
          ram: "8 GB",
          storage: "160 GB NVMe",
          bandwidth: "5 TB",
          region: "Ha Noi / Singapore"
        },
        highlights: ["Snapshot hằng ngày", "Băng thông cao", "SLA ưu tiên"]
      }
    ]
  },
  {
    id: "prod-vps-gaming",
    name: "VPS Gaming",
    slug: "vps-gaming",
    shortDescription: "Tối ưu game server, latency thấp và mạng ổn định.",
    description:
      "VPS Gaming tập trung vào hiệu năng đơn nhân và băng thông tốt cho game server, stream tool và workload có độ trễ nhạy cảm.",
    deliveryNotes: "Có thể chọn preset tối ưu theo game server hoặc node Việt Nam/SG tùy tải.",
    price: 359000,
    minPrice: 359000,
    maxPrice: 799000,
    compareAtPrice: 419000,
    type: "VPS",
    categoryId: "cat-vps-gaming",
    image: "/images/vps-gaming.svg",
    rating: 4.9,
    reviewsCount: 88,
    isFeatured: true,
    isHot: true,
    isPromotion: false,
    tags: ["Game ready", "DDoS basic", "Deploy nhanh"],
    specs: {
      cpu: "4 vCPU",
      ram: "8 GB",
      storage: "160 GB NVMe",
      bandwidth: "5 TB",
      os: "Windows Server / Ubuntu"
    },
    configurationOptions: [
      {
        id: "vps-gaming-bronze",
        label: "Bronze",
        description: "Minecraft, Valheim hoặc bot game cỡ nhỏ.",
        price: 359000,
        compareAtPrice: 419000,
        specs: {
          cpu: "4 vCPU",
          ram: "8 GB",
          storage: "160 GB NVMe",
          bandwidth: "5 TB",
          region: "Ho Chi Minh"
        },
        highlights: ["Low latency VN", "Basic DDoS", "Deploy nhanh"]
      },
      {
        id: "vps-gaming-silver",
        label: "Silver",
        description: "Game server đông người chơi, stream panel và plugin nặng.",
        price: 539000,
        compareAtPrice: 619000,
        isPopular: true,
        specs: {
          cpu: "6 vCPU",
          ram: "12 GB",
          storage: "220 GB NVMe",
          bandwidth: "7 TB",
          region: "Ho Chi Minh / Singapore"
        },
        highlights: ["Ưu tiên CPU đơn nhân", "Anti-DDoS nâng cao", "Panel sẵn sàng"]
      },
      {
        id: "vps-gaming-gold",
        label: "Gold",
        description: "Cụm game server hoặc nhu cầu always-on hiệu năng cao.",
        price: 799000,
        compareAtPrice: 879000,
        specs: {
          cpu: "8 vCPU",
          ram: "16 GB",
          storage: "320 GB NVMe",
          bandwidth: "10 TB",
          region: "Singapore"
        },
        highlights: ["Burst CPU cao", "Snapshot tự động", "Queue hỗ trợ riêng"]
      }
    ]
  },
  {
    id: "prod-vps-premium",
    name: "VPS Premium",
    slug: "vps-premium",
    shortDescription: "Hạ tầng mạnh cho production, thương mại điện tử và CI/CD.",
    description:
      "VPS Premium được thiết kế cho workload production với tài nguyên dư dả, snapshot định kỳ và đội hỗ trợ ưu tiên.",
    deliveryNotes: "Các preset premium dành cho e-commerce, CI/CD, SaaS nhỏ và môi trường production thực tế.",
    price: 699000,
    minPrice: 699000,
    maxPrice: 1399000,
    compareAtPrice: 799000,
    type: "VPS",
    categoryId: "cat-vps-premium",
    image: "/images/vps-premium.svg",
    rating: 4.9,
    reviewsCount: 61,
    isFeatured: false,
    isHot: true,
    isPromotion: false,
    tags: ["Production", "Snapshot", "Priority support"],
    specs: {
      cpu: "8 vCPU",
      ram: "16 GB",
      storage: "320 GB NVMe",
      bandwidth: "8 TB",
      os: "Ubuntu / Debian / Windows Server"
    },
    configurationOptions: [
      {
        id: "vps-premium-pro",
        label: "Pro",
        description: "Production vừa, store online và API traffic ổn định.",
        price: 699000,
        compareAtPrice: 799000,
        specs: {
          cpu: "8 vCPU",
          ram: "16 GB",
          storage: "320 GB NVMe",
          bandwidth: "8 TB",
          region: "Ha Noi / Ho Chi Minh"
        },
        highlights: ["Snapshot định kỳ", "Monitoring cơ bản", "Priority support"]
      },
      {
        id: "vps-premium-scale",
        label: "Scale Pro",
        description: "ERP, nhiều site hoặc batch job cần tài nguyên lớn hơn.",
        price: 999000,
        compareAtPrice: 1129000,
        isPopular: true,
        specs: {
          cpu: "12 vCPU",
          ram: "24 GB",
          storage: "480 GB NVMe",
          bandwidth: "10 TB",
          region: "Singapore"
        },
        highlights: ["IOPS cao", "Snapshot 2 lần/ngày", "Queue support VIP"]
      },
      {
        id: "vps-premium-enterprise",
        label: "Enterprise",
        description: "Production nặng, staging song song và hệ thống quan trọng.",
        price: 1399000,
        compareAtPrice: 1549000,
        specs: {
          cpu: "16 vCPU",
          ram: "32 GB",
          storage: "640 GB NVMe",
          bandwidth: "12 TB",
          region: "Singapore / Tokyo"
        },
        highlights: ["Dedicated CPU ratio", "Backup ngày", "Managed onboarding"]
      }
    ]
  },
  {
    id: "prod-vps-windows",
    name: "VPS Windows Pro",
    slug: "vps-windows-pro",
    shortDescription: "RDP sẵn sàng cho phần mềm kế toán, tool desktop và vận hành Windows.",
    description:
      "VPS Windows Pro hướng tới người dùng cần môi trường Windows bản quyền, đăng nhập RDP nhanh và cấu hình ổn định cho công việc hằng ngày.",
    deliveryNotes: "Hệ thống dựng sẵn Windows Server và gửi thông tin RDP ngay sau thanh toán thành công.",
    price: 329000,
    minPrice: 329000,
    maxPrice: 829000,
    compareAtPrice: 389000,
    type: "VPS",
    categoryId: "cat-vps-windows",
    image: "/images/vps-windows.svg",
    rating: 4.7,
    reviewsCount: 44,
    isFeatured: true,
    isHot: false,
    isPromotion: true,
    tags: ["Windows License", "RDP", "Office tool"],
    specs: {
      cpu: "4 vCPU",
      ram: "8 GB",
      storage: "120 GB NVMe",
      bandwidth: "4 TB",
      os: "Windows Server 2022"
    },
    configurationOptions: [
      {
        id: "vps-windows-standard",
        label: "Standard",
        description: "RDP nhẹ cho tool nội bộ và phần mềm kế toán.",
        price: 329000,
        compareAtPrice: 389000,
        specs: {
          cpu: "4 vCPU",
          ram: "8 GB",
          storage: "120 GB NVMe",
          bandwidth: "4 TB",
          region: "Ha Noi"
        },
        highlights: ["Windows bản quyền", "1 IPv4", "Deploy nhanh"]
      },
      {
        id: "vps-windows-business",
        label: "Business",
        description: "Chạy nhiều phiên RDP và phần mềm desktop nặng hơn.",
        price: 529000,
        compareAtPrice: 599000,
        isPopular: true,
        specs: {
          cpu: "6 vCPU",
          ram: "12 GB",
          storage: "180 GB NVMe",
          bandwidth: "6 TB",
          region: "Ha Noi / Ho Chi Minh"
        },
        highlights: ["Snapshot tuần", "Băng thông cao", "Ưu tiên hỗ trợ"]
      },
      {
        id: "vps-windows-ops",
        label: "Ops Team",
        description: "Vận hành nhiều tài khoản desktop hoặc tác vụ automation liên tục.",
        price: 829000,
        compareAtPrice: 899000,
        specs: {
          cpu: "8 vCPU",
          ram: "16 GB",
          storage: "300 GB NVMe",
          bandwidth: "8 TB",
          region: "Singapore"
        },
        highlights: ["Hiệu năng ổn định", "Queue riêng", "Windows tuning"]
      }
    ]
  },
  {
    id: "prod-vps-linux",
    name: "VPS Linux AMD",
    slug: "vps-linux-amd",
    shortDescription: "Máy chủ Linux chi phí tốt cho web app, API và Docker.",
    description:
      "VPS Linux AMD dùng kiến trúc hiệu năng tốt trên giá thành, phù hợp cho devops, web app, CI runner và stack Docker/Node nhanh gọn.",
    deliveryNotes: "Phù hợp người dùng thích tự triển khai stack bằng Docker, Nginx, Node hoặc PHP-FPM.",
    price: 159000,
    minPrice: 159000,
    maxPrice: 469000,
    compareAtPrice: 199000,
    type: "VPS",
    categoryId: "cat-vps-linux",
    image: "/images/vps-linux.svg",
    rating: 4.8,
    reviewsCount: 57,
    isFeatured: false,
    isHot: true,
    isPromotion: true,
    tags: ["AMD EPYC", "Docker ready", "Ubuntu"],
    specs: {
      cpu: "2 vCPU",
      ram: "4 GB",
      storage: "60 GB NVMe",
      bandwidth: "3 TB",
      os: "Ubuntu / Debian / AlmaLinux"
    },
    configurationOptions: [
      {
        id: "vps-linux-dev",
        label: "Dev Box",
        description: "Dành cho môi trường dev, staging và bot backend nhỏ.",
        price: 159000,
        compareAtPrice: 199000,
        specs: {
          cpu: "2 vCPU",
          ram: "4 GB",
          storage: "60 GB NVMe",
          bandwidth: "3 TB",
          region: "Ha Noi"
        },
        highlights: ["Docker ready", "SSH key deploy", "Chi phí thấp"]
      },
      {
        id: "vps-linux-app",
        label: "App Node",
        description: "Web app thực tế với Redis, queue nhẹ và reverse proxy.",
        price: 279000,
        compareAtPrice: 319000,
        isPopular: true,
        specs: {
          cpu: "4 vCPU",
          ram: "8 GB",
          storage: "120 GB NVMe",
          bandwidth: "4 TB",
          region: "Ha Noi / Ho Chi Minh"
        },
        highlights: ["NVMe nhanh", "Deploy API", "Snapshot tuần"]
      },
      {
        id: "vps-linux-ci",
        label: "CI Runner",
        description: "Runner build, automation hoặc nhiều container song song.",
        price: 469000,
        compareAtPrice: 519000,
        specs: {
          cpu: "8 vCPU",
          ram: "12 GB",
          storage: "200 GB NVMe",
          bandwidth: "6 TB",
          region: "Singapore"
        },
        highlights: ["Build cache tốt", "IOPS cao", "Băng thông lớn"]
      }
    ]
  },
  {
    id: "prod-cloud-server",
    name: "Cloud Server",
    slug: "cloud-server",
    shortDescription: "Mở rộng linh hoạt theo nhu cầu compute thực tế.",
    description:
      "Cloud Server phù hợp cho hệ thống cần scale linh hoạt, snapshot nhanh và mô hình thanh toán rõ ràng. Triển khai theo cụm để tăng độ sẵn sàng.",
    deliveryNotes: "Các cấu hình cloud được trình bày theo preset giống các website bán server phổ biến: chọn plan, node và hệ điều hành.",
    price: 499000,
    minPrice: 499000,
    maxPrice: 1199000,
    compareAtPrice: 590000,
    type: "CLOUD",
    categoryId: "cat-cloud-server",
    image: "/images/cloud-server.svg",
    rating: 4.7,
    reviewsCount: 73,
    isFeatured: true,
    isHot: false,
    isPromotion: true,
    tags: ["Scale linh hoạt", "Snapshot", "API ready"],
    configurationOptions: [
      {
        id: "cloud-server-s2",
        label: "S2 Compute",
        description: "Web app production nhỏ, cache cơ bản và API traffic vừa.",
        price: 499000,
        compareAtPrice: 590000,
        specs: {
          cpu: "4 vCPU",
          ram: "8 GB",
          storage: "160 GB NVMe",
          bandwidth: "5 TB",
          region: "Ho Chi Minh"
        },
        highlights: ["Snapshot nhanh", "Autoscale manual", "Node Việt Nam"]
      },
      {
        id: "cloud-server-s4",
        label: "S4 Scale",
        description: "Store online, panel nội bộ và stack có queue/worker.",
        price: 799000,
        compareAtPrice: 899000,
        isPopular: true,
        specs: {
          cpu: "8 vCPU",
          ram: "16 GB",
          storage: "320 GB NVMe",
          bandwidth: "8 TB",
          region: "Ho Chi Minh / Singapore"
        },
        highlights: ["Snapshot tức thời", "Node dự phòng", "Monitoring cơ bản"]
      },
      {
        id: "cloud-server-s8",
        label: "S8 Cluster",
        description: "Nhiều workload song song hoặc hệ thống cần headroom lớn.",
        price: 1199000,
        compareAtPrice: 1349000,
        specs: {
          cpu: "12 vCPU",
          ram: "24 GB",
          storage: "480 GB NVMe",
          bandwidth: "10 TB",
          region: "Singapore"
        },
        highlights: ["Cluster ready", "Private network", "Queue ưu tiên"]
      }
    ]
  },
  {
    id: "prod-cloud-gpu",
    name: "Cloud GPU",
    slug: "cloud-gpu",
    shortDescription: "GPU cloud cho AI, render và machine learning.",
    description:
      "Cloud GPU phục vụ training, inference và render với hiệu năng cao. Phù hợp cho studio nhỏ, nhóm AI và dự án cần burst compute.",
    deliveryNotes: "Chọn preset GPU theo nhu cầu inference, fine-tune hoặc render. Hệ thống sẽ cấp node tương ứng sau thanh toán.",
    price: 1499000,
    minPrice: 1499000,
    maxPrice: 3599000,
    compareAtPrice: 1699000,
    type: "CLOUD",
    categoryId: "cat-cloud-gpu",
    image: "/images/cloud-gpu.svg",
    rating: 4.8,
    reviewsCount: 49,
    isFeatured: false,
    isHot: true,
    isPromotion: false,
    tags: ["GPU mạnh", "AI workflow", "Burst compute"],
    configurationOptions: [
      {
        id: "cloud-gpu-inference",
        label: "Inference RTX",
        description: "Dành cho demo model, chatbot private và render nhẹ.",
        price: 1499000,
        compareAtPrice: 1699000,
        specs: {
          gpu: "RTX 3060 12 GB",
          cpu: "8 vCPU",
          ram: "16 GB",
          storage: "300 GB NVMe",
          region: "Singapore"
        },
        highlights: ["CUDA sẵn sàng", "Docker AI", "Burst theo nhu cầu"]
      },
      {
        id: "cloud-gpu-finetune",
        label: "Fine-tune Pro",
        description: "Phù hợp fine-tune LoRA, render video và tác vụ GPU nặng hơn.",
        price: 2399000,
        compareAtPrice: 2599000,
        isPopular: true,
        specs: {
          gpu: "RTX 4070 Ti",
          cpu: "12 vCPU",
          ram: "24 GB",
          storage: "500 GB NVMe",
          region: "Singapore / Tokyo"
        },
        highlights: ["GPU VRAM lớn", "Queue tài nguyên riêng", "Snapshot image"]
      },
      {
        id: "cloud-gpu-render",
        label: "Render Max",
        description: "Training ngắn hạn, render hoặc workload đồ họa chuyên sâu.",
        price: 3599000,
        compareAtPrice: 3899000,
        specs: {
          gpu: "RTX 4090",
          cpu: "16 vCPU",
          ram: "32 GB",
          storage: "700 GB NVMe",
          region: "Tokyo"
        },
        highlights: ["Hiệu năng cao", "Ổn định dài phiên", "Priority support"]
      }
    ]
  },
  {
    id: "prod-cloud-gaming",
    name: "Cloud Gaming",
    slug: "cloud-gaming",
    shortDescription: "Chơi game trên cloud với cấu hình cao và truy cập nhanh.",
    description:
      "Cloud Gaming dành cho người dùng cần hiệu năng đồ họa tốt mà không muốn đầu tư máy cấu hình cao. Giao diện setup đơn giản, hỗ trợ nhiều launcher.",
    deliveryNotes: "Chọn preset gaming theo launcher, FPS mục tiêu và khu vực node trước khi thêm vào giỏ.",
    price: 569000,
    minPrice: 569000,
    maxPrice: 1499000,
    compareAtPrice: 639000,
    type: "CLOUD",
    categoryId: "cat-cloud-gaming",
    image: "/images/cloud-gaming.svg",
    rating: 4.6,
    reviewsCount: 102,
    isFeatured: true,
    isHot: true,
    isPromotion: true,
    tags: ["Low latency", "Game launcher", "GPU ready"],
    configurationOptions: [
      {
        id: "cloud-gaming-lite",
        label: "Lite 1080p",
        description: "Dành cho game eSports, launcher nhẹ và trải nghiệm 1080p.",
        price: 569000,
        compareAtPrice: 639000,
        specs: {
          gpu: "RTX 3050",
          cpu: "6 vCPU",
          ram: "12 GB",
          storage: "200 GB NVMe",
          region: "Ho Chi Minh"
        },
        highlights: ["Latency thấp", "Launcher sẵn", "Streaming tối ưu"]
      },
      {
        id: "cloud-gaming-pro",
        label: "Pro 2K",
        description: "Nhiều game AAA, modpack và chất lượng hình ảnh tốt hơn.",
        price: 899000,
        compareAtPrice: 999000,
        isPopular: true,
        specs: {
          gpu: "RTX 4060",
          cpu: "8 vCPU",
          ram: "16 GB",
          storage: "320 GB NVMe",
          region: "Ho Chi Minh / Singapore"
        },
        highlights: ["Game AAA", "Nhiều launcher", "FPS ổn định"]
      },
      {
        id: "cloud-gaming-ultra",
        label: "Ultra 4K",
        description: "Gaming cao cấp hoặc stream song song với preset GPU mạnh hơn.",
        price: 1499000,
        compareAtPrice: 1649000,
        specs: {
          gpu: "RTX 4070",
          cpu: "10 vCPU",
          ram: "24 GB",
          storage: "500 GB NVMe",
          region: "Singapore"
        },
        highlights: ["4K ready", "Storage lớn", "Node ưu tiên"]
      }
    ]
  },
  {
    id: "prod-cloud-workstation",
    name: "Cloud Workstation",
    slug: "cloud-workstation",
    shortDescription: "Máy trạm cloud cho design, edit video và làm việc từ xa.",
    description:
      "Cloud Workstation phục vụ designer, editor và đội ngũ remote cần máy cấu hình mạnh luôn sẵn sàng mà không phụ thuộc máy cục bộ.",
    deliveryNotes: "Phù hợp Adobe, Figma, Blender và môi trường remote team cần máy trạm luôn online.",
    price: 899000,
    minPrice: 899000,
    maxPrice: 2199000,
    compareAtPrice: 999000,
    type: "CLOUD",
    categoryId: "cat-cloud-workstation",
    image: "/images/cloud-workstation.svg",
    rating: 4.7,
    reviewsCount: 35,
    isFeatured: true,
    isHot: false,
    isPromotion: false,
    tags: ["Remote desktop", "Creator", "GPU option"],
    configurationOptions: [
      {
        id: "cloud-workstation-creator",
        label: "Creator",
        description: "Dành cho Photoshop, Figma và các app sáng tạo hằng ngày.",
        price: 899000,
        compareAtPrice: 999000,
        specs: {
          gpu: "RTX 3050",
          cpu: "8 vCPU",
          ram: "16 GB",
          storage: "300 GB NVMe",
          region: "Ho Chi Minh"
        },
        highlights: ["Remote desktop mượt", "Nhiều app đồ họa", "Snapshot workspace"]
      },
      {
        id: "cloud-workstation-studio",
        label: "Studio",
        description: "Edit video 4K, After Effects hoặc nhiều file nặng song song.",
        price: 1499000,
        compareAtPrice: 1649000,
        isPopular: true,
        specs: {
          gpu: "RTX 4070",
          cpu: "12 vCPU",
          ram: "24 GB",
          storage: "500 GB NVMe",
          region: "Singapore"
        },
        highlights: ["Adobe optimized", "Storage lớn", "Hiệu năng ổn định"]
      },
      {
        id: "cloud-workstation-render",
        label: "Render Team",
        description: "Blender, Unreal hoặc studio nhỏ cần headroom đồ họa cao.",
        price: 2199000,
        compareAtPrice: 2399000,
        specs: {
          gpu: "RTX 4090",
          cpu: "16 vCPU",
          ram: "32 GB",
          storage: "700 GB NVMe",
          region: "Tokyo"
        },
        highlights: ["GPU mạnh", "Remote team ready", "Priority support"]
      }
    ]
  },
  {
    id: "prod-steam-wallet",
    name: "Steam Wallet 200K",
    slug: "steam-wallet-200k",
    shortDescription: "Gift card Steam nhận mã ngay sau thanh toán thành công.",
    description:
      "Steam Wallet 200K phù hợp để nạp ví nhanh, mua game hoặc DLC. Hệ thống tự động cấp mã và gửi email cho người mua sau khi đơn hoàn tất.",
    deliveryNotes: "Sau khi đơn hoàn tất, mã gift sẽ hiển thị trong chi tiết đơn hàng với nút sao chép nhanh.",
    price: 200000,
    compareAtPrice: 215000,
    type: "GIFTCARD",
    categoryId: "cat-steam",
    image: "/images/steam-wallet.svg",
    rating: 4.9,
    reviewsCount: 217,
    isFeatured: true,
    isHot: true,
    isPromotion: true,
    tags: ["Auto delivery", "Email code", "Steam"],
    denominationOptions: [{ label: "200.000đ", value: 200000 }]
  },
  {
    id: "prod-google-play",
    name: "Google Play 500K",
    slug: "google-play-500k",
    shortDescription: "Gift card Google Play cho app, game và nội dung số.",
    description:
      "Google Play 500K được cấp code tự động, phù hợp cho mua ứng dụng, game mobile và subscription trong hệ sinh thái Android.",
    deliveryNotes: "Mã gift card được lưu trong chi tiết đơn hàng và có thể sao chép nhanh trên mobile.",
    price: 500000,
    compareAtPrice: 525000,
    type: "GIFTCARD",
    categoryId: "cat-google-play",
    image: "/images/google-play.svg",
    rating: 4.7,
    reviewsCount: 91,
    isFeatured: false,
    isHot: false,
    isPromotion: false,
    tags: ["Android", "Nhanh", "Ổn định"],
    denominationOptions: [{ label: "500.000đ", value: 500000 }]
  },
  {
    id: "prod-app-store",
    name: "App Store 50 USD",
    slug: "app-store-50usd",
    shortDescription: "Nạp App Store và dịch vụ Apple bằng mã gift card.",
    description:
      "Gift card App Store 50 USD cho hệ sinh thái Apple, hỗ trợ người dùng cần thanh toán app, iCloud và subscription nhanh chóng.",
    deliveryNotes: "Mã gift hiển thị sau thanh toán thành công, có nút copy và ghi chú đổi quà rõ ràng.",
    price: 1290000,
    compareAtPrice: 1350000,
    type: "GIFTCARD",
    categoryId: "cat-app-store",
    image: "/images/app-store.svg",
    rating: 4.8,
    reviewsCount: 64,
    isFeatured: false,
    isHot: true,
    isPromotion: false,
    tags: ["Apple", "Digital code", "Global"],
    denominationOptions: [{ label: "50 USD", value: 1290000 }]
  },
  {
    id: "prod-garena",
    name: "Thẻ Garena 100K",
    slug: "the-garena-100k",
    shortDescription: "Thẻ Garena nạp nhanh cho game phổ biến tại Việt Nam.",
    description:
      "Thẻ Garena 100K được bán theo mô hình giao mã tức thời, phù hợp cho game thủ cần nạp nhanh và an toàn trong khung giờ cao điểm.",
    deliveryNotes: "Mã thẻ sẽ hiển thị trong chi tiết đơn hàng, ưu tiên thao tác sao chép nhanh trên điện thoại.",
    price: 100000,
    compareAtPrice: 105000,
    type: "GAMECARD",
    categoryId: "cat-garena",
    image: "/images/garena.svg",
    rating: 4.8,
    reviewsCount: 145,
    isFeatured: true,
    isHot: true,
    isPromotion: true,
    tags: ["Instant code", "Game top-up", "Popular"]
  },
  {
    id: "prod-zing",
    name: "Thẻ Zing 200K",
    slug: "the-zing-200k",
    shortDescription: "Mã thẻ Zing cho game online và dịch vụ giải trí.",
    description:
      "Thẻ Zing 200K giao mã tự động, tương thích nhiều cổng game và tối ưu luồng mua hàng đơn giản trên mobile.",
    deliveryNotes: "Mã thẻ được hiển thị thành khối riêng trong đơn hàng để người mua dễ xem lại.",
    price: 200000,
    compareAtPrice: 208000,
    type: "GAMECARD",
    categoryId: "cat-zing",
    image: "/images/zing.svg",
    rating: 4.6,
    reviewsCount: 52,
    isFeatured: false,
    isHot: false,
    isPromotion: false,
    tags: ["Nạp nhanh", "Mobile friendly", "Đa game"]
  },
  {
    id: "prod-funcard",
    name: "Funcard 500K",
    slug: "funcard-500k",
    shortDescription: "Funcard cho game thủ cần giao dịch ổn định và nhanh.",
    description:
      "Funcard 500K dành cho người dùng cần mã thẻ dung lượng lớn. Quy trình giao mã và đối soát đơn hàng được mock sẵn để tích hợp backend sau này.",
    deliveryNotes: "Phần chi tiết đơn sẽ có khối hiển thị mã thẻ và trạng thái giao tương ứng cho từng lệnh mua.",
    price: 500000,
    compareAtPrice: 518000,
    type: "GAMECARD",
    categoryId: "cat-funcard",
    image: "/images/funcard.svg",
    rating: 4.5,
    reviewsCount: 31,
    isFeatured: false,
    isHot: true,
    isPromotion: false,
    tags: ["Dung lượng lớn", "Ổn định", "Support nhanh"]
  }
];
